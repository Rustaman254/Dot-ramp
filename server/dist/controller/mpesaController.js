import dotenv from 'dotenv';
import axios from 'axios';
import { sendMpesaStkPush } from '../utils/mpesaSTKPush.js';
dotenv.config();
export const mpesaController = async (req, res) => {
    const { amount, phone } = req.body;
    try {
        const shortCode = process.env.MPESA_SHORTCODE;
        const passkey = process.env.MPESA_PASSKEY;
        const callbackUrl = process.env.MPESA_CALLBACK;
        const accountReference = "DotRamp";
        const transactionDesc = "Buy Crypto";
        const consumerKey = process.env.MPESA_CONSUMER_KEY;
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
        const { data: tokenRes } = await axios.get(`https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { Authorization: `Basic ${auth}` }
        });
        const token = tokenRes.access_token;
        const response = await sendMpesaStkPush({
            shortCode,
            passkey,
            amount,
            phone,
            token,
            callbackUrl,
            accountReference,
            transactionDesc,
        });
        res.json(response);
    }
    catch (err) {
        res.status(500).json({ error: err.message || String(err) });
    }
};
//# sourceMappingURL=mpesaController.js.map