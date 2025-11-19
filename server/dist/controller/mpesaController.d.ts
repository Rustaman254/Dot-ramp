import type { Request, Response } from 'express';
export declare const disconnectApis: () => Promise<void>;
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
/**
 * BUY CRYPTO: Initiate MPESA STK Push for buying crypto
 * POST /api/v1/buy
 * Supports: PAS, USDT, USDC
 */
export declare const buyCryptoController: (req: Request<{}, {}, MpesaRequestBody>, res: Response) => Promise<Response | void>;
/**
 * SELL CRYPTO: User initiates sell, system transfers crypto from user to admin, then sends M-PESA
 * POST /api/v1/sell
 * Supports: PAS, USDT, USDC
 * User must sign the transaction on the frontend before calling this endpoint
 */
export declare const sellCryptoController: (req: Request<{}, {}, SellCryptoBody>, res: Response) => Promise<Response | void>;
/**
 * MPESA Callback endpoint
 * POST /api/v1/callback
 */
export declare const callbackUrlController: (req: Request, res: Response) => Response;
/**
 * B2C Result callback (for sell transactions)
 * POST /api/v1/b2c/result
 */
export declare const b2cResultController: (req: Request, res: Response) => Response;
/**
 * B2C Timeout callback (for sell transactions)
 * POST /api/v1/b2c/timeout
 */
export declare const b2cTimeoutController: (req: Request, res: Response) => Response;
/**
 * Status endpoint
 * GET /api/v1/status?merchantRequestId=xxx
 */
export declare const mpesaStatusController: (req: Request, res: Response) => Response;
/**
 * Payout/Transfer crypto endpoint
 * POST /api/v1/payout
 * ALL TRANSFERS HAPPEN ON ASSET HUB
 * Supports: PAS, USDT, USDC
 */
export declare const payoutController: (req: Request<{}, {}, PayoutBody>, res: Response) => Promise<Response | void>;
/**
 * Get balance for an address
 * GET /api/v1/balance?address=xxx&token=PAS
 * ALL BALANCES QUERIED FROM ASSET HUB
 * Supports: PAS, USDT, USDC
 */
export declare const getBalanceController: (req: Request, res: Response) => Promise<Response>;
/**
 * Get exchange rates
 * GET /api/v1/rates
 */
export declare const getRatesController: (req: Request, res: Response) => Response;
/**
 * Get supported tokens
 * GET /api/v1/tokens
 */
export declare const getTokensController: (req: Request, res: Response) => Response;
/**
 * Health check endpoint
 * GET /api/v1/health
 */
export declare const healthCheckController: (req: Request, res: Response) => Promise<Response>;
/**
 * Get admin wallet address
 * GET /api/v1/admin/address
 */
export declare const getAdminAddressController: (req: Request, res: Response) => Response;
/**
 * Get all pending transactions
 * GET /api/v1/transactions/pending
 */
export declare const getPendingTransactionsController: (req: Request, res: Response) => Response;
/**
 * Get transaction history
 * GET /api/v1/transactions/history
 */
export declare const getTransactionHistoryController: (req: Request, res: Response) => Response;
/**
 * Check if sufficient balance exists for a transaction
 * POST /api/v1/balance/check
 */
export declare const checkBalanceController: (req: Request<{}, {}, {
    address: string;
    amount: string;
    token: string;
    type: "buy" | "sell";
}>, res: Response) => Promise<Response>;
/**
 * Get quote for buying or selling crypto
 * GET /api/v1/quote?amount=1000&token=PAS&type=buy
 */
export declare const getQuoteController: (req: Request, res: Response) => Response;
/**
 * Update exchange rates (admin only)
 * POST /api/v1/rates/update
 */
export declare const updateRatesController: (req: Request<{}, {}, {
    rates: Record<string, number>;
}>, res: Response) => Response;
/**
 * Get transaction details by merchant request ID
 * GET /api/v1/transaction/:merchantRequestId
 */
export declare const getTransactionController: (req: Request, res: Response) => Response;
/**
 * Cancel a pending transaction
 * POST /api/v1/transaction/:merchantRequestId/cancel
 */
export declare const cancelTransactionController: (req: Request, res: Response) => Response;
export {};
//# sourceMappingURL=mpesaController.d.ts.map