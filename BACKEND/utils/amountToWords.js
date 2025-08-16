function amountToWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(num) {
    if (num > 99) return `${ones[Math.floor(num / 100)]} Hundred ${convertTens(num % 100)}`;
    return convertTens(num);
  }

  function convertTens(num) {
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    return `${tens[Math.floor(num / 10)]} ${ones[num % 10]}`.trim();
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = '';

  if (rupees > 0) {
    words += `${convertHundreds(rupees)} Rupees`;
  }
  if (paise > 0) {
    words += words ? ' and ' : '';
    words += `${convertHundreds(paise)} Paise`;
  }

  return words ? `${words} Only` : 'Zero Rupees Only';
}

module.exports = amountToWords;