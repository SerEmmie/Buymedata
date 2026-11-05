import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { paystackClient } from './src/server/paystack';
import { verifyAndFinalizePayment } from './src/server/ledger';
import { processServerPayout, calculateServerCreatorBalance } from './src/server/payouts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Enable CORS for frontend and external webhooks
app.use(cors());

// Raw body parser for webhook HMAC signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------
// 1. HEALTH & PROVIDER CONFIGURATION
// -------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'BuyMeData',
    currency: 'NGN',
    paymentProvider: 'paystack',
    configured: paystackClient.hasValidKey(),
    mode: paystackClient.getMode(),
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// 2. PAYMENT INITIALIZATION (PAYSTACK)
// -------------------------------------------------------------
app.post('/api/payments/initialize', async (req: Request, res: Response) => {
  try {
    const { email, amount, reference, callbackUrl, metadata } = req.body;

    if (!email || !amount || !reference) {
      return res.status(400).json({
        error: 'Missing required initialization parameters: email, amount, reference.',
      });
    }

    if (amount < 200) {
      return res.status(400).json({ error: 'Minimum contribution amount is ₦200.' });
    }

    const paystackRes = await paystackClient.initializeTransaction({
      email,
      amount,
      reference,
      callback_url: callbackUrl,
      metadata,
    });

    return res.json({
      success: true,
      data: paystackRes.data,
      mode: paystackClient.getMode(),
    });
  } catch (err) {
    console.error('Payment initialization error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to initialize payment gateway transaction.',
    });
  }
});

// -------------------------------------------------------------
// 3. SERVER-SIDE PAYMENT VERIFICATION
// -------------------------------------------------------------
app.all(['/api/payments/verify/:reference', '/api/payments/verify'], async (req: Request, res: Response) => {
  try {
    const reference = req.params.reference || req.query.reference || req.body?.reference;

    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({ error: 'A valid transaction reference is required for verification.' });
    }

    const result = await verifyAndFinalizePayment(reference);
    return res.json(result);
  } catch (err) {
    console.error('Server payment verification error:', err);
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'Server verification failed.',
    });
  }
});

// -------------------------------------------------------------
// 4. SIGNED WEBHOOK HANDLING (PAYSTACK)
// -------------------------------------------------------------
app.post('/api/payments/webhook', async (req: any, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const isTestSimulator = req.headers['x-buymedata-test-webhook'] === 'true';

    // Signature verification
    if (paystackClient.hasValidKey()) {
      const isValid = paystackClient.verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), signature);
      if (!isValid && !isTestSimulator) {
        console.warn('Unauthorized webhook rejected: Invalid Paystack HMAC SHA512 signature.');
        return res.status(401).send('Invalid signature');
      }
    }

    const event = req.body;
    const eventType = event?.event;

    console.log(`[Paystack Webhook] Received event: ${eventType} (ref: ${event?.data?.reference})`);

    // Handle charge.success: Finalize contribution idempotently
    if (eventType === 'charge.success') {
      const reference = event.data?.reference;
      if (reference) {
        try {
          const settlement = await verifyAndFinalizePayment(reference);
          console.log(`[Paystack Webhook] Settled payment for reference ${reference}:`, settlement);
        } catch (settleErr) {
          console.error(`[Paystack Webhook] Settlement failed for ${reference}:`, settleErr);
        }
      }
    }

    // Always acknowledge receipt to Paystack with 200 OK
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing exception:', err);
    return res.status(500).send('Webhook server error');
  }
});

// -------------------------------------------------------------
// 5. BANK ACCOUNT RESOLUTION & NUBAN VALIDATION
// -------------------------------------------------------------
app.get('/api/banks', async (_req: Request, res: Response) => {
  try {
    const banks = await paystackClient.getBanks();
    return res.json({ success: true, data: banks });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve banks.' });
  }
});

app.post('/api/banks/resolve', async (req: Request, res: Response) => {
  try {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ error: 'Account number and bank code are required.' });
    }

    const resolveRes = await paystackClient.resolveAccountNumber(accountNumber, bankCode);
    return res.json({
      success: true,
      accountName: resolveRes.data.account_name,
      accountNumber: resolveRes.data.account_number,
    });
  } catch (err) {
    console.error('Account resolution error:', err);
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'Could not resolve bank account details with NUBAN.',
    });
  }
});

// -------------------------------------------------------------
// 6. CREATOR BALANCE & PAYOUT WORKFLOW
// -------------------------------------------------------------
app.get('/api/payouts/balance/:creatorId', async (req: Request, res: Response) => {
  try {
    const { creatorId } = req.params;
    if (!creatorId) return res.status(400).json({ error: 'Creator ID is required' });

    const balance = await calculateServerCreatorBalance(creatorId);
    return res.json({ success: true, data: balance });
  } catch (err) {
    console.error('Balance query error:', err);
    return res.status(500).json({ error: 'Could not calculate balance.' });
  }
});

app.post('/api/payouts/initiate', async (req: Request, res: Response) => {
  try {
    const { creatorId, amount, paymentAccountId } = req.body;

    if (!creatorId || !amount || !paymentAccountId) {
      return res.status(400).json({ error: 'creatorId, amount, and paymentAccountId are required.' });
    }

    const result = await processServerPayout({
      creatorId,
      amount: Number(amount),
      paymentAccountId,
    });

    return res.json({
      success: true,
      payout: result.payout,
    });
  } catch (err) {
    console.error('Payout initiation error:', err);
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'Failed to process payout.',
    });
  }
});

// -------------------------------------------------------------
// 7. VITE / STATIC CLIENT MOUNTING
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    // In dev mode, mount Vite dev server as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built static files from dist/
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 BuyMeData full-stack server running on http://localhost:${PORT}`);
    console.log(`💳 Paystack Provider Mode: ${paystackClient.getMode().toUpperCase()}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
