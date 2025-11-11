import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { getAccessToken } from '../utils/mpesaAuth.js';
import { getMpesaTimestamp, getMpesaPassword } from '../utils/mpesaUtils.js';
dotenv.config();

// Endpoints
const PASEO_RELAY_ENDPOINT = 'wss://paseo.rpc.amforc.com'; // Paseo Relay Chain
const PASEO_ASSET_HUB_ENDPOINT = 'wss://pas-rpc.stakeworld.io/assethub'; // Paseo Asset Hub
const MNEMONIC = process.env.ADMIN_MNEMONIC as string;

const ASSET_IDS: { [key: string]: number } = {
  USDT: 1984,
  USDC: 1337,
};

let relayApi: ApiPromise | null = null;
let assetHubApi: ApiPromise | null = null;

function sanitizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().replace(/\s+/g, ' ').toLowerCase();
}

const connectRelay = async (): Promise<void> => {
  if (!relayApi) {
    const ws = new WsProvider(PASEO_RELAY_ENDPOINT, undefined, { ttl: null });
    relayApi = await ApiPromise.create({ provider: ws });
    await relayApi.isReady;
    console.log('Connected to Paseo Relay Chain');
  }
};

const connectAssetHub = async (): Promise<void> => {
  if (!assetHubApi) {
    const ws = new WsProvider(PASEO_ASSET_HUB_ENDPOINT, undefined, { ttl: null });
    assetHubApi = await ApiPromise.create({ provider: ws });
    await assetHubApi.isReady;
    console.log('Connected to Paseo Asset Hub');
  }
};

interface PayoutBody {
  address: string;
  amount: string;
  token: string;
}

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

const mpesaStatusStore: { [mid: string]: { status: string; details?: any } } = {};

export const mpesaController = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    let number = req.body.phone.replace(/^0/, '');
    if (!number.startsWith('254')) number = `254${number}`;
    const amount = req.body.amount;

    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE!;
    const passkey = process.env.MPESA_PASS_KEY || process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK!;
    const consumerKey = process.env.MPESA_CONSUMER_KEY!;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;

    const timestamp = getMpesaTimestamp();
    const password = getMpesaPassword(shortCode, passkey!, timestamp);

    const access_token = await getAccessToken(consumerKey, consumerSecret, false);
    if (!access_token) {
      return res.status(401).json({ error: 'Access token missing' });
    }

    const stkPushBody = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: String(amount),
      PartyA: number,
      PartyB: shortCode,
      PhoneNumber: number,
      CallBackURL: callbackUrl,
      AccountReference: 'DotRamp',
      TransactionDesc: 'Buy Crypto'
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
      mpesaStatusStore[stkData.MerchantRequestID] = { status: 'pending' };
    }
    res.json(stkData);

    if (stkData.ResponseCode === '0' && stkData.CheckoutRequestID) {
      const requestID = stkData.CheckoutRequestID;
      const queryEndpoint = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';
      const queryPayload = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: requestID,
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
    res.status(500).json({
      type: 'failed',
      heading: 'Error sending the push request',
      desc: error.response?.data?.errorMessage || error.message
    });
  }
};

/**
 * POST /api/v1/mpesa/callback
 */
export const callbackUrlController = (
  req: Request,
  res: Response
): Response => {
  const callbackData = req.body as MpesaCallback;
  const { stkCallback } = callbackData.Body;
  const merchantRequestId = stkCallback.MerchantRequestID;
  const result_code = stkCallback.ResultCode;

  if (merchantRequestId) {
    if (result_code === 0) {
      mpesaStatusStore[merchantRequestId] = { status: 'success', details: stkCallback };
    } else if (stkCallback.ResultDesc && stkCallback.ResultDesc.toLowerCase().includes('cancelled')) {
      mpesaStatusStore[merchantRequestId] = { status: 'cancelled', details: stkCallback };
    } else {
      mpesaStatusStore[merchantRequestId] = { status: 'failed', details: stkCallback };
    }
  }
  return res.json('success');
};

/**
 * GET /api/v1/mpesa/status?merchantRequestId=XXXXX
 */
