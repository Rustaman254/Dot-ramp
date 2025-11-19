import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  buyCryptoController,
  sellCryptoController,
  callbackUrlController,
  mpesaStatusController,
  payoutController,
  getBalanceController,  // Import this
  getRatesController,
  getTokensController,
  healthCheckController,
  getAdminAddressController,
  getPendingTransactionsController,
  getTransactionHistoryController,
  checkBalanceController,
  getQuoteController,
  updateRatesController,
  getTransactionController,
  cancelTransactionController,
} from '../controller/mpesaController';

const router: ExpressRouter = Router();

// Buy/Sell routes
router.post('/buy', buyCryptoController);
router.post('/sell', sellCryptoController);

// Callback routes
router.post('/callback', callbackUrlController);

// Status and transaction routes
router.get('/status', mpesaStatusController);
router.get('/transactions/pending', getPendingTransactionsController);
router.get('/transactions/history', getTransactionHistoryController);
router.get('/transaction/:merchantRequestId', getTransactionController);
router.post('/transaction/:merchantRequestId/cancel', cancelTransactionController);

// Balance and quote routes
router.get('/balance', getBalanceController);  // ADD THIS LINE
router.post('/balance/check', checkBalanceController);
router.get('/quote', getQuoteController);

// Token and rate routes
router.get('/rates', getRatesController);
router.post('/rates/update', updateRatesController);
router.get('/tokens', getTokensController);

// Admin routes
router.post('/payout', payoutController);
router.get('/admin/address', getAdminAddressController);

// Health check
router.get('/health', healthCheckController);

export default router;