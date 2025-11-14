"use client";

import React, { useEffect, useState } from "react";
import Header from "@/app/components/header";
import { Wallet, Clock, X, ExternalLink, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

// Dummy transaction interface
type Transaction = {
  id: string;
  token: string;
  amountFiat: number;
  amountToken: number;
  tokenIcon: string;
  status: "pending" | "success" | "failed";
  direction: "buy" | "sell";
  hash: string;
  date: string;
};

const tokenLookup: Record<string, { icon: string; color: string }> = {
  DOT: { icon: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png", color: "#E6007A" },
  USDT: { icon: "https://cryptologos.cc/logos/tether-usdt-logo.png", color: "#26A17B" },
  USDC: { icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png", color: "#2775CA" },
  DAI: { icon: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png", color: "#F5AC37" },
};

const LOCAL_STORAGE_KEY = "dotramp_wallet_connected";
// Replace with your real integration link if needed
const INTEGRATION_LINK = "/dev-docs";

const explorerUrl = (hash: string) =>
  `https://polkadot.subscan.io/extrinsic/${hash}`;

const Transactions: React.FC = () => {
  const router = useRouter();

  // Wallet state (copied from Home page logic)
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  // Dummy popup logic (implement as needed)
  const [showWalletPopup, setShowWalletPopup] = useState<boolean>(false);

  // On mount, sync wallet state from local storage
  useEffect(() => {
    const walletJson = typeof window !== "undefined" && localStorage.getItem(LOCAL_STORAGE_KEY);
    if (walletJson) {
      const parsed = JSON.parse(walletJson);
      setWalletConnected(true);
      setWalletAddress(parsed.address);
      setUsername(parsed.username);
    } else {
      setWalletConnected(false);
      setWalletAddress("");
      setUsername("");
    }
  }, []);

  const handleOpenWalletSelector = () => {
    // Trigger wallet connect popup, logic same as on Home
    // You can show your wallet selector modal here
  };

  const formatAddress = (addr: string): string =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Transaction data and states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletConnected) {
      setLoading(false);
      setTransactions([]);
      setError(null);
      return;
    }
    async function fetchTx() {
      try {
        setLoading(true);
        setError(null);
        await new Promise((res) => setTimeout(res, 900));
        setTransactions([
          {
            id: "1",
            token: "DOT",
            amountFiat: 5000,
            amountToken: 7.124,
            tokenIcon: tokenLookup["DOT"].icon,
            status: "success",
            direction: "buy",
            hash: "0x3bfa38fa3d96edda02cee738962c6a2994099976b5a7eb3e60c6b8326ba5f09f",
            date: "2025-11-12T12:15:22Z"
          },
          {
            id: "2",
            token: "USDC",
            amountFiat: 10000,
            amountToken: 62.11,
            tokenIcon: tokenLookup["USDC"].icon,
            status: "pending",
            direction: "sell",
            hash: "0xfc9b2f8f7a686cc712e751007d01f2df96416b159f7a51495537a12335ad291c",
            date: "2025-11-10T14:08:59Z"
          }
        ]);
      } catch (e) {
        setError("Could not load transactions");
      } finally {
        setLoading(false);
      }
    }
    fetchTx();
  }, [walletConnected]);

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
        integrationLink={INTEGRATION_LINK}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl p-6">
          <h2 className="text-xl font-medium mb-6">Your Transactions</h2>

          {/* Wallet not connected state */}
          {!walletConnected ? (
            <div className="flex items-center gap-3 text-gray-500 py-12 flex-col">
              <Wallet className="w-8 h-8 mx-auto mb-4" />
              <span className="text-center">
                Connect your wallet to view transactions.<br />
              </span>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="flex items-center gap-3 text-blue-400">
                  <Clock className="w-5 h-5 animate-spin" /> Loading...
                </div>
              ) : error ? (
                <div className="text-red-500 flex items-center gap-2">
                  <X className="w-5 h-5" />
                  {error}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Wallet className="w-8 h-8 mx-auto mb-4" />
                  No transactions yet.<br />
                  Start trading to see your history here.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="py-6 flex flex-col md:flex-row md:items-stretch gap-6 md:gap-0 group"
                    >
                      {/* DETAILS LEFT */}
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={tx.tokenIcon}
                          alt={tx.token}
                          className="w-10 h-10 rounded-full border border-zinc-700"
                        />
                        <div>
                          <div className="font-bold text-white">
                            {tx.direction === "buy" ? "Bought" : "Sold"} {tx.token}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(tx.date).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {/* AMOUNTS */}
                      <div className="md:w-1/3 flex flex-row md:flex-col justify-between md:items-end gap-4 font-mono text-sm mt-2 md:mt-0">
                        <div>
                          <span className="text-gray-400">KES</span>{" "}
                          <span className="text-white">{tx.amountFiat.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">{tx.token}</span>{" "}
                          <span className="text-white">{tx.amountToken}</span>
                        </div>
                      </div>
                      {/* VERTICAL DIVIDER ONLY ON DESKTOP */}
                      <div className="hidden md:flex w-px bg-zinc-800 mx-8" />
                      {/* HASH & STATUS */}
                      <div className="md:w-1/3 flex flex-col items-start md:items-end gap-2 mt-3 md:mt-0">
                        <a
                          href={explorerUrl(tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono break-all"
                        >
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <span className="text-xs">
                          {tx.status === "success" && (
                            <span className="text-emerald-500">Success</span>
                          )}
                          {tx.status === "pending" && (
                            <span className="text-amber-400">Pending</span>
                          )}
                          {tx.status === "failed" && (
                            <span className="text-red-500">Failed</span>
                          )}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-700 md:ml-3 invisible md:visible group-hover:text-emerald-400" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
