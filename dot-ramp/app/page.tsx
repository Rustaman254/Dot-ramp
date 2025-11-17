
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Phone,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  Clock,
  Wallet,
  X,
  Check,
  ChevronRight
} from "lucide-react";
import Header from "@/app/components/header";

type Token = {
  symbol: string;
  name: string;
  decimals?: number;
  assetId?: number | null;
  chain?: string;
  exchangeRate?: number;
  icon?: string;
  color?: string;
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

const walletProvidersMeta: WalletMeta[] = [
  { id: "talisman", name: "Talisman", icon: "🔮", description: "A wallet for Polkadot & Ethereum", website: "https://talisman.xyz/" },
  { id: "polkadot-js", name: "Polkadot{.js}", icon: "⬤", description: "Browser extension for Polkadot", website: "https://polkadot.js.org/extension/" },
  { id: "subwallet-js", name: "SubWallet", icon: "◆", description: "Multi-chain wallet for Polkadot", website: "https://subwallet.app/" },
  { id: "nova", name: "Nova Wallet", icon: "⭐", description: "Next-gen wallet for Polkadot", website: "https://novawallet.io/" }
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
const LOCAL_STORAGE_KEY = "dotramp_wallet_connected";
const PROD_URL = "http://localhost:8000";
const rateMap: Record<string, string> = {
  PAS: "polkadot",
  USDT: "tether",
  USDC: "usd-coin"
};
const iconMap: Record<string, string> = {
  PAS: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
};
const colorMap: Record<string, string> = {
  PAS: "#E6007A",
  USDT: "#26A17B",
  USDC: "#2775CA"
};

const Home: React.FC = () => {
  const router = useRouter();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [cryptoAmount, setCryptoAmount] = useState<string>("");
  const [step, setStep] = useState<"input" | "confirm" | "processing" | "success" | "failed" | "cancelled">("input");
  const [txId, setTxId] = useState<string>("");
  const [merchantRequestId, setMerchantRequestId] = useState<string>("");
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [showWalletPopup, setShowWalletPopup] = useState<boolean>(false);
  const [showWalletSelector, setShowWalletSelector] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<WalletMeta[]>([]);
  const [selectedWalletInfo, setSelectedWalletInfo] = useState<WalletMeta | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [liveRatesKES, setLiveRatesKES] = useState<{ [symbol: string]: number }>({});

  useEffect(() => {
    const walletJson = typeof window !== "undefined" && localStorage.getItem(LOCAL_STORAGE_KEY);
    if (walletJson) {
      const parsed = JSON.parse(walletJson);
      const walletMeta = walletProvidersMeta.find((w) => w.id === parsed.walletId);
      if (walletMeta) {
        setSelectedWalletInfo(walletMeta);
        setWalletConnected(true);
        setWalletAddress(parsed.address);
        setUsername(parsed.username);
      }
    }
  }, []);

  useEffect(() => {
    fetch(`${PROD_URL}/api/v1/tokens`)
      .then(res => res.json())
      .then(data => {
        const tokensWithIcons = (data.tokens || []).map((token: Token) => ({
          ...token,
          icon: iconMap[token.symbol] || "",
          color: colorMap[token.symbol] || "#aaa"
        }));
        setTokens(tokensWithIcons);
        if (tokensWithIcons.length > 0 && !selectedToken) setSelectedToken(tokensWithIcons[0].symbol);
      });
  }, []);

  useEffect(() => {
    if (!selectedToken) return;
    const cgId = rateMap[selectedToken];
    if (!cgId) return;
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=kes`)
      .then(res => res.json())
      .then(data => {
        setLiveRatesKES((prev) => ({
          ...prev,
          [selectedToken]: data[cgId]?.kes || 0
        }));
      });
  }, [selectedToken]);

  useEffect(() => {
    if (
      step === "success" &&
      mode === "buy" &&
      walletConnected &&
      walletAddress &&
      cryptoAmount
    ) {
      fetch(`${PROD_URL}/api/v1/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: walletAddress,
          amount: cryptoAmount,
          token: selectedToken
        })
      });
    }
  }, [step, walletConnected, walletAddress, cryptoAmount, selectedToken, mode]);

  const handleOpenWalletSelector = async () => {
    const { web3Enable } = await import("@polkadot/extension-dapp");
    const enabled = await web3Enable("DotRamp");
    const extensionNames = enabled.map((e) => e.name.toLowerCase());
    const detectedWallets = walletProvidersMeta.filter(
      (wallet) =>
        extensionNames.includes(wallet.id) ||
        extensionNames.includes(wallet.name.toLowerCase())
    );
    setAvailableWallets(detectedWallets);
    setShowWalletSelector(true);
    setAccounts([]);
    setSelectedWalletInfo(null);
  };

  const handleSelectWallet = async (wallet: WalletMeta) => {
    const { web3Accounts } = await import("@polkadot/extension-dapp");
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
      setSelectedWalletInfo((selectedWalletInfo) => {
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
    setSelectedWalletInfo((selectedWalletInfo) => {
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
    setWalletAddress("");
    setUsername("");
    setSelectedWalletInfo(null);
    setShowWalletPopup(false);
    setStep("input");
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatAddress = (addr: string): string =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  useEffect(() => {
    const tokenKES = selectedToken ? liveRatesKES[selectedToken] : 0;
    if (amount && !isNaN(Number(amount)) && tokenKES) {
      const amountNum = parseFloat(amount);
      const mpesaFee = getMpesaFee(amountNum);
      if (mode === "buy") {
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
      setCryptoAmount("");
    }
  }, [amount, selectedToken, mode, liveRatesKES]);

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneInput(e.target.value);
  };

  const getMsisdn = () => {
    const kenyanPhoneRegex =
      /^(?:254|\+254|0)?(7(?:(?:[01249][0-9])|(?:5[789])|(?:6[89]))[0-9]{6})$/;
    const match = phoneInput.match(kenyanPhoneRegex);
    if (match) {
      return `254${match[1]}`;
    }
    return "";
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    if (step === "processing" && merchantRequestId) {
      const pollStatus = async () => {
        try {
          const statusRes = await fetch(
            `${PROD_URL}/api/v1/status?merchantRequestId=${merchantRequestId}`
          );
          if (statusRes.status === 429) return;
          if (statusRes.status === 404) return;
          const statusData = await statusRes.json();
          if (statusData.status === "success" || statusData.status === "completed") {
            setStep("success");
            if (pollInterval) clearInterval(pollInterval);
          } else if (
            statusData.status === "cancelled" ||
            statusData.status === "timeout"
          ) {
            setStep("cancelled");
            if (pollInterval) clearInterval(pollInterval);
          } else if (statusData.status === "failed") {
            setStep("failed");
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (err) {
          setStep("failed");
          if (pollInterval) clearInterval(pollInterval);
        }
      };
      pollInterval = setInterval(pollStatus, 2000);
      pollStatus();
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [step, merchantRequestId]);

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAmount(value);
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(e.target.value);
  };

  const handleContinue = async () => {
    if (step === "input") {
      setStep("confirm");
    } else if (step === "confirm") {
      setStep("processing");
      if (mode === "buy") {
        const msisdn = getMsisdn();
        if (!msisdn || !walletAddress) {
          setStep("failed");
          return;
        }
        const response = await fetch(`${PROD_URL}/api/v1/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount,
            phone: msisdn,
            token: selectedToken,
            userAddress: walletAddress
          })
        });
        const data = await response.json();
        if (data.MerchantRequestID || data.merchantRequestId) {
          setMerchantRequestId(data.MerchantRequestID || data.merchantRequestId);
        } else {
          setStep("failed");
        }
      } else {
        if (!walletAddress) {
          setStep("failed");
          return;
        }
        const response = await fetch(`${PROD_URL}/api/v1/sell`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount,
            phone: getMsisdn(),
            token: selectedToken,
            fromAddress: walletAddress
          })
        });
        const data = await response.json();
        if (data.MerchantRequestID || data.merchantRequestId) {
          setMerchantRequestId(data.MerchantRequestID || data.merchantRequestId);
        } else {
          setStep("failed");
        }
      }
      setTxId(`TX${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    }
  };

  const selectedTokenData =
    Array.isArray(tokens) && tokens.length > 0
      ? tokens.find((t) => t.symbol === selectedToken) ?? tokens[0]
      : undefined;

  if (showWalletSelector) {
    return <div></div>;
  }

  if (showWalletPopup) {
    return <div></div>;
  }

  if (step === "processing") {
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

  if (step === "success") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-medium mb-2">Transaction Complete</h2>
            <p className="text-gray-400">
              {mode === "buy" ? "Tokens sent to your wallet" : "M-Pesa payment sent"}
            </p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800">
              <span className="text-gray-400">You {mode === "buy" ? "paid" : "received"}</span>
              <span className="text-xl font-medium">KES {amount}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">You {mode === "buy" ? "received" : "sent"}</span>
              <div className="flex items-center gap-2">
                {selectedTokenData && <img src={selectedTokenData.icon} alt={selectedTokenData.symbol} className="w-5 h-5" />}
                <span className="text-xl font-medium">{mode === "buy" ? cryptoAmount : amount} {selectedTokenData?.symbol}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setStep("input");
              setAmount("");
              setPhoneInput("");
              setCryptoAmount("");
              setMerchantRequestId("");
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-4 rounded-xl transition-colors"
          >
            Make Another Transaction
          </button>
        </div>
      </div>
    );
  }

  if (step === "failed") {
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
              setStep("input");
              setAmount("");
              setPhoneInput("");
              setCryptoAmount("");
              setMerchantRequestId("");
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-4 rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (step === "cancelled") {
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
              setStep("input");
              setAmount("");
              setPhoneInput("");
              setCryptoAmount("");
              setMerchantRequestId("");
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-4 rounded-xl transition-colors"
          >
            Make Another Transaction
          </button>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <button
              onClick={() => setStep("input")}
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
                <span className="font-medium">KES {getMpesaFee(parseFloat(amount || "0"))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Service Fee ({SERVICE_FEE * 100}%)</span>
                <span className="font-medium">KES {(parseFloat(amount || "0") * SERVICE_FEE).toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-gray-400">You {mode === "buy" ? "receive" : "get"}</span>
                <div className="flex items-center gap-2">
                  {selectedTokenData && (
                    <img src={selectedTokenData.icon} alt={selectedTokenData.symbol} className="w-6 h-6" />
                  )}
                  <span className="text-xl font-medium text-emerald-400">
                    {cryptoAmount} {mode === "buy" ? selectedTokenData?.symbol : "KES"}
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
      <Header
        walletConnected={walletConnected}
        username={username}
        walletAddress={walletAddress}
        formatAddress={formatAddress}
        onShowWalletPopup={() => setShowWalletPopup(true)}
        onConnectWallet={handleOpenWalletSelector}
        onShowTransactions={() => router.push("/transactions")}
        integrationLink="/dev-docs"
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!walletConnected ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full mb-6">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-medium mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">
              Connect your Polkadot wallet to start buying and selling crypto
            </p>
            <button
              onClick={handleOpenWalletSelector}
              className="bg-emerald-500 !cursor-pointer hover:bg-emerald-600 text-black font-medium px-8 py-4 rounded-xl transition-colors inline-flex items-center gap-2"
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
                  onClick={() => setMode("buy")}
                  className={`flex-1 cursor-pointer py-3 rounded-lg font-medium transition-all ${mode === "buy"
                    ? "bg-emerald-500 text-black"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  Buy Crypto
                </button>
                <button
                  onClick={() => setMode("sell")}
                  className={`flex-1 py-3 cursor-pointer rounded-lg font-medium transition-all ${mode === "sell"
                    ? "bg-emerald-500 text-black"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  Sell Crypto
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">
                  {mode === "buy" ? "You receive" : "You send"}
                </label>
                <div className="relative">
                  <select
                    value={selectedToken}
                    onChange={handleTokenChange}
                    className="w-full cursor-pointer bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 pl-14 pr-10 appearance-none text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {Array.isArray(tokens) && tokens.map((token) => (
                      <option
                        className="cursor-pointer"
                        key={token.symbol}
                        value={token.symbol}
                      >
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {selectedTokenData && (
                      <img
                        src={selectedTokenData.icon}
                        alt={selectedTokenData.symbol}
                        className="w-6 h-6"
                      />
                    )}
                  </div>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Current price:{" "}
                  <span className="text-emerald-400 font-bold">
                    KES{" "}
                    {selectedToken && liveRatesKES[selectedToken]
                      ? liveRatesKES[selectedToken].toFixed(2)
                      : "Loading..."}
                  </span>
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">
                  {mode === "buy" ? "Amount to pay (KES)" : "Amount to sell"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountInputChange}
                    placeholder="0.00"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-2xl font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {mode === "buy" ? "KES" : selectedTokenData?.symbol}
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 font-mono select-none">
                    +254
                  </span>
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
                    <span className="text-gray-400">
                      You {mode === "buy" ? "receive" : "get"}
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedTokenData && (
                        <img
                          src={selectedTokenData.icon}
                          alt={selectedTokenData.symbol}
                          className="w-6 h-6"
                        />
                      )}
                      <span className="text-2xl font-medium text-emerald-400">
                        {cryptoAmount}{" "}
                        {mode === "buy" ? selectedTokenData?.symbol : "KES"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleContinue}
                disabled={!amount || !phoneInput || !selectedToken}
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
                    <span className="text-white">
                      KES {getMpesaFee(parseFloat(amount || "0"))}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Service Fee</span>
                    <span className="text-white">
                      {SERVICE_FEE * 100}%
                    </span>
                  </div>
                  <div className="pt-3 border-t border-zinc-800 flex justify-between">
                    <span className="text-gray-400">Total Fees</span>
                    <span className="text-white font-medium">
                      KES
                      {(
                        getMpesaFee(parseFloat(amount || "0")) +
                        parseFloat(amount || "0") * SERVICE_FEE
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-400 mb-1">
                      Instant Delivery
                    </h4>
                    <p className="text-sm text-blue-300/80">
                      Tokens are delivered to your wallet within 30 seconds of
                      M-Pesa confirmation.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-emerald-400 mb-1">
                      Secure & Licensed
                    </h4>
                    <p className="text-sm text-emerald-300/80">
                      Fully compliant with Kenyan regulations. Your funds are
                      secure.
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


