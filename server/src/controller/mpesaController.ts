import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { getAccessToken } from '../utils/mpesaAuth.js';
import { getMpesaTimestamp, getMpesaPassword } from '../utils/mpesaUtils.js';

dotenv.config();

interface MpesaCallbackItem {
  Name: string;
  Value: any;
}
interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: MpesaCallbackItem[];
      };
    };
  };
}

const mpesaStatusStore: { [mid: string]: { status: string, details?: any } } = {};

export const mpesaController = async (req: Request, res: Response) => {
  try {
    let number = req.body.phone.replace(/^0/, '');
    if (!number.startsWith('254')) number = `254${number}`;
    const amount = req.body.amount;

    // Use correct env variable names
    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE!;
    const passkey = process.env.MPESA_PASS_KEY || process.env.MPESA_PASSKEY; // match your .env
    const callbackUrl = process.env.MPESA_CALLBACK!;
    const consumerKey = process.env.MPESA_CONSUMER_KEY!;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;

    // Generate timestamp and password
    const timestamp = getMpesaTimestamp();
    const password = getMpesaPassword(
      shortCode,
      passkey!,
      timestamp
    );

    // Safaricom access token
    const access_token = await getAccessToken(
      consumerKey,
      consumerSecret,
      false // sandbox
    );
    if (!access_token) {
      return res.status(401).json({ error: "Access token missing" });
    }

    const stkPushBody = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: String(amount),
      PartyA: number,
      PartyB: shortCode,
      PhoneNumber: number,
      CallBackURL: callbackUrl,
      AccountReference: "DotRamp",
      TransactionDesc: "Buy Crypto"
    };

    const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const stkResponse = await axios.post(stkUrl, stkPushBody, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });
    const stkData = stkResponse.data;

    if (stkData.MerchantRequestID) {
      mpesaStatusStore[stkData.MerchantRequestID] = { status: "pending" };
    }

    res.json(stkData);

    if (stkData.ResponseCode === "0" && stkData.CheckoutRequestID) {
      const requestID = stkData.CheckoutRequestID;
      const queryEndpoint = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';
      const queryPayload = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: requestID
      };
      const merchantID = stkData.MerchantRequestID;

      let numTries = 0, maxTries = 8;
      const pollStatus = async () => {
        try {
          const queryResult = await axios.post(queryEndpoint, queryPayload, {
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            }
          });
          const resultCode = queryResult.data.ResultCode;
          const resultDesc = queryResult.data.ResultDesc;
          if (resultCode == '0') {
            mpesaStatusStore[merchantID] = { status: 'success', details: queryResult.data };
            return;
          } else if (resultCode === '1032') {
            mpesaStatusStore[merchantID] = { status: 'cancelled', details: queryResult.data };
            return;
          } else if (resultCode === '1') {
            mpesaStatusStore[merchantID] = { status: 'failed', details: queryResult.data };
            return;
          } else {
            numTries++;
            if (numTries < maxTries) {
              setTimeout(pollStatus, 15000);
            } else {
              mpesaStatusStore[merchantID] = { status: 'failed', details: queryResult.data };
            }
          }
        } catch (error: any) {
          numTries++;
          if (numTries < maxTries) {
            setTimeout(pollStatus, 15000);
          } else {
            mpesaStatusStore[merchantID] = { status: 'failed', details: error.response?.data || error.message };
          }
        }
      };
      setTimeout(pollStatus, 15000);
    }
  } catch (error: any) {
    console.error("STK Push Error:", error.response?.data || error.message);
    const errorMessage = error.response?.data?.errorMessage || error.message;
    res.status(500).json({
      type: "failed",
      heading: "Error sending the push request",
      desc: errorMessage
    });
  }
};

export const callbackUrlController = (req: Request, res: Response) => {
  const callbackData = req.body as MpesaCallback;
  const { stkCallback } = callbackData.Body;
  const merchantRequestId = stkCallback.MerchantRequestID;
  const result_code = stkCallback.ResultCode;

  console.log(merchantRequestId)
  console.log(stkCallback)

  if (merchantRequestId) {
    if (result_code === 0) {
      mpesaStatusStore[merchantRequestId] = { status: "success", details: stkCallback };
    } else if (stkCallback.ResultDesc && stkCallback.ResultDesc.toLowerCase().includes("cancelled")) {
      mpesaStatusStore[merchantRequestId] = { status: "cancelled", details: stkCallback };
    } else {
      mpesaStatusStore[merchantRequestId] = { status: "failed", details: stkCallback };
    }
  }

  res.json("success");
};

export const mpesaStatusController = (req: Request, res: Response) => {
  let merchantRequestId = req.query.merchantRequestId;
  if (Array.isArray(merchantRequestId)) merchantRequestId = merchantRequestId[0];
  if (typeof merchantRequestId !== "string" || !merchantRequestId) {
    return res.status(400).json({ status: "unknown", error: "Missing merchantRequestId" });
  }
  const record = mpesaStatusStore[merchantRequestId];
  if (!record) {
    return res.json({ status: "pending" });
  }
  return res.json({ status: record.status, details: record.details });
};
