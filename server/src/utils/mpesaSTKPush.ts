import axios from "axios";
import { getMpesaTimestamp, getMpesaPassword } from "./mpesaUtils.js";

export async function sendMpesaStkPush({
  shortCode,
  passkey,
  amount,
  phone,
  token,
  callbackUrl,
  accountReference,
  transactionDesc,
  isLive = false,
  statusStore
}: {
  shortCode: string,
  passkey: string,
  amount: number,
  phone: string,
  token: string,
  callbackUrl: string,
  accountReference: string,
  transactionDesc: string,
  isLive?: boolean,
  statusStore?: any // this will be your mpesaStatusStore object
}) {
  const timestamp = getMpesaTimestamp();
  const password = getMpesaPassword(shortCode, passkey, timestamp);
  const url = isLive
    ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
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
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const { data } = await axios.post(url, stkRequest, { headers });
  if (data.ResponseCode !== "0") {
    throw new Error(`STK Push request failed: ${data.ResponseDescription}`);
  }

  // For tutorial-style backend polling ONLY ON SANDBOX
  if (!isLive && data.CheckoutRequestID && statusStore) {
    const queryURL = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
    const queryRequest = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: data.CheckoutRequestID
    };
    setTimeout(async () => {
      try {
        const queryResponse = await axios.post(queryURL, queryRequest, { headers });
        // If user already paid/cancelled, callback will have set status, so only update if pending
        if (statusStore[data.MerchantRequestID]?.status === "pending") {
          const result = queryResponse.data;
          if (result.ResultCode === "0") {
            statusStore[data.MerchantRequestID] = { status: "success", details: result };
          } else if (result.ResultCode === "1032") {
            statusStore[data.MerchantRequestID] = { status: "cancelled", details: result };
          } else if (result.ResultCode === "1") {
            statusStore[data.MerchantRequestID] = { status: "failed", details: result };
          } else {
            statusStore[data.MerchantRequestID] = { status: "failed", details: result };
          }
        }
      } catch (err) {
        // If polling fails, leave status as pending (let frontend/user retry or use callback)
      }
    }, 15000); // 15 seconds, then check once
  }

  return data;
}
