import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { getAccessToken } from '../utils/mpesaAuth.js';
import { getMpesaTimestamp, getMpesaPassword } from '../utils/mpesaUtils.js';
import { sendSMS } from '../utils/sendSMS.js';
dotenv.config();

const PASEO_ASSET_HUB_ENDPOINT = 'wss://pas-rpc.stakeworld.io/assethub';
const MNEMONIC = process.env.ADMIN_MNEMONIC || '';

const ASSET_IDS: Record<string, number> = {
  PAS: 0,
  USDT: 1984,
  USDC: 1337,
};
const ASSET_DECIMALS: Record<string, number> = {
  PAS: 10,
  USDT: 6,
  USDC: 6,
};
const EXCHANGE_RATES: Record<string, number> = {
  PAS: 0.15,
  USDT: 0.0074,
  USDC: 0.0074,
};
const MIN_BALANCE_THRESHOLDS: Record<string, bigint> = {
  PAS: BigInt(10 ** 10),
  USDT: BigInt(10 ** 6),
  USDC: BigInt(10 ** 6),
};
let assetHubApi: ApiPromise | null = null;

function sanitizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().replace(/\s+/g, ' ').toLowerCase();
}

const connectAssetHub = async (): Promise<void> => {
  if (!assetHubApi) {
    const ws = new WsProvider(PASEO_ASSET_HUB_ENDPOINT);
    assetHubApi = await ApiPromise.create({ provider: ws });
    await assetHubApi.isReady;
  }
};

export const disconnectApis = async (): Promise<void> => {
  if (assetHubApi) {
    await assetHubApi.disconnect();
    assetHubApi = null;
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
  token?: string;
  userAddress?: string;
}
interface SellCryptoBody {
  phone: string;
  amount: string;
  token: string;
  fromAddress: string;
  transactionHash?: string;
}
interface MpesaCallbackItem {
  Name: string;
  Value: string | number;
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
  status: 'pending' | 'payment_confirmed' | 'completed' | 'cancelled' | 'failed' | 'timeout' | 'transfer_failed' | 'error';
  details?: any;
  token?: string;
  userAddress?: string;
  cryptoAmount?: string;
  timestamp?: string;
  direction?: 'buy' | 'sell';
}
interface StkPushResponse {
  MerchantRequestID?: string;
  ResponseCode?: string;
  CheckoutRequestID?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
}
interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  assetId: number | null;
  chain: string;
  exchangeRate: number;
}
interface BalanceCheckResult {
  hasEnough: boolean;
  currentBalance: string;
  requiredBalance: string;
  balanceAfterTx: string;
  token: string;
}

const mpesaStatusStore: Record<string, MpesaStatusStoreEntry> = {};

const checkAdminBalance = async (token: string, amount: number): Promise<BalanceCheckResult> => {
  const keyring = new Keyring({ type: 'sr25519' });
  const safeMnemonic = sanitizeMnemonic(MNEMONIC);

  if (!mnemonicValidate(safeMnemonic)) {
    throw new Error('Invalid admin mnemonic configuration');
  }
  const adminAccount = keyring.addFromUri(safeMnemonic);
  const adminAddress = adminAccount.address;
  const decimals = ASSET_DECIMALS[token];
  if (typeof decimals !== 'number') throw new Error('Decimals undefined');
  const requiredAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
  const minBalance = MIN_BALANCE_THRESHOLDS[token] || BigInt(0);

  await connectAssetHub();
  if (!assetHubApi) throw new Error('Asset Hub API not initialized');

  if (token === 'PAS') {
    if (!assetHubApi?.query?.system || typeof assetHubApi.query.system.account !== 'function') {
      throw new Error('assetHubApi.query.system.account is not available');
    }
    const accountInfo: any = await assetHubApi.query.system.account(adminAddress);
    const balance: bigint = accountInfo.data.free.toBigInt();
    const frozen: bigint = (accountInfo.data.frozen?.toBigInt?.() ?? accountInfo.data.miscFrozen?.toBigInt?.() ?? BigInt(0));
    const availableBalance: bigint = balance - frozen;
    const balanceAfterTx = availableBalance - requiredAmount;
    return {
      hasEnough: availableBalance >= requiredAmount && balanceAfterTx >= minBalance,
      currentBalance: (Number(availableBalance) / Math.pow(10, decimals)).toFixed(4),
      requiredBalance: (Number(requiredAmount) / Math.pow(10, decimals)).toFixed(4),
      balanceAfterTx: (Number(balanceAfterTx) / Math.pow(10, decimals)).toFixed(4),
      token,
    };
  } else {
    const assetId = ASSET_IDS[token];
    if (!assetHubApi?.query?.assets || typeof assetHubApi.query.assets.account !== 'function') {
      throw new Error('assetHubApi.query.assets.account is not available');
    }
    const accountAsset: any = await assetHubApi.query.assets.account(assetId, adminAddress);
    if (accountAsset.isNone) {
      return {
        hasEnough: false,
        currentBalance: '0',
        requiredBalance: (Number(requiredAmount) / Math.pow(10, decimals)).toFixed(decimals),
        balanceAfterTx: '0',
        token,
      };
    }
    const assetBalance = accountAsset.unwrap().balance.toBigInt();
    const balanceAfterTx = assetBalance - requiredAmount;
    return {
      hasEnough: assetBalance >= requiredAmount && balanceAfterTx >= minBalance,
      currentBalance: (Number(assetBalance) / Math.pow(10, decimals)).toFixed(decimals),
      requiredBalance: (Number(requiredAmount) / Math.pow(10, decimals)).toFixed(decimals),
      balanceAfterTx: (Number(balanceAfterTx) / Math.pow(10, decimals)).toFixed(decimals),
      token,
    };
  }
};

