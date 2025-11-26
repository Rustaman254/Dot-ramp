# DotRamp - Crypto On/Off Ramp for Paseo Network

A complete crypto on-ramp and off-ramp solution that allows users to buy and sell Polkadot ecosystem tokens (PAS, USDT, USDC, DAI) using MPESA mobile money.

## 🚀 Features

- **Buy Crypto**: Pay with MPESA, receive crypto in your wallet
- **Sell Crypto**: Send crypto, receive KES via MPESA
- **Multi-Token Support**: PAS, USDT, USDC, DAI
- **Real-time Status**: Track payment and transfer status
- **Automatic Processing**: Background job processes confirmed payments
- **Full API**: RESTful API for integration

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MPESA Daraja API credentials (Consumer Key, Consumer Secret, Passkey)
- Admin wallet with sufficient funds on Paseo Network

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/yourusername/dotramp.git
cd dotramp
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```bash
# Server
PORT=3000
NODE_ENV=development

# Admin Wallet (KEEP SECRET!)
ADMIN_MNEMONIC="your twelve word mnemonic here"

# MPESA Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASS_KEY=your_passkey

# MPESA Callbacks (must be publicly accessible)
MPESA_CALLBACK=https://yourdomain.com/api/v1/callback
MPESA_B2C_RESULT_URL=https://yourdomain.com/api/v1/b2c/result
MPESA_B2C_TIMEOUT_URL=https://yourdomain.com/api/v1/b2c/timeout

# Africa's Talking Credentials
AFRICASTALKING_USERNAME=your_africastalking_username
AFRICASTALKING_API_KEY=your_africastalking_api_key


# B2C Configuration
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=your_security_credential
```

### 3. Get MPESA Credentials

1. Go to [Safaricom Daraja Portal](https://developer.safaricom.co.ke/)
2. Create an account and log in
3. Create a new app
4. Get your Consumer Key and Consumer Secret
5. Go to "Test Credentials" to get your Passkey
6. For B2C, generate Security Credential using the Initiator Password

### 4. Create Admin Wallet

Generate a new Polkadot wallet:

**Option A: Using Polkadot.js Extension**
1. Install Polkadot.js extension
2. Create new account
3. Save the 12-word mnemonic

**Option B: Using subkey**
```bash
# Install subkey
cargo install --force subkey --git https://github.com/paritytech/substrate

# Generate new key
subkey generate

# Copy the mnemonic to .env
```

### 5. Fund Admin Wallet

Get testnet tokens from the Paseo faucet:
- PAS: https://faucet.polkadot.io/paseo
- USDT/USDC: Request from Paseo Asset Hub community

### 6. Set Up Ngrok (for local development)

MPESA callbacks require a public URL. Use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Copy the HTTPS URL to .env
MPESA_CALLBACK=https://your-ngrok-url.ngrok.io/api/v1/callback
```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Set Up Cron Job for Payment Processing

Create a cron job to process confirmed payments every 5 minutes:

```bash
crontab -e
```

Add this line:

```bash
*/5 * * * * curl -X POST http://localhost:3000/api/v1/process-payments
```

Or use a systemd timer, PM2, or your preferred job scheduler.

## 📡 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check and status |
| GET | `/api/v1/tokens` | Get supported tokens |
| GET | `/api/v1/rates` | Get exchange rates |
| GET | `/api/v1/admin/address` | Get admin wallet address |
| POST | `/api/v1/buy` | Buy crypto with MPESA |
| POST | `/api/v1/sell` | Sell crypto for MPESA |
| GET | `/api/v1/status` | Check payment status |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payout` | Manual crypto payout |
| POST | `/api/v1/process-payments` | Process confirmed payments |
| GET | `/api/v1/transactions/pending` | Get pending transactions |
| GET | `/api/v1/transactions/history` | Get transaction history |

### MPESA Callbacks (Internal)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/callback` | STK Push callback |
| POST | `/api/v1/b2c/result` | B2C result callback |
| POST | `/api/v1/b2c/timeout` | B2C timeout callback |

## 🧪 Testing

### Test Buy Flow

```bash
curl -X POST http://localhost:3000/api/v1/buy \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "amount": 100,
    "token": "PAS",
    "userAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  }'
```

### Test Status Check

```bash
curl "http://localhost:3000/api/v1/status?merchantRequestId=29115-34620561-1"
```

### Test Sell Flow

```bash
# 1. Get admin address
curl http://localhost:3000/api/v1/admin/address

# 2. Send crypto to admin address (use Polkadot.js wallet)

# 3. Initiate sell
curl -X POST http://localhost:3000/api/v1/sell \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "amount": "10.5",
    "token": "USDT",
    "fromAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  }'
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Add to .gitignore
2. **Use environment variables** for all secrets
3. **Enable HTTPS** in production
4. **Rate limit** API endpoints
5. **Validate all inputs** before processing
6. **Monitor transactions** for suspicious activity
7. **Keep dependencies updated** - `npm audit fix`
8. **Use strong authentication** for admin endpoints
9. **Regularly rotate** API keys and credentials
10. **Back up** admin wallet mnemonic securely

## 📊 Project Structure

```
dotramp/
├── src/
│   ├── controllers/
│   │   └── dotrampController.ts    # Main business logic
│   ├── routes/
│   │   └── dotrampRoutes.ts        # API routes
│   ├── utils/
│   │   ├── mpesaAuth.ts            # MPESA authentication
│   │   └── mpesaUtils.ts           # MPESA utilities
│   └── server.ts                    # Express server
├── dist/                            # Compiled TypeScript
├── .env                             # Environment variables (not committed)
├── .env.example                     # Example environment variables
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

## 🐛 Troubleshooting

### MPESA STK Push Not Appearing

1. Check phone number format (254XXXXXXXXX)
2. Verify MPESA credentials in `.env`
3. Ensure callback URL is publicly accessible
4. Check Daraja API logs

### Crypto Transfer Failed

1. Verify admin wallet has sufficient balance
2. Check network connection to RPC endpoints
3. Verify mnemonic is correct
4. Check transaction logs

### API Not Responding

1. Check if server is running: `curl http://localhost:3000/api/v1/health`
2. Verify PORT in `.env`
3. Check firewall settings
4. Review server logs

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📧 Support

- Email: support@dotramp.com
- GitHub Issues: https://github.com/yourusername/dotramp/issues
- Telegram: @dotramp

## 🔗 Resources

- [Polkadot.js Docs](https://polkadot.js.org/docs/)
- [Safaricom Daraja API](https://developer.safaricom.co.ke/)
- [Paseo Network](https://paseo.subscan.io/)
- [Substrate Docs](https://docs.substrate.io/)

---

Made with ❤️ for the Polkadot ecosystem