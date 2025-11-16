import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import mpesaRoutes from './routes/mpesaRoutes.js';
import { disconnectApis } from './controller/mpesaController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log({
  shortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
  passkey: process.env.MPESA_PASS_KEY,
  callbackUrl: process.env.MPESA_CALLBACK,
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET
});



app.use(cors());
app.use(express.json());
app.use('/api/v1/', mpesaRoutes);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error Handler]', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
  });
});

const gracefulShutdown = async () => {
  console.log('\n[Server] Shutting down gracefully...');
  try {
    await disconnectApis();
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.get('/', (req, res) => {
  res.json({
    message: 'DotRamp API - Crypto On/Off Ramp for Paseo Network',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      tokens: '/api/v1/tokens',
      rates: '/api/v1/rates',
      buy: '/api/v1/buy',
      sell: '/api/v1/sell',
      status: '/api/v1/status?merchantRequestId=xxx',
      adminAddress: '/api/v1/admin/address',
      payout: '/api/v1/payout',
      processPayments: '/api/v1/process-payments',
      pendingTransactions: '/api/v1/transactions/pending',
      transactionHistory: '/api/v1/transactions/history',
    },
    documentation: 'https://github.com/yourusername/dotramp',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