const checkUserBalance = async (userAddress: string, token: string, amount: number): Promise<BalanceCheckResult> => {
  const decimals = ASSET_DECIMALS[token];
  if (typeof decimals !== 'number') throw new Error('Decimals undefined');
  const requiredAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
  const minBalance = MIN_BALANCE_THRESHOLDS[token] || BigInt(0);

  await connectAssetHub();
  if (!assetHubApi) throw new Error('Asset Hub API not initialized');

  if (token === 'PAS') {
    if (!assetHubApi?.query?.system || typeof assetHubApi.query.system.account !== 'function') {
      throw new Error('assetHubApi.query.system.account is not available');
    }
    const accountInfo: any = await assetHubApi.query.system.account(userAddress);
    const balance: bigint = accountInfo.data.free.toBigInt();
    const frozen: bigint = (accountInfo.data.frozen?.toBigInt?.() ?? accountInfo.data.miscFrozen?.toBigInt?.() ?? BigInt(0));
    const availableBalance: bigint = balance - frozen;
    const balanceAfterTx = availableBalance - requiredAmount;
    return {
      hasEnough: availableBalance >= requiredAmount && balanceAfterTx >= minBalance,
      currentBalance: (Number(availableBalance) / Math.pow(10, decimals)).toFixed(4),
      requiredBalance: (Number(requiredAmount) / Math.pow(10, decimals)).toFixed(4),
      balanceAfterTx: (Number(balanceAfterTx) / Math.pow(10, decimals)).toFixed(4),
      token,
    };
  } else {
    const assetId = ASSET_IDS[token];
    if (!assetHubApi?.query?.assets || typeof assetHubApi.query.assets.account !== 'function') {
      throw new Error('assetHubApi.query.assets.account is not available');
    }
    const accountAsset: any = await assetHubApi.query.assets.account(assetId, userAddress);
    if (accountAsset.isNone) {
      return {
        hasEnough: false,
        currentBalance: '0',
        requiredBalance: (Number(requiredAmount) / Math.pow(10, decimals)).toFixed(decimals),
        balanceAfterTx: '0',
        token,
      };
    }
    const assetBalance = accountAsset.unwrap().balance.toBigInt();
    const balanceAfterTx = assetBalance - requiredAmount;
    return {
      hasEnough: assetBalance >= requiredAmount && balanceAfterTx >= minBalance,
      currentBalance: (Number(assetBalance) / Math.pow(10, decimals)).toFixed(decimals),
      requiredBalance: (Number(requiredAmount) / Math.pow(10, decimals)).toFixed(decimals),
      balanceAfterTx: (Number(balanceAfterTx) / Math.pow(10, decimals)).toFixed(decimals),
      token,
    };
  }
};

/**
 * BUY CRYPTO: Initiate MPESA STK Push for buying crypto
 * POST /api/v1/buy
 * Supports: PAS, USDT, USDC
 */
export const buyCryptoController = async (
  req: Request<{}, {}, MpesaRequestBody>,
  res: Response
): Promise<Response | void> => {
  try {
    console.log('[buyCryptoController] Received request body:', req.body);

    const { phone, amount: kesAmount, token = 'PAS', userAddress } = req.body;

    if (!userAddress) {
      console.error('[buyCryptoController] Missing user wallet address');
      return res.status(400).json({
        status: 'failed',
        error: 'User wallet address is required'
      });
    }

    if (!EXCHANGE_RATES[token]) {
      console.error(`[buyCryptoController] Unsupported token: ${token}`);
      return res.status(400).json({
        status: 'failed',
        error: `Unsupported token: ${token}. Supported tokens: PAS, USDT, USDC`
      });
    }

    // Calculate crypto amount
    const cryptoAmount = kesAmount * EXCHANGE_RATES[token];
    console.log(`[buyCryptoController] KES: ${kesAmount}, Token: ${token}, Crypto Amount: ${cryptoAmount}`);

    // Check admin balance before initiating M-PESA
    try {
      const balanceCheck = await checkAdminBalance(token, cryptoAmount);

      if (!balanceCheck.hasEnough) {
        console.error('[buyCryptoController] Insufficient admin balance');
        return res.status(400).json({
          status: 'failed',
          error: 'Insufficient liquidity',
          details: {
            message: `Admin wallet has insufficient ${token} balance to complete this transaction`,
            currentBalance: balanceCheck.currentBalance,
            requiredBalance: balanceCheck.requiredBalance,
            token: token,
          }
        });
      }

      console.log(`[buyCryptoController] Balance check passed. Current: ${balanceCheck.currentBalance} ${token}, Required: ${balanceCheck.requiredBalance} ${token}`);
    } catch (error: any) {
      console.error('[buyCryptoController] Balance check error:', error.message);
      return res.status(500).json({
        status: 'failed',
        error: 'Failed to verify liquidity',
        details: error.message,
      });
    }

    // Normalize phone number
    let number = phone.replace(/^0/, '');
    if (!number.startsWith('254')) number = `254${number}`;

    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    const passkey = process.env.MPESA_PASS_KEY || process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK;
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    if (!shortCode || !passkey || !callbackUrl || !consumerKey || !consumerSecret) {
      console.error('[buyCryptoController] Missing MPESA credentials or config');
      return res.status(500).json({
        status: 'failed',
        error: 'Missing MPESA credentials or config'
      });
    }

    const timestamp = getMpesaTimestamp();
    const password = getMpesaPassword(shortCode, passkey, timestamp);

    const access_token = await getAccessToken(consumerKey, consumerSecret, false);
    if (!access_token) {
      console.error('[buyCryptoController] Access token missing');
      return res.status(401).json({
        status: 'failed',
        error: 'Access token missing'
      });
    }

    const stkPushBody = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: String(kesAmount),
      PartyA: number,
      PartyB: shortCode,
      PhoneNumber: number,
      CallBackURL: callbackUrl,
      AccountReference: 'DotRamp-Buy',
      TransactionDesc: `Buy ${token}`,
    };
    console.log('[buyCryptoController] STK Push payload:', stkPushBody);

    const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const stkResponse: AxiosResponse<StkPushResponse> = await axios.post(stkUrl, stkPushBody, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });
    const stkData = stkResponse.data;
    console.log('[buyCryptoController] STK Push response:', stkData);

    if (stkData.MerchantRequestID) {
      mpesaStatusStore[stkData.MerchantRequestID] = {
        status: 'pending',
        token: token,
        cryptoAmount: cryptoAmount.toString(),
        userAddress: userAddress,
        timestamp: new Date().toISOString(),
        direction: 'buy',
        phone: number // Add phone number here
      };
      console.log(`[buyCryptoController] Stored pending status for MerchantRequestID: ${stkData.MerchantRequestID}`);
    }

    res.json({
      status: 'success',
      ...stkData,
      expectedCryptoAmount: cryptoAmount,
      token: token,
    });

    // Start polling for payment confirmation
    if (stkData.ResponseCode === '0' && stkData.CheckoutRequestID && stkData.MerchantRequestID) {
      const requestID = stkData.CheckoutRequestID;
      const merchantID = stkData.MerchantRequestID;
      console.log(`[buyCryptoController] Initiating polling for CheckoutRequestID: ${requestID}`);

      const queryEndpoint = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';
      const queryPayload = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: requestID,
      };
      let numTries = 0;
      const maxTries = 10;

      const pollStatus = async (): Promise<void> => {
        console.log(`[buyCryptoController][pollStatus] Polling attempt ${numTries + 1}/${maxTries} for MerchantID: ${merchantID}`);
        try {
          const queryResult = await axios.post(queryEndpoint, queryPayload, {
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
          });
          const resultCode = queryResult.data.ResultCode;
          console.log('[buyCryptoController][pollStatus] Query result:', queryResult.data);

          if (resultCode === '0') {
            mpesaStatusStore[merchantID] = {
              ...mpesaStatusStore[merchantID],
              status: 'payment_confirmed',
              details: queryResult.data
            };
            console.log(`[buyCryptoController][pollStatus] Payment successful for MerchantID: ${merchantID}`);

            // Automatically process the payment
            await processPayment(merchantID);
            return;
          } else if (resultCode === '1032') {
            mpesaStatusStore[merchantID] = {
              ...mpesaStatusStore[merchantID],
              status: 'cancelled',
              details: queryResult.data
            };
            console.warn(`[buyCryptoController][pollStatus] Payment cancelled for MerchantID: ${merchantID}`);
            return;
          } else if (resultCode === '1') {
            mpesaStatusStore[merchantID] = {
              ...mpesaStatusStore[merchantID],
              status: 'failed',
              details: queryResult.data
            };
            console.error(`[buyCryptoController][pollStatus] Payment failed for MerchantID: ${merchantID}`);
            return;
          } else {
            numTries++;
            if (numTries < maxTries) {
              setTimeout(pollStatus, 15000);
            } else {
              mpesaStatusStore[merchantID] = {
                ...mpesaStatusStore[merchantID],
                status: 'timeout',
                details: queryResult.data
              };
              console.error(`[buyCryptoController][pollStatus] Max polling retries reached. MerchantID: ${merchantID}`);
            }
          }
        } catch (error: any) {
          console.error('[buyCryptoController][pollStatus] Polling error:', error.response?.data || error.message);
          numTries++;
          if (numTries < maxTries) {
            setTimeout(pollStatus, 15000);
          } else {
            mpesaStatusStore[merchantID] = {
              ...mpesaStatusStore[merchantID],
              status: 'error',
              details: error.response?.data || error.message
            };
          }
        }
      };
      setTimeout(pollStatus, 15000);
    }
  } catch (error: any) {
    console.error('[buyCryptoController] Error:', error.response?.data?.errorMessage || error.message);
    res.status(500).json({
      status: 'failed',
      error: error.response?.data?.errorMessage || error.message,
    });
  }
};

