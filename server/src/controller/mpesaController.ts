import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import { getAccessToken } from '../utils/mpesaAuth.js';
import { sendMpesaStkPush } from '../utils/mpesaSTKPush.js';

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


export const mpesaController = async (req: Request, res: Response) => {
  const { amount, phone } = req.body;
  try {
    const shortCode = "174379"!;
    const passkey = process.env.MPESA_PASS_KEY!;
    const callbackUrl = process.env.MPESA_CALLBACK!;
    const consumerKey = process.env.MPESA_CONSUMER_KEY!;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
    const accountReference = "DotRamp";
    const transactionDesc = "Buy Crypto";

    const token = await getAccessToken(consumerKey, consumerSecret, false);

    const response = await sendMpesaStkPush({
      shortCode,
      passkey,
      amount,
      phone,
      token,
      callbackUrl,
      accountReference,
      transactionDesc,
      isLive: false
    });

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
}

export const callbackUrlController = (req: Request, res: Response) => {
  const callbackData = req.body as MpesaCallback;

  const { stkCallback } = callbackData.Body;

  console.log("Mpesa STK Push Callback Data:", stkCallback);

  const result_code = stkCallback.ResultCode;
  if (result_code !== 0) {
    // If the result code is not 0, there was an error
    const error_message = stkCallback.ResultDesc;
    const response_data = { ResultCode: result_code, ResultDesc: error_message };
    return res.json(response_data);
  }

  // If CallbackMetadata is missing, handle gracefully
  if (!stkCallback.CallbackMetadata?.Item) {
    return res.status(400).json({ error: "Missing CallbackMetadata in callback." });
  }

  const itemList = stkCallback.CallbackMetadata.Item;
  console.log("Mpesa STK Push Callback Item List:", itemList);

  // Helper to get value by name
  const getValue = (name: string) =>
    itemList.find(obj => obj.Name === name)?.Value || null;

  const amount = getValue('Amount');
  const mpesaCode = getValue('MpesaReceiptNumber');
  const phone = getValue('PhoneNumber');

  // You can now use amount, mpesaCode, and phone as needed (e.g., store in DB)

  return res.json("success");
};