"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, Phone, AlertCircle, CheckCircle2, Copy, ExternalLink, Shield, Clock, Wallet, X, Check, ChevronRight } from 'lucide-react';

type Token = {
  symbol: string;
  name: string;
  icon: string;
  color: string;
};
type WalletMeta = {
  id: string;
  name: string;
  icon: string;
  description: string;
  website: string;
};
type Account = {
  address: string;
  meta: { name?: string };
};

const tokens: Token[] = [
  { symbol: 'DOT', name: 'Polkadot', icon: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png', color: '#E6007A' },
  { symbol: 'USDT', name: 'Tether USD', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', color: '#2775CA' },
    { symbol: 'DAI', name: 'Dai', icon: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', color: '#F5AC37' },
];

const getMpesaFee = (amount: number) => {
  if (amount <= 100) return 0;
  if (amount <= 500) return 7;
  if (amount <= 1000) return 13;
  if (amount <= 1500) return 22;
  if (amount <= 2500) return 32;
  if (amount <= 3500) return 51;
  if (amount <= 5000) return 55;
  if (amount <= 7500) return 75;
  if (amount <= 10000) return 87;
  if (amount <= 15000) return 97;
  if (amount <= 20000) return 102;
  return 105;
};

const SERVICE_FEE = 0.02;

const walletProvidersMeta: WalletMeta[] = [
  { id: 'talisman', name: 'Talisman', icon: '🔮', description: 'A wallet for Polkadot & Ethereum', website: 'https://talisman.xyz/' },
  { id: 'polkadot-js', name: 'Polkadot{.js}', icon: '⬤', description: 'Browser extension for Polkadot', website: 'https://polkadot.js.org/extension/' },
  { id: 'subwallet-js', name: 'SubWallet', icon: '◆', description: 'Multi-chain wallet for Polkadot', website: 'https://subwallet.app/' },
  { id: 'nova', name: 'Nova Wallet', icon: '⭐', description: 'Next-gen wallet for Polkadot', website: 'https://novawallet.io/' },
];

const LOCAL_STORAGE_KEY = "dotramp_wallet_connected";
const PROD_URL = process.env.PROD_URL || 'http://localhost:8000'
console.log(PROD_URL);

const Home: React.FC = () => {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [selectedToken, setSelectedToken] = useState<string>('DOT');
  const [amount, setAmount] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [cryptoAmount, setCryptoAmount] = useState<string>('');
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success' | 'failed' | 'cancelled'>('input');
  const [txId, setTxId] = useState<string>('');
  const [merchantRequestId, setMerchantRequestId] = useState<string>('');
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [showWalletPopup, setShowWalletPopup] = useState<boolean>(false);
  const [showWalletSelector, setShowWalletSelector] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<WalletMeta[]>([]);
  const [selectedWalletInfo, setSelectedWalletInfo] = useState<WalletMeta | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [liveRatesKES, setLiveRatesKES] = useState<{ [symbol: string]: number }>({
    DOT: 0,
    USDT: 0,
    USDC: 0,
    DAI: 0,
  });

  useEffect(() => {
    const walletJson = typeof window !== "undefined" && localStorage.getItem(LOCAL_STORAGE_KEY);
    if (walletJson) {
      const parsed = JSON.parse(walletJson);
      const walletMeta = walletProvidersMeta.find(w => w.id === parsed.walletId);
      if (walletMeta) {
        setSelectedWalletInfo(walletMeta);
        setWalletConnected(true);
        setWalletAddress(parsed.address);
        setUsername(parsed.username);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchRates() {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=polkadot,tether,usd-coin,dai&vs_currencies=kes'
      );
      const data = await response.json();
      setLiveRatesKES({
        DOT: data.polkadot?.kes || 0,
        USDT: data.tether?.kes || 0,
        USDC: data['usd-coin']?.kes || 0,
        DAI: data.dai?.kes || 0,
      });
    }
    fetchRates();
  }, []);

  useEffect(() => {
    console.log("mode", mode)
    if (
      step === 'success' &&
      mode === 'buy' &&
      walletConnected &&
      walletAddress &&
      cryptoAmount
    ) {
      fetch(`${PROD_URL}/api/v1/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          amount: cryptoAmount,
          token: selectedToken
        })
      })
        .then(async res => {
          if (!res.ok) {
            const err = await res.json();
            console.error('Payout failed:', err.error || err);
          } else {
            const response = await res.json();
            console.log('Payout success:', response);
          }
        })
        .catch(e => {
          console.error('Payout error:', e);
        });
    }
  }, [step, walletConnected, walletAddress, cryptoAmount, selectedToken, mode]);


  const handleOpenWalletSelector = async () => {
    const { web3Enable } = await import('@polkadot/extension-dapp');
    const enabled = await web3Enable('DotRamp');
    const extensionNames = enabled.map(e => e.name.toLowerCase());
    const installedWallets = walletProvidersMeta.filter(wallet =>
      extensionNames.includes(wallet.id) || extensionNames.includes(wallet.name.toLowerCase())
    );
    setAvailableWallets(installedWallets);
    setShowWalletSelector(true);
    setAccounts([]);
    setSelectedWalletInfo(null);
  };

  const handleSelectWallet = async (wallet: WalletMeta) => {
    const { web3Accounts } = await import('@polkadot/extension-dapp');
    const fetchedAccounts: Account[] = await web3Accounts();
    setSelectedWalletInfo(wallet);
    setAccounts(fetchedAccounts);
  };

  useEffect(() => {
    if (showWalletSelector && accounts.length === 1) {
      const address = accounts[0].address;
      const name = accounts[0].meta.name || "PolkadotUser";
      setWalletAddress(address);
      setUsername(name);
      setWalletConnected(true);
      setShowWalletSelector(false);
      setAccounts([]);
      setSelectedWalletInfo(selectedWalletInfo => {
        if (selectedWalletInfo && typeof window !== "undefined") {
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({
              walletId: selectedWalletInfo.id,
              address,
              username: name
            })
          );
        }
        return selectedWalletInfo;
      });
    }
  }, [showWalletSelector, accounts]);

  const handleSelectAccount = (account: Account) => {
    const address = account.address;
    const name = account.meta.name || "PolkadotUser";
    setWalletAddress(address);
    setUsername(name);
    setWalletConnected(true);
    setShowWalletSelector(false);
    setAccounts([]);
    setSelectedWalletInfo(selectedWalletInfo => {
      if (selectedWalletInfo && typeof window !== "undefined") {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            walletId: selectedWalletInfo.id,
            address,
            username: name
          })
        );
      }
      return selectedWalletInfo;
    });
  };

  const handleDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setUsername('');
    setSelectedWalletInfo(null);
    setShowWalletPopup(false);
    setStep('input');
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatAddress = (addr: string): string => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  useEffect(() => {
    if (amount && !isNaN(Number(amount)) && liveRatesKES[selectedToken]) {
      const tokenKES = liveRatesKES[selectedToken];
      const amountNum = parseFloat(amount);
      const mpesaFee = getMpesaFee(amountNum);
      if (mode === 'buy') {
        const netAmount = amountNum - mpesaFee;
        const afterFee = netAmount * (1 - SERVICE_FEE);
        const crypto = (afterFee / tokenKES).toFixed(6);
        setCryptoAmount(crypto);
      } else {
        const fiatValue = amountNum * tokenKES;
        const afterFee = fiatValue * (1 - SERVICE_FEE);
        const finalAmount = (afterFee - mpesaFee).toFixed(2);
        setCryptoAmount(finalAmount);
      }
    } else {
      setCryptoAmount('');
    }
  }, [amount, selectedToken, mode, liveRatesKES]);

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const kenyanPhoneRegex = /^(?:254|\+254|0)?(7(?:(?:[01249][0-9])|(?:5[789])|(?:6[89]))[0-9]{6})$/;
    if (kenyanPhoneRegex.test(value)) {
      setPhoneInput(value);
    } else {
      // Optionally, handle invalid input, e.g., show an error message
      setPhoneInput(value); // Or keep the old value
    }
  };

  const getMsisdn = () => {
    const kenyanPhoneRegex = /^(?:254|\+254|0)?(7(?:(?:[01249][0-9])|(?:5[789])|(?:6[89]))[0-9]{6})$/;
    const match = phoneInput.match(kenyanPhoneRegex);
    if (match) {
      return `254${match[1]}`;
    }
    return "";
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    if (step === 'processing' && merchantRequestId) {
      const pollStatus = async () => {
        try {
          const statusRes = await fetch(`${PROD_URL}/api/v1/mpesa/status?merchantRequestId=${merchantRequestId}`);
          if (statusRes.status === 429) return;
          if (statusRes.status === 404) return;
          const statusData = await statusRes.json();
          console.log(statusData)
          if (statusData.status === "success") {
            setStep('success');
            if (pollInterval) clearInterval(pollInterval);
          } else if (statusData.status === "cancelled") {
            setStep('cancelled');
            if (pollInterval) clearInterval(pollInterval);
          } else if (statusData.status === "failed") {
            setStep('failed');
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (err) {
          setStep('failed');
          if (pollInterval) clearInterval(pollInterval);
        }
      };
      pollInterval = setInterval(pollStatus, 2000);
      pollStatus();
    }
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [step, merchantRequestId]);

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAmount(value);
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(e.target.value);
  };

  const handleContinue = async () => {
    if (step === 'input') {
      setStep('confirm');
    } else if (step === 'confirm') {
      setStep('processing');
      if (mode === 'buy') {
        const msisdn = getMsisdn();
        if (!msisdn) {
          setStep('failed');
          return;
        }
        const response = await fetch(`${PROD_URL}/api/v1/mpesa/stk-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount,
            phone: msisdn
          })
        });
        const data = await response.json();
        if (data.MerchantRequestID) {
          setMerchantRequestId(data.MerchantRequestID);
        }
      }
      setTxId(`TX${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    }
  };

  const selectedTokenData = tokens.find(t => t.symbol === selectedToken) ?? tokens[0];

  if (showWalletSelector) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative">
          <button onClick={() => { setShowWalletSelector(false); setAccounts([]); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="mb-6">
            <h2 className="text-2xl font-medium mb-2">Connect Wallet</h2>
            <p className="text-gray-400 text-sm">Choose a wallet extension to connect to DotRamp</p>
          </div>
          {availableWallets.length > 0 && accounts.length === 0 ? (
            <div className="space-y-3">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleSelectWallet(wallet)}
                  className="w-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-emerald-500 rounded-xl p-4 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-2xl">{wallet.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-white mb-0.5">{wallet.name}</div>
                      <div className="text-sm text-gray-400">{wallet.description}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : null}
          {accounts.length > 1 ? (
            <div className="space-y-3 mt-2">
              <p className="text-gray-400 mb-3">Select account to connect:</p>
              {accounts.map((account) => (
                <button
                  key={account.address}
                  onClick={() => handleSelectAccount(account)}
                  className="w-full bg-zinc-900 hover:bg-emerald-500/20 border border-zinc-800 hover:border-emerald-500 rounded-xl p-4 transition-all text-left flex items-center"
                >
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 font-mono text-xs text-white mr-3">{formatAddress(account.address)}</span>
                  <span className="flex-1 font-medium text-white">{account.meta.name || 'Polkadot Account'}</span>
                  <Check className="w-4 h-4 text-emerald-400" />
                </button>
              ))}
            </div>
          ) : null}
          {availableWallets.length === 0 && accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-white mb-2">No Wallets Detected</h3>
              <p className="text-sm text-gray-400 mb-6">Install a Polkadot wallet extension to continue</p>
              <div className="space-y-2">
                {walletProvidersMeta.map((wallet) => (
                  <a
                    key={wallet.id}
                    href={wallet.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-xl p-3 transition-colors text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{wallet.icon}</span>
                      <span className="text-white">{wallet.name}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (showWalletPopup) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative">
          <button onClick={() => setShowWalletPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-black">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <h3 className="text-xl font-medium text-white mb-1">{username}</h3>
            <p className="text-sm text-gray-400">Connected with {selectedWalletInfo?.name}</p>
          </div>
          <div className="bg-black border border-zinc-800 rounded-xl p-4 mb-4">
            <label className="text-xs text-gray-400 block mb-2">WALLET ADDRESS</label>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm text-white break-all">{walletAddress}</span>
              <button onClick={copyAddress} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0">
                {copiedAddress ? (<Check className="w-4 h-4 text-emerald-400" />) : (<Copy className="w-4 h-4 text-gray-400" />)}
              </button>
            </div>
          </div>
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-xl">{selectedWalletInfo?.icon}</div>
              <div>
                <div className="text-sm font-medium text-white">{selectedWalletInfo?.name}</div>
                <div className="text-xs text-gray-400">Connected Wallet</div>
              </div>
            </div>
          </div>
          <button onClick={handleDisconnect} className="w-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 py-3 rounded-xl transition-colors font-medium">
            Disconnect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
              <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-emerald-400"></div>
            </div>
            <h2 className="text-2xl font-medium mb-2">Processing Transaction</h2>
            <p className="text-gray-400 mb-8">Please complete M-Pesa payment on your phone</p>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Phone className="w-5 h-5 text-emerald-400" />
                <span className="text-lg">+{getMsisdn()}</span>
              </div>
              <p className="text-sm text-gray-400">
                Check your phone for the M-Pesa prompt and enter your PIN
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-medium mb-2">Transaction Complete</h2>
            <p className="text-gray-400">
              {mode === 'buy' ? 'Tokens sent to your wallet' : 'M-Pesa payment sent'}
            </p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800">
              <span className="text-gray-400">You {mode === 'buy' ? 'paid' : 'received'}</span>
              <span className="text-xl font-medium">KES {amount}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">You {mode === 'buy' ? 'received' : 'sent'}</span>
              <div className="flex items-center gap-2">
                <img src={selectedTokenData.icon} alt={selectedTokenData.symbol} className="w-5 h-5" />
                <span className="text-xl font-medium">{mode === 'buy' ? cryptoAmount : amount} {selectedTokenData.symbol}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Transaction ID</span>
                <button className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300">
                  <span className="font-mono">{txId}</span>
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setStep('input');
              setAmount('');
              setPhoneInput('');
              setCryptoAmount('');
              setMerchantRequestId('');
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-4 rounded-xl transition-colors"
          >
            Make Another Transaction
          </button>
          <a
            href={`https://polkadot.js.org/apps/#/explorer/query/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-3 text-gray-400 hover:text-white py-3 transition-colors flex items-center cursor-pointer justify-center gap-2"
          >
            View on Explorer
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
              <X className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-medium mb-2">Transaction Failed</h2>
            <p className="text-gray-400">
              The transaction did not complete. Please try again.
            </p>
          </div>
          <button
            onClick={() => {
              setStep('input');
              setAmount('');
              setPhoneInput('');
              setCryptoAmount('');
              setMerchantRequestId('');
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-4 rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (step === 'cancelled') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
              <AlertCircle className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-medium mb-2">Transaction Cancelled</h2>
            <p className="text-gray-400">
              You cancelled the payment on your phone. No funds were deducted.
            </p>
          </div>
          <button
            onClick={() => {
              setStep('input');
              setAmount('');
              setPhoneInput('');
              setCryptoAmount('');
              setMerchantRequestId('');
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-4 rounded-xl transition-colors"
          >
            Make Another Transaction
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <button
              onClick={() => setStep('input')}
              className="text-gray-400 hover:text-white mb-4"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-medium mb-2">Confirm Transaction</h2>
            <p className="text-gray-400">Review details before continuing</p>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-lg font-bold text-white">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">{username}</h3>
                <p className="text-sm text-white/70 font-mono">{formatAddress(walletAddress)}</p>
              </div>
              <div className="w-8 h-8 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-lg">
                {selectedWalletInfo?.icon}
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Receiving Address</span>
                <button
                  onClick={copyAddress}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-xs text-white font-mono mt-1 break-all">{walletAddress}</p>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">M-Pesa Number</span>
                <span className="font-medium">+{getMsisdn()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount</span>
                <span className="font-medium">KES {amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">M-Pesa Fee</span>
                <span className="font-medium">KES {getMpesaFee(parseFloat(amount || '0'))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Service Fee ({SERVICE_FEE * 100}%)</span>
                <span className="font-medium">KES {(parseFloat(amount || '0') * SERVICE_FEE).toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-gray-400">You {mode === 'buy' ? 'receive' : 'get'}</span>
                <div className="flex items-center gap-2">
                  <img src={selectedTokenData.icon} alt={selectedTokenData.symbol} className="w-6 h-6" />
                  <span className="text-xl font-medium text-emerald-400">
                    {cryptoAmount} {mode === 'buy' ? selectedTokenData.symbol : 'KES'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-400 font-medium mb-1">Important</p>
                <p className="text-amber-200/80">
                  You will receive an M-Pesa prompt on +{getMsisdn()}. Complete the payment within 5 minutes.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-4 rounded-xl transition-colors"
          >
            Confirm & Pay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium">DotRamp</h1>
          </div>
          {walletConnected ? (
            <button
              onClick={() => setShowWalletPopup(true)}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-emerald-500 rounded-xl px-4 py-3 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-sm font-bold text-black">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{username}</div>
                <div className="text-xs text-gray-400 font-mono">{formatAddress(walletAddress)}</div>
              </div>
            </button>
          ) : (
            <button
              onClick={handleOpenWalletSelector}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium px-6 py-3 rounded-xl transition-colors"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!walletConnected ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full mb-6">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-medium mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your Polkadot wallet to start buying and selling crypto</p>
            <button
              onClick={handleOpenWalletSelector}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium px-8 py-4 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex gap-2 mb-8 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setMode('buy')}
                  className={`flex-1 cursor-pointer py-3 rounded-lg font-medium transition-all ${mode === 'buy' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Buy Crypto
                </button>
                <button
                  onClick={() => setMode('sell')}
                  className={`flex-1 py-3 cursor-pointer rounded-lg font-medium transition-all ${mode === 'sell' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Sell Crypto
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">{mode === 'buy' ? 'You receive' : 'You send'}</label>
                <div className="relative">
                  <select
                    value={selectedToken}
                    onChange={handleTokenChange}
                    className="w-full cursor-pointer bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 pl-14 pr-10 appearance-none text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {tokens.map(token => (
                      <option className='cursor-pointer' key={token.symbol} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <img src={selectedTokenData.icon} alt={selectedTokenData.symbol} className="w-6 h-6" />
                  </div>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Current price: <span className="text-emerald-400 font-bold">KES {liveRatesKES[selectedToken] ? liveRatesKES[selectedToken].toFixed(2) : 'Loading...'}</span>
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">{mode === 'buy' ? 'Amount to pay (KES)' : 'Amount to sell'}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountInputChange}
                    placeholder="0.00"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-2xl font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{mode === 'buy' ? 'KES' : selectedTokenData.symbol}</span>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">M-Pesa Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 font-mono select-none">+254</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{9}"
                    value={phoneInput}
                    onChange={handlePhoneInputChange}
                    placeholder="712345678"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-24 pr-4 py-4 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              {cryptoAmount && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">You {mode === 'buy' ? 'receive' : 'get'}</span>
                    <div className="flex items-center gap-2">
                      <img src={selectedTokenData.icon} alt={selectedTokenData.symbol} className="w-6 h-6" />
                      <span className="text-2xl font-medium text-emerald-400">{cryptoAmount} {mode === 'buy' ? selectedTokenData.symbol : 'KES'}</span>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleContinue}
                disabled={!amount || !phoneInput}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-gray-500 text-black font-medium py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-medium mb-4">Fee Breakdown</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>M-Pesa Transaction Fee</span>
                    <span className="text-white">KES {getMpesaFee(parseFloat(amount || '0'))}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Service Fee</span>
                    <span className="text-white">{SERVICE_FEE * 100}%</span>
                  </div>
                  <div className="pt-3 border-t border-zinc-800 flex justify-between">
                    <span className="text-gray-400">Total Fees</span>
                    <span className="text-white font-medium">
                      KES {(getMpesaFee(parseFloat(amount || '0')) + parseFloat(amount || '0') * SERVICE_FEE).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-400 mb-1">Instant Delivery</h4>
                    <p className="text-sm text-blue-300/80">
                      Tokens are delivered to your wallet within 30 seconds of M-Pesa confirmation.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-emerald-400 mb-1">Secure & Licensed</h4>
                    <p className="text-sm text-emerald-300/80">
                      Fully compliant with Kenyan regulations. Your funds are secure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