/**
 * Process a single confirmed payment (internal helper)
 * ALL TRANSFERS HAPPEN ON ASSET HUB
 */
const processPayment = async (merchantId: string): Promise<void> => {
  const data = mpesaStatusStore[merchantId];

  if (!data || data.status !== 'payment_confirmed') {
    console.warn(`[processPayment] Invalid status for ${merchantId}: ${data?.status}`);
    return;
  }

  if (!data.userAddress || !data.cryptoAmount || !data.token) {
    console.warn(`[processPayment] Missing data for ${merchantId}`);
    return;
  }

  try {
    console.log(`[processPayment] Processing payment ${merchantId}: ${data.cryptoAmount} ${data.token} to ${data.userAddress}`);

    const keyring = new Keyring({ type: 'sr25519' });
    const safeMnemonic = sanitizeMnemonic(MNEMONIC);
    const sender = keyring.addFromUri(safeMnemonic);
    const cryptoAmount = parseFloat(data.cryptoAmount);

    // All transfers happen on Asset Hub
    await connectAssetHub();
    if (!assetHubApi) throw new Error('Asset Hub API not initialized');

    if (
      data.token === 'PAS' &&
      typeof cryptoAmount === 'number' &&
      typeof ASSET_DECIMALS['PAS'] === 'number' &&
      assetHubApi?.tx?.balances?.transferKeepAlive
    ) {
      // Transfer native PAS on Asset Hub
      const planck = BigInt(Math.floor(cryptoAmount * Math.pow(10, ASSET_DECIMALS['PAS'])));
      const tx = assetHubApi.tx.balances.transferKeepAlive(data.userAddress, planck.toString());

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(sender, ({ status, dispatchError }) => {
          if (!mpesaStatusStore[merchantId]) {
            mpesaStatusStore[merchantId] = { status: 'pending' };
          }
          if (status.isInBlock) {
            console.log(`[processPayment] Transfer complete for ${merchantId} in block ${status.asInBlock.toHex()}`);
            mpesaStatusStore[merchantId].status = 'completed';
            mpesaStatusStore[merchantId].details = {
              ...mpesaStatusStore[merchantId].details,
              blockHash: status.asInBlock.toHex(),
            };
            // Send SMS notification
            if (data.phone && data.userAddress && data.cryptoAmount && data.token) {
              const message = `Your purchase of ${data.cryptoAmount} ${data.token} has been successfully completed and sent to ${data.userAddress}.`;
              await sendSMS(data.phone, message);
            }
            resolve();
          } else if (dispatchError) {
            console.error(`[processPayment] Transfer failed for ${merchantId}:`, dispatchError.toString());
            mpesaStatusStore[merchantId].status = 'transfer_failed';
            mpesaStatusStore[merchantId].details = {
              ...mpesaStatusStore[merchantId].details,
              error: dispatchError.toString(),
            };
            reject(dispatchError);
          }
        });
      });
    } else {
      // Transfer other assets (USDT, USDC) on Asset Hub
      const assetId = ASSET_IDS[data.token];
      if (!assetId) throw new Error(`Asset ID not found for ${data.token}`);

      const decimals = ASSET_DECIMALS[data.token] || 6;
      const assetAmount = BigInt(Math.floor(cryptoAmount * Math.pow(10, decimals)));
      if (assetHubApi?.tx?.assets?.transfer && typeof assetId === "number" && typeof data.userAddress === "string") {
        const tx = assetHubApi.tx.assets.transfer(assetId, data.userAddress, assetAmount.toString());
        await new Promise<void>((resolve, reject) => {
          tx.signAndSend(sender, ({ status, dispatchError }) => {
            if (status.isInBlock) {
              if (!mpesaStatusStore[merchantId]) {
                mpesaStatusStore[merchantId] = { status: 'pending' };
              }
              console.log(`[processPayment] Transfer complete for ${merchantId} in block ${status.asInBlock.toHex()}`);
              mpesaStatusStore[merchantId].status = 'completed';
              mpesaStatusStore[merchantId].details = {
                ...mpesaStatusStore[merchantId].details,
                blockHash: status.asInBlock.toHex(),
              };
              // Send SMS notification
              if (data.phone && data.userAddress && data.cryptoAmount && data.token) {
                const message = `Your purchase of ${data.cryptoAmount} ${data.token} has been successfully completed and sent to ${data.userAddress}.`;
                await sendSMS(data.phone, message);
              }
              resolve();
            } else if (dispatchError) {
              if (!mpesaStatusStore[merchantId]) {
                mpesaStatusStore[merchantId] = { status: 'pending' };
              }
              console.error(`[processPayment] Transfer failed for ${merchantId}:`, dispatchError.toString());
              mpesaStatusStore[merchantId].status = 'transfer_failed';
              mpesaStatusStore[merchantId].details = {
                ...mpesaStatusStore[merchantId].details,
                error: dispatchError.toString(),
              };
              reject(dispatchError);
            }
          });
        });
      } else {
        throw new Error('assetHubApi.tx.assets.transfer is not available, or required data is missing');
      }
    }
  } catch (error: any) {
    if (!mpesaStatusStore[merchantId]) {
      mpesaStatusStore[merchantId] = { status: 'pending' };
    }
    console.error(`[processPayment] Error processing ${merchantId}:`, error.message);
    mpesaStatusStore[merchantId].status = 'transfer_failed';
    mpesaStatusStore[merchantId].details = {
      ...mpesaStatusStore[merchantId].details,
      error: error.message,
    };
  }
};

