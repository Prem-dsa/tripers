/**
 * UPI Payment Helper
 * Generates UPI deep links and payment strings
 */

/**
 * Generate a UPI payment link
 * @param {string} upiId - Receiver's UPI ID
 * @param {string} name - Receiver's name
 * @param {number} amount - Amount in INR
 * @param {string} note - Payment note/description
 * @param {string} transactionId - Unique transaction ID
 * @returns {string} UPI deep link URL
 */
function generateUPILink({ upiId, name, amount, note = 'Tripers Settlement', transactionId = '' }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: amount.toFixed(2),
    tn: note,
    cu: 'INR',
    ...(transactionId && { tid: transactionId }),
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Generate UPI QR code data string
 */
function generateUPIQRData({ upiId, name, amount, note }) {
  return generateUPILink({ upiId, name, amount, note });
}

/**
 * Validate UPI ID format
 */
function validateUPIId(upiId) {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
  return upiRegex.test(upiId);
}

module.exports = { generateUPILink, generateUPIQRData, validateUPIId };
