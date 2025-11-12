import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { getAccessToken } from '../utils/mpesaAuth.js';
import { getMpesaTimestamp, getMpesaPassword } from '../utils/mpesaUtils.js';
dotenv.config();

// Endpoints
const PASEO_RELAY_ENDPOINT = 'wss://paseo.rpc.amforc.com';
const PASEO_ASSET_HUB_ENDPOINT = 'wss://pas-rpc.stakeworld.io/assethub';

const MNEMONIC = process.env.ADMIN_MNEMONIC || '';

const ASSET_IDS: Record<string, number> = {
  USDT: 1984,
  USDC: 1337,
};

let relayApi: ApiPromise | null = null;
let assetHubApi: ApiPromise | null = null;

function sanitizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().replace(/\s+/g, ' ').toLowerCase();
}

// Helper functions to connect to relay and asset hub
const connectRelay = async (): Promise<void> => {
  if (!relayApi) {
    console.log('[connectRelay] Connecting to Paseo Relay Chain...');
    const ws = new WsProvider(PASEO_RELAY_ENDPOINT);
    relayApi = await ApiPromise.create({ provider: ws as unknown as any });
    await relayApi.isReady;
    console.log('[connectRelay] Connected to Paseo Relay Chain');
  }
};

const connectAssetHub = async (): Promise<void> => {
  if (!assetHubApi) {
    console.log('[connectAssetHub] Connecting to Paseo Asset Hub...');
    const ws = new WsProvider(PASEO_ASSET_HUB_ENDPOINT);
    assetHubApi = await ApiPromise.create({ provider: ws as unknown as any });
    await assetHubApi.isReady;
    console.log('[connectAssetHub] Connected to Paseo Asset Hub');
  }
};

interface PayoutBody {
  address: string;
  amount: string;
  token: string;
}
interface MpesaRequestBody {
  phone: string;
  amount: number;
}
interface MpesaCallbackItem {
  Name: string;
  Value: any;
}
interface MpesaStkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: MpesaCallbackItem[];
  };
}
interface MpesaCallback {
  Body: {
    stkCallback: MpesaStkCallback;
  };
}
interface MpesaStatusStoreEntry {
  status: string;
  details?: any;
}
interface StkPushResponse {
  MerchantRequestID?: string;
  ResponseCode?: string;
  CheckoutRequestID?: string;
}

// In-memory store for MPESA status
const mpesaStatusStore: Record<string, MpesaStatusStoreEntry> = {};

// Controller for MPESA STK Push initiation
export const mpesaController = async (
  req: Request<{}, {}, MpesaRequestBody>,
  res: Response
): Promise<Response | void> => {
  try {
    console.log('[mpesaController] Received request body:', req.body);

    let number = req.body.phone.replace(/^0/, '');
    if (!number.startsWith('254')) number = `254${number}`;
    const amount = req.body.amount;

    console.log(`[mpesaController] Normalized phone number: ${number}, amount: ${amount}`);

    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    const passkey = process.env.MPESA_PASS_KEY || process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK;
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    if (!shortCode || !passkey || !callbackUrl || !consumerKey || !consumerSecret) {
      console.error('[mpesaController] Missing MPESA credentials or config');
      return res.status(500).json({ error: 'Missing MPESA credentials or config' });
    }

    const timestamp = getMpesaTimestamp();
    const password = getMpesaPassword(shortCode, passkey, timestamp);

    console.log('[mpesaController] Generated timestamp and password for MPESA');

    const access_token = await getAccessToken(consumerKey, consumerSecret, false);
    if (!access_token) {
      console.error('[mpesaController] Access token missing');
      return res.status(401).json({ error: 'Access token missing' });
    }
    console.log('[mpesaController] Received access token.');

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
      TransactionDesc: 'Buy Crypto',
    };
    console.log('[mpesaController] STK Push payload:', stkPushBody);

    const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const stkResponse: AxiosResponse<StkPushResponse> = await axios.post(stkUrl, stkPushBody, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });
    const stkData = stkResponse.data;
    console.log('[mpesaController] STK Push response:', stkData);

    if (stkData.MerchantRequestID) {
      mpesaStatusStore[stkData.MerchantRequestID] = { status: 'pending' };
      console.log(`[mpesaController] Stored pending status for MerchantRequestID: ${stkData.MerchantRequestID}`);
    }
    res.json(stkData);

    if (stkData.ResponseCode === '0' && stkData.CheckoutRequestID && stkData.MerchantRequestID) {
      const requestID = stkData.CheckoutRequestID;
      console.log(`[mpesaController] Initiating polling for CheckoutRequestID: ${requestID}`);

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
        console.log(`[mpesaController][pollStatus] Polling attempt ${numTries + 1}/${maxTries} for MerchantID: ${merchantID}`);
        try {
          const queryResult = await axios.post(queryEndpoint, queryPayload, {
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
          });
          const resultCode = queryResult.data.ResultCode;
          console.log('[mpesaController][pollStatus] Query result:', queryResult.data);

          if (resultCode === '0') {
            mpesaStatusStore[merchantID] = { status: 'success', details: queryResult.data };
            console.log(`[mpesaController][pollStatus] Payment successful for MerchantID: ${merchantID}`);
            return;
          } else if (resultCode === '1032') {
            mpesaStatusStore[merchantID] = { status: 'cancelled', details: queryResult.data };
            console.warn(`[mpesaController][pollStatus] Payment cancelled for MerchantID: ${merchantID}`);
            return;
          } else if (resultCode === '1') {
            mpesaStatusStore[merchantID] = { status: 'failed', details: queryResult.data };
            console.error(`[mpesaController][pollStatus] Payment failed for MerchantID: ${merchantID}`);
            return;
          } else {
            numTries++;
            if (numTries < maxTries) {
              setTimeout(pollStatus, 15000);
            } else {
              mpesaStatusStore[merchantID] = { status: 'failed', details: queryResult.data };
              console.error(`[mpesaController][pollStatus] Max polling retries reached. Marking as failed. MerchantID: ${merchantID}`);
            }
          }
        } catch (error: any) {
          console.error('[mpesaController][pollStatus] Polling error:', error.response?.data || error.message);
          numTries++;
          if (numTries < maxTries) {
            setTimeout(pollStatus, 15000);
          } else {
            mpesaStatusStore[merchantID] = { status: 'failed', details: error.response?.data || error.message };
            console.error(`[mpesaController][pollStatus] Max polling retries (on error) reached. Marking as failed. MerchantID: ${merchantID}`);
          }
        }
      };
      setTimeout(pollStatus, 15000);
      console.log(`[mpesaController] Started polling routine for MerchantID: ${merchantID}`);
    }
  } catch (error: any) {
    console.error('[mpesaController] Error sending the push request:', error.response?.data?.errorMessage || error.message);
    res.status(500).json({
      type: 'failed',
      heading: 'Error sending the push request',
      desc: error.response?.data?.errorMessage || error.message,
    });
  }
};