/**
 * SELL CRYPTO: User initiates sell, system transfers crypto from user to admin, then sends M-PESA
 * POST /api/v1/sell
 * Supports: PAS, USDT, USDC
 * User must sign the transaction on the frontend before calling this endpoint
 */
export const sellCryptoController = async (
  req: Request<{}, {}, SellCryptoBody>,
  res: Response
): Promise<Response | void> => {
  try {
    console.log('[sellCryptoController] Received request body:', req.body);

    const { phone, amount, token, fromAddress, transactionHash } = req.body;

    if (!phone || !amount || !token || !fromAddress) {
      console.error('[sellCryptoController] Missing required fields');
      return res.status(400).json({
        status: 'failed',
        error: 'Missing phone, amount, token, or fromAddress',
      });
    }

    const cryptoAmount = parseFloat(amount);
    if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
      console.error('[sellCryptoController] Invalid crypto amount');
      return res.status(400).json({
        status: 'failed',
        error: 'Amount must be a positive number',
      });
    }

    if (!EXCHANGE_RATES[token]) {
      console.error(`[sellCryptoController] Unsupported token: ${token}`);
      return res.status(400).json({
        status: 'failed',
        error: `Unsupported token: ${token}. Supported tokens: PAS, USDT, USDC`
      });
    }

    // Check user balance before proceeding
    try {
      const balanceCheck = await checkUserBalance(fromAddress, token, cryptoAmount);

      if (!balanceCheck.hasEnough) {
        console.error('[sellCryptoController] Insufficient user balance');
        return res.status(400).json({
          status: 'failed',
          error: 'Insufficient balance',
          details: {
            message: `Your wallet has insufficient ${token} balance to complete this transaction`,
            currentBalance: balanceCheck.currentBalance,
            requiredBalance: balanceCheck.requiredBalance,
            balanceAfterTx: balanceCheck.balanceAfterTx,
            token: token,
          }
        });
      }

      console.log(`[sellCryptoController] Balance check passed. Current: ${balanceCheck.currentBalance} ${token}, Required: ${balanceCheck.requiredBalance} ${token}`);
    } catch (error: any) {
      console.error('[sellCryptoController] Balance check error:', error.message);
      return res.status(500).json({
        status: 'failed',
        error: 'Failed to verify balance',
        details: error.message,
      });
    }

    // Calculate KES amount to send via MPESA
    const kesAmount = Math.floor(cryptoAmount / EXCHANGE_RATES[token]);
    console.log(kesAmount);
    if (kesAmount < 5) {
      console.error('[sellCryptoController] M-PESA amount too low');
      return res.status(400).json({
        status: 'failed',
        error: 'Transaction amount too low. Minimum M-PESA amount is 10 KES',
        kesAmount: kesAmount,
      });
    }

    console.log(`[sellCryptoController] Sell ${cryptoAmount} ${token} for ${kesAmount} KES to ${phone}`);

    // Normalize phone number
    let number = phone.replace(/^0/, '');
    if (!number.startsWith('254')) number = `254${number}`;

    // Get admin wallet to receive the crypto
    const keyring = new Keyring({ type: 'sr25519' });
    const safeMnemonic = sanitizeMnemonic(MNEMONIC);

    if (!mnemonicValidate(safeMnemonic)) {
      console.error('[sellCryptoController] BIP39 mnemonic failed validation');
      return res.status(500).json({
        status: 'failed',
        error: 'Invalid admin mnemonic configuration',
      });
    }

    const adminAccount = keyring.addFromUri(safeMnemonic);
    const adminAddress = adminAccount.address;

    // Get M-PESA credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const initiatorName = process.env.MPESA_INITIATOR_NAME || 'testapi';
    const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL;
    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    const callbackUrl = process.env.MPESA_CALLBACK;
    const b2cResultUrl = `${callbackUrl}/b2c/result`;
    const b2cQueueTimeoutUrl = `${callbackUrl}/b2c/timeout`;

    if (!consumerKey || !consumerSecret || !securityCredential || !shortCode || !callbackUrl) {
      console.error('[sellCryptoController] Missing MPESA credentials');
      return res.status(500).json({
        status: 'failed',
        error: 'Missing MPESA configuration',
      });
    }

    // Get M-PESA access token
    const access_token = await getAccessToken(consumerKey, consumerSecret, false);
    if (!access_token) {
      console.error('[sellCryptoController] Access token missing');
      return res.status(401).json({
        status: 'failed',
        error: 'Failed to get M-PESA access token'
      });
    }

    // Initiate B2C payment (Business to Customer - send money to user)
    const b2cPayload = {
      InitiatorName: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment',
      Amount: kesAmount,
      PartyA: shortCode,
      PartyB: number,
      Remarks: `Sell ${cryptoAmount} ${token}`,
      QueueTimeOutURL: b2cQueueTimeoutUrl,
      ResultURL: b2cResultUrl,
      Occasion: `DotRamp-Sell-${token}`,
    };

    console.log('[sellCryptoController] B2C Payment payload:', { ...b2cPayload, SecurityCredential: '[REDACTED]' });

    const b2cUrl = 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest';
    const b2cResponse = await axios.post(b2cUrl, b2cPayload, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[sellCryptoController] B2C Response:', b2cResponse.data);

    const merchantRequestId =
      b2cResponse.data.OriginatorConversationID ||
      b2cResponse.data.ConversationID ||
      `sell-${Date.now()}`;

    // Store sell info in db/memory store with option for the transaction hash
    mpesaStatusStore[merchantRequestId] = {
      status: 'pending',
      token: token,
      userAddress: fromAddress,
      cryptoAmount: cryptoAmount.toString(),
      timestamp: new Date().toISOString(),
      direction: 'sell',
      phone: number, // Add phone number here
      details: {
        b2cResponse: b2cResponse.data,
        phone: number,
        kesAmount: kesAmount,
        adminAddress: adminAddress,
        blockHash: transactionHash || "", // Pre-fill if given (client passes after user signs)
      },
    };

    // Send SMS notification
    if (number && fromAddress && cryptoAmount && token && kesAmount) {
      const message = `Your sale of ${cryptoAmount} ${token} for ${kesAmount} KES has been initiated. You will receive ${kesAmount} KES shortly to ${number}.`;
      await sendSMS(number, message);
    }


    // Respond immediate sell info; transactionHash, if present, is included for fast UX
    return res.json({
      status: 'success',
      message: `M-PESA payment of ${kesAmount} KES initiated to ${number}`,
      cryptoAmount: cryptoAmount,
      token: token,
      kesAmount: kesAmount,
      phone: number,
      adminAddress: adminAddress,
      merchantRequestId: merchantRequestId,
      b2cResponse: b2cResponse.data,
      requiresWalletTransfer: true,
      transactionHash: transactionHash || "", // <-- include for sold record, set from frontend or watcher
    });

  } catch (error: any) {
    console.error('[sellCryptoController] Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'failed',
      error: error.response?.data?.errorMessage || error.message,
      details: error.response?.data,
    });
  }
};

