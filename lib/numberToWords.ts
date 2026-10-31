/**
 * Utility to convert amounts to words (in Taka).
 */

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertBelowThousand(n: number): string {
  let str = "";
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + " ";
    n %= 10;
  }
  if (n > 0) {
    str += ones[n] + " ";
  }
  return str.trim();
}

export function amountInWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return "Zero Taka Only";
  const num = Math.floor(amount);

  // Bangladeshi numbering: Crore, Lakh, Thousand, Hundred
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const parts: string[] = [];

  if (crore > 0) parts.push(`${convertBelowThousand(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertBelowThousand(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertBelowThousand(thousand)} Thousand`);
  if (rem > 0) parts.push(convertBelowThousand(rem));

  return `${parts.join(" ")} Taka Only`;
}