export const mpesaStatusController = (
  req: Request,
  res: Response
): Response => {
  let merchantRequestId = req.query.merchantRequestId;
  if (Array.isArray(merchantRequestId)) merchantRequestId = merchantRequestId[0];
  if (typeof merchantRequestId !== 'string' || !merchantRequestId) {
    return res.status(400).json({ status: 'unknown', error: 'Missing merchantRequestId' });
  }
  const record = mpesaStatusStore[merchantRequestId];
  if (!record) {
    return res.json({ status: 'pending' });
  }
  return res.json({ status: record.status, details: record.details });
};

/**
 * POST /api/v1/payout
 * Sends a payout to a Polkadot/Paseo address.
 * For DOT: uses Paseo Relay Chain
 * For USDT/USDC/DAI: uses Paseo Asset Hub
 */
export const payout = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  console.log("payout hit");
  try {
    const { address, amount, token }: PayoutBody = req.body;

    if (!address || !amount || !token) {
      return res.status(400).json({
        status: 'failed',
        error: 'Missing address, amount, or token'
      });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        status: 'failed',
        error: 'Amount must be a positive number'
      });
    }

    // Fix: Sanitize the mnemonic before using!
    const keyring = new Keyring({ type: 'sr25519' });
    const safeMnemonic = sanitizeMnemonic(process.env.ADMIN_MNEMONIC as string);

    // (Optional) Validate and log
    const { mnemonicValidate } = await import('@polkadot/util-crypto');
    if (!mnemonicValidate(safeMnemonic)) {
      return res.status(400).json({
        status: 'failed',
        error: 'BIP39 mnemonic failed validation after cleanup'
      });
    }

    const sender = keyring.addFromUri(safeMnemonic);

    // Proceed as before. For brevity, only showing the "connect + transfer" logic, not the MPESA code

    if (token === 'DOT') {
      await connectRelay();
      if (!relayApi) {
        return res.status(500).json({
          status: 'failed',
          error: 'Relay chain API not initialized'
        });
      }
      const planck = BigInt(Math.floor(amountNum * 1e10));
      const tx = relayApi.tx.balances.transferKeepAlive(address, planck.toString());
      console.log(`Sending ${amount} DOT to ${address}`);

      const unsub = await tx.signAndSend(sender, ({ status, dispatchError }) => {
        if (status.isInBlock) {
          const blockHash = status.asInBlock.toHex();
          console.log(`Transaction included in block: ${blockHash}`);
          unsub();
          res.json({
            status: 'success',
            block: blockHash,
            token: token,
            amount: amount,
            assetId: assetId,
            chain: 'Paseo Asset Hub'
          });
        } else if (dispatchError) {
          unsub();
          res.status(500).json({
            status: 'failed',
            error: dispatchError.toString()
          });
        } else {
          console.log(`Transaction status: ${status.type}`);
        }
      });

    } else if (token === 'USDT' || token === 'USDC' || token === 'DAI') {
      await connectAssetHub();
      if (!assetHubApi) {
        return res.status(500).json({
          status: 'failed',
          error: 'Asset Hub API not initialized'
        });
      }
      const assetId = ASSET_IDS[token];
      if (!assetId) {
        return res.status(400).json({
          status: 'failed',
          error: `Asset ID not configured for ${token}`
        });
      }
      const decimals = (token === 'DAI') ? 18 : 6;
      const assetAmount = BigInt(Math.floor(amountNum * Math.pow(10, decimals)));

      const tx = assetHubApi.tx.assets.transfer(assetId, address, assetAmount.toString());
      console.log(`Sending ${amount} ${token} (Asset ID: ${assetId}) to ${address}`);

      const unsub = await tx.signAndSend(sender, ({ status, dispatchError }) => {
        console.log(`unsub: ${unsub}`);
        if (status.isInBlock) {
          console.log(`Transaction included in block: ${status.asInBlock.toHex()}`);
          unsub();
          res.json({
            status: 'success',
            block: status.asInBlock.toHex(),
            token: token,
            amount: amount,
            assetId: assetId,
            chain: 'Paseo Asset Hub'
          });
        } else if (dispatchError) {
          unsub();
          res.status(500).json({
            status: 'failed',
            error: dispatchError.toString()
          });
        }
      });
    } else {
      return res.status(400).json({
        status: 'failed',
        error: `Unsupported token: ${token}`
      });
    }
  } catch (e: any) {
    res.status(500).json({
      status: 'failed',
      error: e.message || String(e)
    });
  }
};