/**
 * MPESA Callback endpoint
 * POST /api/v1/callback
 */
export const callbackUrlController = (
  req: Request,
  res: Response
): Response => {
  console.log('[callbackUrlController] Incoming callback:', JSON.stringify(req.body, null, 2));
  const callbackData = req.body as MpesaCallback;
  const { stkCallback } = callbackData.Body;
  const merchantRequestId = stkCallback.MerchantRequestID;
  const resultCode = stkCallback.ResultCode;

  if (merchantRequestId) {
    if (resultCode === 0) {
      mpesaStatusStore[merchantRequestId] = {
        ...mpesaStatusStore[merchantRequestId],
        status: 'payment_confirmed',
        details: stkCallback
      };
      console.log(`[callbackUrlController] Payment marked as confirmed for ${merchantRequestId}`);

      // Automatically process the payment
      processPayment(merchantRequestId).catch(err => {
        console.error(`[callbackUrlController] Error processing payment ${merchantRequestId}:`, err);
      });
    } else if (stkCallback.ResultDesc && stkCallback.ResultDesc.toLowerCase().includes('cancelled')) {
      mpesaStatusStore[merchantRequestId] = {
        ...mpesaStatusStore[merchantRequestId],
        status: 'cancelled',
        details: stkCallback
      };
      console.warn(`[callbackUrlController] Payment marked as cancelled for ${merchantRequestId}`);
    } else {
      mpesaStatusStore[merchantRequestId] = {
        ...mpesaStatusStore[merchantRequestId],
        status: 'failed',
        details: stkCallback
      };
      console.error(`[callbackUrlController] Payment marked as failed for ${merchantRequestId}`);
    }
  }
  return res.json({ ResultCode: 0, ResultDesc: 'Success' });
};

/**
 * B2C Result callback (for sell transactions)
 * POST /api/v1/b2c/result
 */
export const b2cResultController = (
  req: Request,
  res: Response
): Response => {
  console.log('[b2cResultController] B2C Result callback:', JSON.stringify(req.body, null, 2));

  // Extract B2C result data
  const result = req.body?.Result;

  if (result) {
    const conversationId = result.ConversationID;
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDesc;

    console.log(`[b2cResultController] B2C Payment Result - ConversationID: ${conversationId}, Code: ${resultCode}, Desc: ${resultDesc}`);

    if (resultCode === 0) {
      console.log('[b2cResultController] B2C payment successful');
    } else {
      console.error('[b2cResultController] B2C payment failed');
    }
  }

  return res.json({ ResultCode: 0, ResultDesc: 'Success' });
};

/**
 * B2C Timeout callback (for sell transactions)
 * POST /api/v1/b2c/timeout
 */
export const b2cTimeoutController = (
  req: Request,
  res: Response
): Response => {
  console.log('[b2cTimeoutController] B2C Timeout callback:', JSON.stringify(req.body, null, 2));

  const result = req.body?.Result;

  if (result) {
    const conversationId = result.ConversationID;
    console.warn(`[b2cTimeoutController] B2C Payment timeout - ConversationID: ${conversationId}`);
  }

  return res.json({ ResultCode: 0, ResultDesc: 'Success' });
};

/**
 * Status endpoint
 * GET /api/v1/status?merchantRequestId=xxx
 */
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
  return res.json({
    status: record.status,
    details: record.details,
    token: record.token,
    cryptoAmount: record.cryptoAmount,
    timestamp: record.timestamp,
  });
};

/**
 * Payout/Transfer crypto endpoint
 * POST /api/v1/payout
 * ALL TRANSFERS HAPPEN ON ASSET HUB
 * Supports: PAS, USDT, USDC
 */
