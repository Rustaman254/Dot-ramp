export function getMpesaTimestamp(): string {
  const date = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return date.getFullYear().toString()
    + pad(date.getMonth() + 1)
    + pad(date.getDate())
    + pad(date.getHours())
    + pad(date.getMinutes())
    + pad(date.getSeconds());
}

export function getMpesaPassword(shortCode: string, passkey: string, timestamp: string): string {
  return Buffer.from(shortCode + passkey + timestamp).toString('base64');
}
