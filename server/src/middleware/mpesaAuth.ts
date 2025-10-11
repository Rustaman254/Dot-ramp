import axios from "axios";
import type { Request, Response, NextFunction } from "express";

export type RequestExtended = Request & { token?: string };

export const generateToken = async (
  req: RequestExtended,
  res: Response,
  next: NextFunction
) => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({ error: "MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET missing in environment." });
  }

  const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${credentials}` }
    });

    if (!response.data.access_token) {
      // Unexpected API response
      return res.status(500).json({ error: "Did not receive access_token from Safaricom Daraja" });
    }

    req.token = response.data.access_token;
    next();
  } catch (error: any) {
    // Log the underlying error for debugging
    console.error(
      "Failed to get Mpesa token",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to get Mpesa token",
      details: error.response?.data || error.message
    });
  }
};