export const payoutController = async (
  req: Request<{}, {}, PayoutBody>,
  res: Response
): Promise<Response | void> => {
  try {
    console.log('[payoutController] Received request body:', req.body);

    const { address, amount, token }: PayoutBody = req.body;
    if (!address || !amount || !token) {
      console.error('[payoutController] Missing address, amount, or token');
      return res.status(400).json({
        status: 'failed',
        error: 'Missing address, amount, or token',
      });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      console.error('[payoutController] Amount must be a positive number');
      return res.status(400).json({
        status: 'failed',
        error: 'Amount must be a positive number',
      });
    }

    if (!EXCHANGE_RATES[token]) {
      console.error(`[payoutController] Unsupported token: ${token}`);
      return res.status(400).json({
        status: 'failed',
        error: `Unsupported token: ${token}. Supported tokens: PAS, USDT, USDC`,
      });
    }

    // Check admin balance before attempting transfer
    try {
      const balanceCheck = await checkAdminBalance(token, amountNum);

      if (!balanceCheck.hasEnough) {
        console.error('[payoutController] Insufficient admin balance');
        return res.status(400).json({
          status: 'failed',
          error: 'Insufficient balance',
          details: balanceCheck,
        });
      }

      console.log(`[payoutController] Balance check passed. Proceeding with transfer of ${amountNum} ${token}`);
    } catch (error: any) {
      console.error('[payoutController] Balance check error:', error.message);
      return res.status(500).json({
        status: 'failed',
        error: 'Failed to verify balance',
        details: error.message,
      });
    }

    const keyring = new Keyring({ type: 'sr25519' });
    const safeMnemonic = sanitizeMnemonic(MNEMONIC);
    console.log('[payoutController] Sanitized mnemonic.');

    if (!mnemonicValidate(safeMnemonic)) {
      console.error('[payoutController] BIP39 mnemonic failed validation');
      return res.status(400).json({
        status: 'failed',
        error: 'BIP39 mnemonic failed validation after cleanup',
      });
    }

    const sender = keyring.addFromUri(safeMnemonic);
    console.log('[payoutController] Sender created from mnemonic.');

    // All transfers happen on Asset Hub
    await connectAssetHub();
    if (!assetHubApi) {
      console.error('[payoutController] Asset Hub API not initialized');
      return res.status(500).json({
        status: 'failed',
        error: 'Asset Hub API not initialized',
      });
    }

    if (
      typeof amountNum === 'number' &&
      typeof ASSET_DECIMALS['PAS'] === 'number'
    ) {
      // Transfer native PAS on Asset Hub
      const planck = BigInt(Math.floor(amountNum * Math.pow(10, ASSET_DECIMALS['PAS'])));

      if (
        assetHubApi &&
        assetHubApi.tx &&
        assetHubApi.tx.balances &&
        typeof assetHubApi.tx.balances.transferKeepAlive === "function"
      ) {
        console.log('[payoutController] Creating PAS transferKeepAlive transaction...');
        const tx = assetHubApi.tx.balances.transferKeepAlive(address, planck.toString());

        const unsub = await tx.signAndSend(sender, ({ status, dispatchError }) => {
          if (status.isInBlock) {
            const blockHash = status.asInBlock.toHex();
            console.log(`[payoutController] PAS transfer in block: ${blockHash}`);
            unsub();
            res.json({
              status: 'success',
              block: blockHash,
              token: token,
              amount: amount,
              assetId: null,
              chain: 'Paseo Asset Hub',
            });
          } else if (dispatchError) {
            console.error('[payoutController] PAS transfer dispatch error:', dispatchError.toString());
            unsub();
            res.status(500).json({
              status: 'failed',
              error: dispatchError.toString(),
            });
          } else {
            console.log('[payoutController] PAS transfer status update:', status.toHuman());
          }
        });
      } else {
        console.error('[payoutController] transferKeepAlive method is not available on assetHubApi');
        return res.status(500).json({
          status: 'failed',
          error: 'transferKeepAlive method is not available on assetHubApi',
        });
      }
    } else if (token === 'USDT' || token === 'USDC') {
      // Transfer other assets on Asset Hub
      const assetId = ASSET_IDS[token];
      if (!assetId) {
        console.error(`[payoutController] Asset ID not configured for ${token}`);
        return res.status(400).json({
          status: 'failed',
          error: `Asset ID not configured for ${token}`,
        });
      }

      const decimals = ASSET_DECIMALS[token] || 6;
      const assetAmount = BigInt(Math.floor(amountNum * Math.pow(10, decimals)));

      if (
        assetHubApi.tx &&
        assetHubApi.tx.assets &&
        typeof assetHubApi.tx.assets.transfer === 'function'
      ) {
        console.log(`[payoutController] Creating ${token} assets.transfer transaction...`);
        const tx = assetHubApi.tx.assets.transfer(assetId, address, assetAmount.toString());

        const unsub = await tx.signAndSend(sender, ({ status, dispatchError }) => {
          if (status.isInBlock) {
            const block = status.asInBlock.toHex();
            console.log(`[payoutController] ${token} transfer in block: ${block}`);
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
            console.error(`[payoutController] ${token} transfer dispatch error:`, dispatchError.toString());
            unsub();
            res.status(500).json({
              status: 'failed',
              error: dispatchError.toString(),
            });
          } else {
            console.log(`[payoutController] ${token} transfer status update:`, status.toHuman());
          }
        });
      } else {
        console.error('[payoutController] Transfer function not available on assetHubApi');
        return res.status(500).json({
          status: 'failed',
          error: 'Transfer function not available on assetHubApi',
        });
      }
    } else {
      console.error(`[payoutController] Unsupported token: ${token}`);
      return res.status(400).json({
        status: 'failed',
        error: `Unsupported token: ${token}`,
      });
    }
  } catch (error: any) {
    console.error('[payoutController] Error:', error.message || String(error));
    res.status(500).json({
      status: 'failed',
      error: error.message || String(error),
    });
  }
};

/**
 * Get balance for an address
 * GET /api/v1/balance?address=xxx&token=PAS
 * ALL BALANCES QUERIED FROM ASSET HUB
 * Supports: PAS, USDT, USDC
 */
export const getBalanceController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    let address = req.query.address;
    let token = req.query.token || 'PAS';

    if (Array.isArray(address)) address = address[0];
    if (Array.isArray(token)) token = token[0] || 'PAS';

    if (typeof address !== 'string' || !address) {
      return res.status(400).json({
        status: 'failed',
        error: 'Missing or invalid address parameter',
      });
    }

    if (typeof token !== 'string') {
      return res.status(400).json({
        status: 'failed',
        error: 'Invalid token parameter',
      });
    }

    console.log(`[getBalanceController] Fetching balance for ${address}, token: ${token}`);

    const decimals = ASSET_DECIMALS[token];
    if (!decimals) {
      return res.status(400).json({
        status: 'failed',
        error: `Unsupported token: ${token}. Supported tokens: PAS, USDT, USDC`,
      });
    }

    // All tokens are on Asset Hub
    await connectAssetHub();
    if (!assetHubApi) {
      return res.status(500).json({
        status: 'failed',
        error: 'Asset Hub API not initialized',
      });
    }

    if (token === 'PAS') {
      // Query native PAS balance on Asset Hub
      if (
        assetHubApi &&
        assetHubApi.query &&
        assetHubApi.query.system &&
        typeof assetHubApi.query.system.account === 'function'
      ) {
        const accountInfo: any = await assetHubApi.query.system.account(address);
        const balance = accountInfo.data.free.toBigInt();
        const frozen =
          accountInfo.data.frozen?.toBigInt() ||
          accountInfo.data.miscFrozen?.toBigInt() ||
          BigInt(0);
        const locked = accountInfo.data.reserved.toBigInt();
        const availableBalance = balance - frozen;
        const balanceFormatted = (
          Number(availableBalance) / Math.pow(10, decimals)
        ).toFixed(4);
        const lockedFormatted = (
          Number(locked) / Math.pow(10, decimals)
        ).toFixed(4);
        const totalFormatted = (
          Number(balance) / Math.pow(10, decimals)
        ).toFixed(4);

        console.log(
          `[getBalanceController] PAS balance for ${address}: Total=${totalFormatted}, Available=${balanceFormatted}, Frozen=${Number(frozen) / Math.pow(10, decimals)}, Reserved=${lockedFormatted}`
        );

        return res.json({
          status: 'success',
          address,
          token,
          balance: balanceFormatted,
          total: totalFormatted,
          locked: lockedFormatted,
          decimals,
          chain: 'Paseo Asset Hub',
        });
      } else {
        return res.status(500).json({
          status: 'failed',
          error: 'assetHubApi.query.system.account is not available',
        });
      }
    } else {
      // Query asset balance for USDT, USDC
      const assetId = ASSET_IDS[token];
      if (!assetId) {
        return res.status(400).json({
          status: 'failed',
          error: `Asset ID not configured for ${token}`,
        });
      }

      if (
        assetHubApi &&
        assetHubApi.query &&
        assetHubApi.query.assets &&
        typeof assetHubApi.query.assets.account === 'function'
      ) {
        const accountAsset: any = await assetHubApi.query.assets.account(assetId, address);

        if (accountAsset.isNone) {
          return res.json({
            status: 'success',
            address,
            token,
            balance: '0',
            decimals,
            assetId,
            chain: 'Paseo Asset Hub',
          });
        }

        const assetBalance = accountAsset.unwrap().balance.toBigInt();
        const balanceFormatted = (
          Number(assetBalance) / Math.pow(10, decimals)
        ).toFixed(decimals);

        return res.json({
          status: 'success',
          address,
          token,
          balance: balanceFormatted,
          decimals,
          assetId,
          chain: 'Paseo Asset Hub',
        });
      } else {
        return res.status(500).json({
          status: 'failed',
          error: 'assetHubApi.query.assets.account is not available',
        });
      }
    }
  } catch (error: any) {
    console.error('[getBalanceController] Error:', error.message);
    return res.status(500).json({
      status: 'failed',
      error: error.message,
    });
  }
};

