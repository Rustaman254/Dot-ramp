import axios from "axios";

export async function getAccessToken(consumerKey: string, consumerSecret: string, isLive = false): Promise<string> {
  const creds = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const url = isLive
    ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const headers = {
    'Authorization': `Basic ${creds}`,
    'Content-Type': 'application/json'
  };

  console.log(url)
  const { data } = await axios.get(url, { headers });
  return data.access_token;
}