// MPESA Callback endpoint
export const callbackUrlController = (
  req: Request,
  res: Response
): Response => {
  console.log('[callbackUrlController] Incoming callback:', req.body);
  const callbackData = req.body as MpesaCallback;
  const { stkCallback } = callbackData.Body;
  const merchantRequestId = stkCallback.MerchantRequestID;
  const resultCode = stkCallback.ResultCode;

  if (merchantRequestId) {
    if (resultCode === 0) {
      mpesaStatusStore[merchantRequestId] = { status: 'success', details: stkCallback };
      console.log(`[callbackUrlController] Payment marked as success for ${merchantRequestId}`);
    } else if (stkCallback.ResultDesc && stkCallback.ResultDesc.toLowerCase().includes('cancelled')) {
      mpesaStatusStore[merchantRequestId] = { status: 'cancelled', details: stkCallback };
      console.warn(`[callbackUrlController] Payment marked as cancelled for ${merchantRequestId}`);
    } else {
      mpesaStatusStore[merchantRequestId] = { status: 'failed', details: stkCallback };
      console.error(`[callbackUrlController] Payment marked as failed for ${merchantRequestId}`);
    }
  }
  return res.json('success');
};

// Status endpoint
export const mpesaStatusController = (
  req: Request,
  res: Response
): Response => {
  let merchantRequestId = req.query.merchantRequestId;
  console.log('[mpesaStatusController] Query for MerchantRequestID:', merchantRequestId);

  if (Array.isArray(merchantRequestId)) merchantRequestId = merchantRequestId[0];
  if (typeof merchantRequestId !== 'string' || !merchantRequestId) {
    console.warn('[mpesaStatusController] Missing or invalid merchantRequestId in query');
    return res.status(400).json({ status: 'unknown', error: 'Missing merchantRequestId' });
  }
  const record = mpesaStatusStore[merchantRequestId];
  if (!record) {
    console.log('[mpesaStatusController] Status: pending');
    return res.json({ status: 'pending' });
  }
  console.log('[mpesaStatusController] Status:', record.status);
  return res.json({ status: record.status, details: record.details });
};