/**
 * Get exchange rates
 * GET /api/v1/rates
 */
export const getRatesController = (
  req: Request,
  res: Response
): Response => {
  console.log('[getRatesController] Fetching exchange rates');
  return res.json({
    status: 'success',
    rates: EXCHANGE_RATES,
    lastUpdated: new Date().toISOString(),
  });
};

/**
 * Get supported tokens
 * GET /api/v1/tokens
 */
export const getTokensController = (
  req: Request,
  res: Response
): Response => {
  console.log('[getTokensController] Fetching supported tokens');

  const tokens: TokenInfo[] = Object.keys(EXCHANGE_RATES).map(token => {
    const decimals = ASSET_DECIMALS[token];
    if (typeof decimals !== 'number') throw new Error('Decimals undefined');
    const exchangeRate = EXCHANGE_RATES[token];
    if (typeof exchangeRate !== 'number') throw new Error('Exchange rate undefined');
    return {
      symbol: token,
      name: token === 'PAS' ? 'Paseo' : token,
      decimals,
      assetId: ASSET_IDS[token] ?? null,
      chain: 'Paseo Asset Hub',
      exchangeRate
    };
  });

  return res.json({
    status: 'success',
    tokens,
  });
};

/**
 * Health check endpoint
 * GET /api/v1/health
 */
export const healthCheckController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const assetHubStatus = assetHubApi ? 'connected' : 'disconnected';

    let assetHubChainInfo: null | { chain: string; version: string } = null;

    if (assetHubApi) {
      try {
        const chain = await assetHubApi.rpc.system.chain();
        const version = await assetHubApi.rpc.system.version();
        assetHubChainInfo = {
          chain: chain.toString(),
          version: version.toString(),
        };
      } catch (e) {
        console.error('[healthCheckController] Error fetching asset hub info:', e);
      }
    }

    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connections: {
        assetHub: {
          status: assetHubStatus,
          endpoint: PASEO_ASSET_HUB_ENDPOINT,
          info: assetHubChainInfo,
        },
      },
      supportedTokens: ['PAS', 'USDT', 'USDC'],
      mpesaTransactions: {
        pending: Object.values(mpesaStatusStore).filter(t => t.status === 'pending').length,
        confirmed: Object.values(mpesaStatusStore).filter(t => t.status === 'payment_confirmed').length,
        failed: Object.values(mpesaStatusStore).filter(t => t.status === 'failed').length,
        completed: Object.values(mpesaStatusStore).filter(t => t.status === 'completed').length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get admin wallet address
 * GET /api/v1/admin/address
 */
export const getAdminAddressController = (
  req: Request,
  res: Response
): Response => {
  try {
    const keyring = new Keyring({ type: 'sr25519' });
    const safeMnemonic = sanitizeMnemonic(MNEMONIC);

    if (!mnemonicValidate(safeMnemonic)) {
      console.error('[getAdminAddressController] BIP39 mnemonic failed validation');
      return res.status(500).json({
        status: 'failed',
        error: 'Invalid admin mnemonic configuration',
      });
    }

    const adminAccount = keyring.addFromUri(safeMnemonic);
    const adminAddress = adminAccount.address;

    console.log('[getAdminAddressController] Admin address requested');

    return res.json({
      status: 'success',
      address: adminAddress,
      message: 'Send crypto to this address to sell',
      supportedTokens: ['PAS', 'USDT', 'USDC'],
    });
  } catch (error: any) {
    console.error('[getAdminAddressController] Error:', error.message);
    return res.status(500).json({
      status: 'failed',
      error: error.message,
    });
  }
};

/**
 * Get all pending transactions
 * GET /api/v1/transactions/pending
 */
export const getPendingTransactionsController = (
  req: Request,
  res: Response
): Response => {
  console.log('[getPendingTransactionsController] Fetching pending transactions');

  const pendingTransactions = Object.entries(mpesaStatusStore)
    .filter(([_, data]) => data.status === 'pending' || data.status === 'payment_confirmed')
    .map(([merchantId, data]) => ({
      merchantRequestId: merchantId,
      ...data,
    }));

  return res.json({
    status: 'success',
    count: pendingTransactions.length,
    transactions: pendingTransactions,
  });
};

/**
 * Get transaction history
 * GET /api/v1/transactions/history
 */
export const getTransactionHistoryController = (
  req: Request,
  res: Response
): Response => {
  console.log('[getTransactionHistoryController] Fetching transaction history');

  const allTransactions = Object.entries(mpesaStatusStore).map(([merchantId, data]) => ({
    merchantRequestId: merchantId,
    ...data,
    blockHash: data.details?.blockHash,
  }));

  return res.json({
    status: 'success',
    count: allTransactions.length,
    transactions: allTransactions,
  });
};

/**
 * Check if sufficient balance exists for a transaction
 * POST /api/v1/balance/check
 */
export const checkBalanceController = async (
  req: Request<{}, {}, { address: string; amount: string; token: string; type: 'buy' | 'sell' }>,
  res: Response
): Promise<Response> => {
  try {
    const { address, amount, token, type } = req.body;

    if (!address || !amount || !token || !type) {
      return res.status(400).json({
        status: 'failed',
        error: 'Missing required fields: address, amount, token, type',
      });
    }

    if (!EXCHANGE_RATES[token]) {
      return res.status(400).json({
        status: 'failed',
        error: `Unsupported token: ${token}. Supported tokens: PAS, USDT, USDC`,
      });
    }

    const cryptoAmount = parseFloat(amount);
    if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
      return res.status(400).json({
        status: 'failed',
        error: 'Amount must be a positive number',
      });
    }

    let balanceCheck: BalanceCheckResult;

    if (type === 'buy') {
      // For buying, check admin balance
      balanceCheck = await checkAdminBalance(token, cryptoAmount);
    } else if (type === 'sell') {
      // For selling, check user balance
      balanceCheck = await checkUserBalance(address, token, cryptoAmount);
    } else {
      return res.status(400).json({
        status: 'failed',
        error: 'Invalid type. Must be "buy" or "sell"',
      });
    }

    return res.json({
      status: 'success',
      ...balanceCheck,
    });
  } catch (error: any) {
    console.error('[checkBalanceController] Error:', error.message);
    return res.status(500).json({
      status: 'failed',
      error: error.message,
    });
  }
};

