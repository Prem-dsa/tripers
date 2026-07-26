// Format currency with Indian number formatting
export function formatCurrency(amount, currency = 'INR') {
  if (currency === 'INR') {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return amount.toLocaleString('en-IN');
    return amount.toFixed(2);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatAmount(amount) {
  return `₹${formatCurrency(amount)}`;
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
];

export { CURRENCIES };

let exchangeRates = { INR: 1 };
let ratesFetched = false;

export async function getExchangeRates(base = 'INR') {
  if (ratesFetched) return exchangeRates;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const data = await res.json();
    if (data.result === 'success') {
      exchangeRates = data.rates;
      ratesFetched = true;
    }
  } catch { }
  return exchangeRates;
}

export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount;
  const inBase = amount / (rates[fromCurrency] || 1);
  return inBase * (rates[toCurrency] || 1);
}
