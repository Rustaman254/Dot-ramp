export function getMpesaTimestamp() {
    const date = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return date.getFullYear().toString()
        + pad(date.getMonth() + 1)
        + pad(date.getDate())
        + pad(date.getHours())
        + pad(date.getMinutes())
        + pad(date.getSeconds());
}
export function getMpesaPassword(shortCode, passkey, timestamp) {
    return Buffer.from(shortCode + passkey + timestamp).toString('base64');
}
//# sourceMappingURL=mpesaUtils.js.map