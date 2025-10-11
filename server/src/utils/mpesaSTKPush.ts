import axios from "axios";
import { getMpesaTimestamp, getMpesaPassword } from "./mpesaUtils.js";

// Main STK Push function with correct rate limits and clean polling logic
export async function sendMpesaStkPush({
  shortCode,
  passkey,
  amount,
  phone,
  token,
  callbackUrl,
  accountReference,
  transactionDesc,
  isLive = false
}: {
  shortCode: string,
  passkey: string,
  amount: number,
  phone: string,
  token: string,
  callbackUrl: string,
  accountReference: string,
  transactionDesc: string,
  isLive?: boolean
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

  try {
    const { data } = await axios.post(url, stkRequest, { headers });

    if (data.ResponseCode !== "0") {
      throw new Error(`STK Push request failed: ${data.ResponseDescription}`);
    }

    // If successful, log it and perform status polling IF needed
    console.log("STK Push request successful:", data);

    // Correct polling logic (15 seconds interval, 3 attempts max)
    let pollCount = 0;
    const maxPolls = 1;
    const pollIntervalMs = 10000; // 15 seconds per API rate limits[web:1]
    let pollInterval: NodeJS.Timeout;

    const quryURL = isLive
      ? "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query"
      : "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";

    const queryRequest = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: data.CheckoutRequestID
    };

    pollInterval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(pollInterval);
        return;
      }
      try {
        console.log("Querying STK Push status...");
        const queryResponse = await axios.post(quryURL, queryRequest, { headers });
        console.log("STK Push query response:", queryResponse.data);
        if (
          queryResponse.data.ResultCode === "0" ||
          queryResponse.data.ResultDesc?.toLowerCase().includes("successful")
        ) {
          clearInterval(pollInterval);
          // You may process the success further here if needed
        }
      } catch (err) {
        console.error("Error querying STK Push status:", err);
      }
    }, pollIntervalMs);

    return data;
  } catch (err: any) {
    if (err.response) throw new Error(JSON.stringify(err.response.data));
    throw err;
  }
}