// POST /api/v1/payout for DOT, USDT, USDC, DAI
export const payout = async (
  req: Request<{}, {}, PayoutBody>,
  res: Response
): Promise<Response | void> => {
  try {
    console.log('[payout] Received request body:', req.body);

    const { address, amount, token }: PayoutBody = req.body;
    if (!address || !amount || !token) {
      console.error('[payout] Missing address, amount, or token');
      return res.status(400).json({
        status: 'failed',
        error: 'Missing address, amount, or token',
      });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      console.error('[payout] Amount must be a positive number');
      return res.status(400).json({
        status: 'failed',
        error: 'Amount must be a positive number',
      });
    }
    const keyring = new Keyring({ type: 'sr25519' });
    const safeMnemonic = sanitizeMnemonic(MNEMONIC);
    console.log('[payout] Sanitized mnemonic.');

    if (!mnemonicValidate(safeMnemonic)) {
      console.error('[payout] BIP39 mnemonic failed validation');
      return res.status(400).json({
        status: 'failed',
        error: 'BIP39 mnemonic failed validation after cleanup',
      });
    }
    const sender = keyring.addFromUri(safeMnemonic);
    console.log('[payout] Sender created from mnemonic.');

    if (token === 'DOT') {
      await connectRelay();
      if (!relayApi) {
        console.error('[payout] Relay chain API not initialized');
        return res.status(500).json({
          status: 'failed',
          error: 'Relay chain API not initialized',
        });
      }
      const planck = BigInt(Math.floor(amountNum * 1e10));
      if (
        relayApi
        && relayApi.tx
        && relayApi.tx.balances
        && typeof relayApi.tx.balances.transferKeepAlive === "function"
      ) {
        console.log('[payout] Creating DOT transferKeepAlive transaction...');
        const tx = relayApi.tx.balances.transferKeepAlive(address, planck.toString());
        const unsub = await tx.signAndSend(sender, ({ status, dispatchError }) => {
          if (status.isInBlock) {
            const blockHash = status.asInBlock.toHex();
            console.log(`[payout] DOT transfer in block: ${blockHash}`);
            unsub();
            res.json({
              status: 'success',
              block: blockHash,
              token: token,
              amount: amount,
              assetId: null,
              chain: 'Paseo Relay Chain',
            });
          } else if (dispatchError) {
            console.error('[payout] DOT transfer dispatch error:', dispatchError.toString());
            unsub();
            res.status(500).json({
              status: 'failed',
              error: dispatchError.toString(),
            });
          } else {
            console.log('[payout] DOT transfer status update:', status.toHuman());
          }
        });
      } else {
        console.error('[payout] transferKeepAlive method is not available on relayApi');
        return res.status(500).json({
          status: 'failed',
          error: 'transferKeepAlive method is not available on relayApi',
        });
      }
    } else if (token === 'USDT' || token === 'USDC' || token === 'DAI') {
      await connectAssetHub();
      if (!assetHubApi) {
        console.error('[payout] Asset Hub API not initialized');
        return res.status(500).json({
          status: 'failed',
          error: 'Asset Hub API not initialized',
        });
      }
      const assetId = ASSET_IDS[token];
      if (!assetId) {
        console.error(`[payout] Asset ID not configured for ${token}`);
        return res.status(400).json({
          status: 'failed',
          error: `Asset ID not configured for ${token}`,
        });
      }
      const decimals = token === 'DAI' ? 18 : 6;
      const assetAmount = BigInt(Math.floor(amountNum * Math.pow(10, decimals)));
      if (
        assetHubApi.tx &&
        assetHubApi.tx.assets &&
        typeof assetHubApi.tx.assets.transfer === 'function'
      ) {
        console.log(`[payout] Creating ${token} assets.transfer transaction...`);
        const tx = assetHubApi.tx.assets.transfer(assetId, address, assetAmount.toString());
        const unsub = await tx.signAndSend(sender, ({ status, dispatchError }) => {
          if (status.isInBlock) {
            const block = status.asInBlock.toHex();
            console.log(`[payout] ${token} transfer in block: ${block}`);
            unsub();
            res.json({
              status: 'success',
              block,
              token: token,
              amount: amount,
              assetId: assetId,
              chain: 'Paseo Asset Hub',
            });
          } else if (dispatchError) {
            console.error(`[payout] ${token} transfer dispatch error:`, dispatchError.toString());
            unsub();
            res.status(500).json({
              status: 'failed',
              error: dispatchError.toString(),
            });
          } else {
            console.log(`[payout] ${token} transfer status update:`, status.toHuman());
          }
        });
      } else {
        console.error('[payout] Transfer function not available on assetHubApi');
        return res.status(500).json({
          status: 'failed',
          error: 'Transfer function not available on assetHubApi',
        });
      }
    } else {
      console.error(`[payout] Unsupported token: ${token}`);
      return res.status(400).json({
        status: 'failed',
        error: `Unsupported token: ${token}`,
      });
    }
  } catch (error: any) {
    console.error('[payout] Error:', error.message || String(error));
    res.status(500).json({
      status: 'failed',
      error: error.message || String(error),
    });
  }
};