/**
 * Get quote for buying or selling crypto
 * GET /api/v1/quote?amount=1000&token=PAS&type=buy
 */
export const getQuoteController = (
  req: Request,
  res: Response
): Response => {
  try {
    let amountRaw = req.query.amount;
    let tokenRaw = req.query.token;
    let typeRaw = req.query.type;

    // Normalize arrays to single values
    let amount = Array.isArray(amountRaw) ? amountRaw[0] : amountRaw;
    let token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
    let type = Array.isArray(typeRaw) ? typeRaw[0] : typeRaw;

    // Provide default values if undefined
    if (typeof amount === 'undefined') amount = '';
    if (typeof token === 'undefined') token = 'PAS';
    if (typeof type === 'undefined') type = 'buy';

    // Validate amount
    if (typeof amount !== 'string' || amount.trim() === '') {
      return res.status(400).json({
        status: 'failed',
        error: 'Missing or invalid amount parameter',
      });
    }

    // Validate token type
    if (typeof token !== 'string' || !EXCHANGE_RATES[token]) {
      return res.status(400).json({
        status: 'failed',
        error: `Invalid or unsupported token: ${token}. Supported tokens: PAS, USDT, USDC`,
      });
    }

    // Validate transaction type
    if (typeof type !== 'string' || !['buy', 'sell'].includes(type)) {
      return res.status(400).json({
        status: 'failed',
        error: 'Type must be "buy" or "sell"',
      });
    }

    // Validate parsed amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        status: 'failed',
        error: 'Amount must be a positive number',
      });
    }

    // Ensure exchange rate exists and is a number
    const exchangeRate = EXCHANGE_RATES[token];
    if (typeof exchangeRate !== 'number') {
      throw new Error('Exchange rate undefined');
    }

    // Compute amounts
    if (type === 'buy') {
      // User pays KES, receives crypto
      const kesAmount = numAmount;
      const cryptoAmount = kesAmount * exchangeRate;

      return res.json({
        status: 'success',
        type: 'buy',
        token,
        kesAmount,
        cryptoAmount,
        exchangeRate,
        rateDescription: `1 KES = ${exchangeRate} ${token}`,
      });
    } else {
      // User sends crypto, receives KES
      const cryptoAmount = numAmount;
      const kesAmount = Math.floor(cryptoAmount / exchangeRate);

      return res.json({
        status: 'success',
        type: 'sell',
        token,
        cryptoAmount,
        kesAmount,
        exchangeRate,
        rateDescription: `1 ${token} = ${(1 / exchangeRate).toFixed(2)} KES`,
      });
    }
  } catch (error: any) {
    console.error('[getQuoteController] Error:', error.message);
    return res.status(500).json({
      status: 'failed',
      error: error.message,
    });
  }
};

/**
 * Update exchange rates (admin only)
 * POST /api/v1/rates/update
 */
export const updateRatesController = (
  req: Request<{}, {}, { rates: Record<string, number> }>,
  res: Response
): Response => {
  try {
    const { rates } = req.body;

    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({
        status: 'failed',
        error: 'Invalid rates object',
      });
    }

    // Validate rates
    for (const [token, rate] of Object.entries(rates)) {
      if (!ASSET_DECIMALS[token]) {
        return res.status(400).json({
          status: 'failed',
          error: `Unknown token: ${token}. Supported tokens: PAS, USDT, USDC`,
        });
      }

      if (typeof rate !== 'number' || rate <= 0) {
        return res.status(400).json({
          status: 'failed',
          error: `Invalid rate for ${token}. Must be a positive number.`,
        });
      }
    }

    // Update rates
    Object.assign(EXCHANGE_RATES, rates);

    console.log('[updateRatesController] Updated exchange rates:', EXCHANGE_RATES);

    return res.json({
      status: 'success',
      message: 'Exchange rates updated successfully',
      rates: EXCHANGE_RATES,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[updateRatesController] Error:', error.message);
    return res.status(500).json({
      status: 'failed',
      error: error.message,
    });
  }
};

/**
 * Get transaction details by merchant request ID
 * GET /api/v1/transaction/:merchantRequestId
 */
export const getTransactionController = (
  req: Request,
  res: Response
): Response => {
  try {
    const { merchantRequestId } = req.params;

    if (!merchantRequestId) {
      return res.status(400).json({
        status: 'failed',
        error: 'Missing merchantRequestId parameter',
      });
    }

    const transaction = mpesaStatusStore[merchantRequestId];

    if (!transaction) {
      return res.status(404).json({
        status: 'failed',
        error: 'Transaction not found',
      });
    }

    return res.json({
      status: 'success',
      merchantRequestId,
      transaction,
    });
  } catch (error: any) {
    console.error('[getTransactionController] Error:', error.message);
    return res.status(500).json({
      status: 'failed',
      error: error.message,
    });
  }
};

/**
 * Cancel a pending transaction
 * POST /api/v1/transaction/:merchantRequestId/cancel
 */
export const cancelTransactionController = (
  req: Request,
  res: Response
): Response => {
  try {
    const { merchantRequestId } = req.params;

    if (!merchantRequestId) {
      return res.status(400).json({
        status: 'failed',
        error: 'Missing merchantRequestId parameter',
      });
    }

    const transaction = mpesaStatusStore[merchantRequestId];

    if (!transaction) {
      return res.status(404).json({
        status: 'failed',
        error: 'Transaction not found',
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        status: 'failed',
        error: `Cannot cancel transaction with status: ${transaction.status}`,
      });
    }

    mpesaStatusStore[merchantRequestId]!.status = 'cancelled';

    console.log(`[cancelTransactionController] Cancelled transaction ${merchantRequestId}`);

    return res.json({
      status: 'success',
      message: 'Transaction cancelled successfully',
      merchantRequestId,
    });
  } catch (error: any) {
    console.error('[cancelTransactionController] Error:', error.message);
    return res.status(500).json({
      status: 'failed',
      error: error.message,
    });
  }
};