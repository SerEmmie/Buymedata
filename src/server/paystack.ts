import crypto from 'crypto';

export interface PaystackInitParams {
  email: string;
  amount: number; // in NGN (will be converted to kobo: amount * 100)
  reference: string;
  callback_url?: string;
  channels?: string[];
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: 'test' | 'live';
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number; // in kobo
    gateway_response: string;
    paid_at: string;
    channel: string;
    currency: string;
    ip_address?: string;
    metadata?: Record<string, unknown>;
    customer: {
      email: string;
      customer_code?: string;
    };
  };
}

export interface PaystackBank {
  name: string;
  slug: string;
  code: string;
  longcode?: string;
  gateway?: string;
  pay_with_bank?: boolean;
  active: boolean;
  is_deleted?: boolean;
  country?: string;
  currency?: string;
  type?: string;
}

export interface PaystackResolveAccountResponse {
  status: boolean;
  message: string;
  data: {
    account_number: string;
    account_name: string;
    bank_id?: number;
  };
}

export interface PaystackTransferRecipientResponse {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    name: string;
    recipient_code: string;
    type: string;
    updatedAt: string;
    details: {
      account_number: string;
      account_name: string;
      bank_code: string;
      bank_name: string;
    };
  };
}

export interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: {
    amount: number;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    reason: string;
    reference: string;
    source: string;
    status: 'pending' | 'success' | 'failed';
    transfer_code: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class PaystackClient {
  private secretKey: string;
  private isConfigured: boolean;
  private isTestMode: boolean;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.isConfigured = Boolean(this.secretKey && this.secretKey.startsWith('sk_'));
    this.isTestMode = !this.isConfigured || this.secretKey.startsWith('sk_test_') || process.env.PAYMENT_MODE === 'test';
  }

  public getSecretKey(): string {
    return this.secretKey;
  }

  public hasValidKey(): boolean {
    return this.isConfigured;
  }

  public getMode(): 'test' | 'live' {
    return this.isTestMode ? 'test' : 'live';
  }

  /**
   * Initializes a transaction with Paystack API.
   * Conforms to official Paystack Transaction Initialize API.
   */
  public async initializeTransaction(params: PaystackInitParams): Promise<PaystackInitResponse> {
    const amountInKobo = Math.round(params.amount * 100);

    // If configured with real Paystack secret key, make direct API call
    if (this.isConfigured) {
      try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: params.email,
            amount: amountInKobo,
            currency: 'NGN',
            reference: params.reference,
            callback_url: params.callback_url,
            channels: params.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
            metadata: params.metadata || {},
          }),
        });

        const data = (await response.json()) as PaystackInitResponse;
        if (!response.ok || !data.status) {
          throw new Error(data.message || `Paystack initialization failed with HTTP ${response.status}`);
        }

        return data;
      } catch (err) {
        console.error('Paystack initialization error:', err);
        throw err;
      }
    }

    // Sandbox / Test Mode fallback when API key is not yet set up
    const accessCode = `pstk_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      status: true,
      message: 'Authorization URL created (Sandbox Test Mode)',
      data: {
        authorization_url: `https://checkout.paystack.com/${accessCode}`,
        access_code: accessCode,
        reference: params.reference,
      },
    };
  }

  /**
   * Verifies a transaction with Paystack official Verification endpoint.
   * NEVER trusts client-claimed payment status.
   */
  public async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (this.isConfigured) {
      try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        });

        const data = (await response.json()) as PaystackVerifyResponse;
        if (!response.ok || !data.status) {
          throw new Error(data.message || `Paystack verification failed with HTTP ${response.status}`);
        }

        return data;
      } catch (err) {
        console.error('Paystack transaction verification error:', err);
        throw err;
      }
    }

    // In sandbox test mode, validate reference structure
    if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
      throw new Error('Invalid payment reference provided for verification');
    }

    return {
      status: true,
      message: 'Verification successful (Sandbox Test Mode)',
      data: {
        id: Math.floor(Math.random() * 100000000),
        domain: 'test',
        status: 'success',
        reference,
        amount: 0, // Server will cross-verify with DB contribution amount
        gateway_response: 'Successful (Sandbox Test)',
        paid_at: new Date().toISOString(),
        channel: 'card',
        currency: 'NGN',
        customer: {
          email: 'supporter@example.com',
        },
      },
    };
  }

  /**
   * Verifies the authenticity of a Paystack webhook event using HMAC SHA512.
   * Compares the x-paystack-signature header with a cryptographic hash of the raw body.
   */
  public verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
    if (!signatureHeader || !this.secretKey) {
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha512', this.secretKey);
      const computedSignature = hmac.update(rawBody).digest('hex');

      const expectedBuffer = Buffer.from(computedSignature, 'utf8');
      const actualBuffer = Buffer.from(signatureHeader, 'utf8');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch (err) {
      console.error('Error verifying Paystack webhook signature:', err);
      return false;
    }
  }

  /**
   * Resolves a Nigerian bank account number with Paystack NUBAN API.
   * Validates account name against NIBSS records.
   */
  public async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<PaystackResolveAccountResponse> {
    if (this.isConfigured) {
      try {
        const response = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
            accountNumber
          )}&bank_code=${encodeURIComponent(bankCode)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = (await response.json()) as PaystackResolveAccountResponse;
        if (!response.ok || !data.status) {
          throw new Error(data.message || 'Could not resolve account details with NUBAN registry');
        }

        return data;
      } catch (err) {
        console.error('Paystack account resolution error:', err);
        throw err;
      }
    }

    // Sandbox test mode response
    return {
      status: true,
      message: 'Account details resolved successfully (Sandbox Mode)',
      data: {
        account_number: accountNumber,
        account_name: 'TEST RECIPIENT ACCOUNT',
      },
    };
  }

  /**
   * Creates a Transfer Recipient for payouts on Paystack.
   */
  public async createTransferRecipient(params: {
    accountName: string;
    accountNumber: string;
    bankCode: string;
  }): Promise<PaystackTransferRecipientResponse> {
    if (this.isConfigured) {
      try {
        const response = await fetch('https://api.paystack.co/transferrecipient', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'nuban',
            name: params.accountName,
            account_number: params.accountNumber,
            bank_code: params.bankCode,
            currency: 'NGN',
          }),
        });

        const data = (await response.json()) as PaystackTransferRecipientResponse;
        if (!response.ok || !data.status) {
          throw new Error(data.message || 'Failed to create transfer recipient on Paystack');
        }

        return data;
      } catch (err) {
        console.error('Paystack transfer recipient error:', err);
        throw err;
      }
    }

    const code = `RCP_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      status: true,
      message: 'Recipient created (Sandbox Test Mode)',
      data: {
        active: true,
        createdAt: new Date().toISOString(),
        currency: 'NGN',
        domain: 'test',
        id: Math.floor(Math.random() * 100000),
        integration: 10001,
        name: params.accountName,
        recipient_code: code,
        type: 'nuban',
        updatedAt: new Date().toISOString(),
        details: {
          account_number: params.accountNumber,
          account_name: params.accountName,
          bank_code: params.bankCode,
          bank_name: 'Verified Nigerian Bank',
        },
      },
    };
  }

  /**
   * Initiates a transfer payout on Paystack.
   */
  public async initiateTransfer(params: {
    amount: number; // in NGN
    recipientCode: string;
    reason: string;
    reference: string;
  }): Promise<PaystackTransferResponse> {
    const amountInKobo = Math.round(params.amount * 100);

    if (this.isConfigured) {
      try {
        const response = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'balance',
            amount: amountInKobo,
            recipient: params.recipientCode,
            reason: params.reason,
            reference: params.reference,
          }),
        });

        const data = (await response.json()) as PaystackTransferResponse;
        if (!response.ok || !data.status) {
          throw new Error(data.message || 'Failed to initiate transfer with Paystack');
        }

        return data;
      } catch (err) {
        console.error('Paystack initiate transfer error:', err);
        throw err;
      }
    }

    const transferCode = `TRF_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      status: true,
      message: 'Transfer initiated (Sandbox Test Mode)',
      data: {
        amount: amountInKobo,
        currency: 'NGN',
        domain: 'test',
        id: Math.floor(Math.random() * 100000),
        integration: 10001,
        reason: params.reason,
        reference: params.reference,
        source: 'balance',
        status: 'success',
        transfer_code: transferCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Fetches official list of Nigerian commercial banks from Paystack.
   */
  public async getBanks(): Promise<PaystackBank[]> {
    if (this.isConfigured) {
      try {
        const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        });

        const data = (await response.json()) as { status: boolean; data: PaystackBank[] };
        if (response.ok && data.status && Array.isArray(data.data)) {
          return data.data.filter((b) => b.active);
        }
      } catch (err) {
        console.warn('Could not fetch banks from Paystack API, falling back to local list:', err);
      }
    }

    // Default commercial banks fallback
    return [
      { name: 'Access Bank', slug: 'access-bank', code: '044', active: true },
      { name: 'GTBank (Guaranty Trust Bank)', slug: 'gtbank', code: '058', active: true },
      { name: 'First Bank of Nigeria', slug: 'first-bank', code: '011', active: true },
      { name: 'Zenith Bank', slug: 'zenith-bank', code: '057', active: true },
      { name: 'United Bank for Africa (UBA)', slug: 'uba', code: '033', active: true },
      { name: 'Kuda Bank', slug: 'kuda-bank', code: '50211', active: true },
      { name: 'OPay', slug: 'opay', code: '999992', active: true },
      { name: 'PalmPay', slug: 'palmpay', code: '999991', active: true },
      { name: 'Stanbic IBTC Bank', slug: 'stanbic-ibtc', code: '221', active: true },
      { name: 'Fidelity Bank', slug: 'fidelity-bank', code: '070', active: true },
      { name: 'Sterling Bank', slug: 'sterling-bank', code: '232', active: true },
      { name: 'Wema Bank (ALAT)', slug: 'wema-bank', code: '035', active: true },
      { name: 'Moniepoint Microfinance Bank', slug: 'moniepoint', code: '50515', active: true },
    ];
  }
}

export const paystackClient = new PaystackClient();
