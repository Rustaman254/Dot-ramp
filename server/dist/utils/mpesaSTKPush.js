// utils/mpesaStkPush.ts
import axios from "axios";
import { getMpesaTimestamp, getMpesaPassword } from "../utils/mpesaUtils.js";
export async function sendMpesaStkPush({ shortCode, passkey, amount, phone, token, callbackUrl, accountReference, transactionDesc }) {
    const timestamp = getMpesaTimestamp();
    const password = getMpesaPassword(shortCode, passkey, timestamp);
    const stkRequest = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount),
        PartyA: phone,
        PartyB: shortCode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
    };
    const { data } = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", stkRequest, { headers: { Authorization: `Bearer ${token}` } });
    return data;
}
//# sourceMappingURL=mpesaSTKPush.js.map