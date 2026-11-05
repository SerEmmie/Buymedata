import { NigerianBank } from '../types';

export const SUPPORTED_NIGERIAN_BANKS: NigerianBank[] = [
  { name: 'Access Bank', code: '044', slug: 'access-bank' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', slug: 'gtbank' },
  { name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
  { name: 'First Bank of Nigeria', code: '011', slug: 'first-bank' },
  { name: 'United Bank for Africa (UBA)', code: '033', slug: 'uba' },
  { name: 'Kuda Bank', code: '50211', slug: 'kuda-bank' },
  { name: 'OPay Digital Services', code: '999992', slug: 'opay' },
  { name: 'Moniepoint Microfinance Bank', code: '50515', slug: 'moniepoint' },
  { name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc' },
  { name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank' },
  { name: 'First City Monument Bank (FCMB)', code: '214', slug: 'fcmb' },
  { name: 'Sterling Bank', code: '232', slug: 'sterling-bank' },
  { name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank' },
  { name: 'Wema Bank (ALAT)', code: '035', slug: 'wema-bank' },
  { name: 'PalmPay', code: '999991', slug: 'palmpay' },
  { name: 'Providus Bank', code: '101', slug: 'providus-bank' },
];

/**
 * Simulates resolving bank account details in sandbox mode
 */
export async function simulateResolveAccount(accountNumber: string, bankCode: string): Promise<{ accountName: string; valid: boolean }> {
  // Realistic check
  if (!/^\d{10}$/.test(accountNumber)) {
    return { accountName: '', valid: false };
  }
  
  // Deterministic name for testing
  const bank = SUPPORTED_NIGERIAN_BANKS.find(b => b.code === bankCode);
  const bankShort = bank ? bank.name.split(' ')[0] : 'Bank';
  
  // Artificial network delay to feel authentic
  await new Promise(res => setTimeout(res, 600));

  const sampleNames = [
    'ADEKUNLE SAMUEL OLUWASEUN',
    'CHINAZA GRACE NWOSU',
    'IBRAHIM MUSA BELLO',
    'FATIMA ABUBAKAR DANGOTE',
    'EMMANUEL OBIORA EZE',
  ];
  
  const charCodeSum = accountNumber.split('').reduce((sum, ch) => sum + parseInt(ch, 10), 0);
  const resolvedName = sampleNames[charCodeSum % sampleNames.length];

  return {
    accountName: `${resolvedName} (${bankShort})`,
    valid: true,
  };
}
