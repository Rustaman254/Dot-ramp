import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import mpesaRoutes from './routes/mpesaRoutes.js';

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
app.use('/api/v1/mpesa/', mpesaRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
