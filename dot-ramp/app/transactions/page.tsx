"use client";

import React, { useEffect, useState } from "react";
import Header from "@/app/components/header";
import { Wallet, Clock, X, ExternalLink, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type TransactionStatus = "completed" | "timeout";
type TransactionDirection = "buy" | "sell";

interface Transaction {
  id: string;
  token: string;
  amountToken: number;
  tokenIcon: string;
  status: TransactionStatus;
  direction: TransactionDirection;
  hash: string;
  date: string;
  detailStatus: string;
}

interface RawTransaction {
  merchantRequestId: string;
  token: string;
  cryptoAmount: string | number;
  status: TransactionStatus;
  details: {
    blockHash?: string;
    Remarks?: string;
    TransactionDesc?: string;
    ResultDesc?: string;
    ResponseDescription?: string;
  };
  timestamp: string;
}

const LOCAL_STORAGE_KEY = "dotramp_wallet_connected";
const INTEGRATION_LINK = "/dev-docs";

const tokenLookup: Record<string, { icon: string; color: string }> = {
  PAS: { icon: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png", color: "#E6007A" },
  USDT: { icon: "https://cryptologos.cc/logos/tether-usdt-logo.png", color: "#26A17B" },
  USDC: { icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png", color: "#2775CA" }
};

const explorerUrl = (hash: string) =>
  `https://assethub-paseo.subscan.io/block/${hash}`;

const PROD_URL = process.env.NEXT_PUBLIC_PROD_URL || "http://localhost:8000";

const Transactions: React.FC = () => {
  const router = useRouter();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [username, setUsername] = useState("");
  // showWalletPopup is not used, so we remove it.
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (typeof window !== "undefined") {
    const walletJson = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (walletJson) {
      try {
        const parsed = JSON.parse(walletJson);
        setWalletConnected(true);
        setWalletAddress(parsed.address);
        setUsername(parsed.username);
      } catch {
        setWalletConnected(false);
        setWalletAddress("");
        setUsername("");
      }
    } else {
      setWalletConnected(false);
      setWalletAddress("");
      setUsername("");
    }
  }
}, []);


  const handleOpenWalletSelector = () => { };

  const formatAddress = (addr: string): string =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  useEffect(() => {
    if (!walletConnected || !walletAddress) {
      setLoading(false);
      setTransactions([]);
      setError(null);
      return;
    }
    async function fetchTx() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${PROD_URL}/api/v1/transactions/history?address=${walletAddress}`);
        if (!res.ok) {
          throw new Error("Failed to load transactions");
        }
        const data = await res.json();
        if (!data || !Array.isArray(data.transactions)) {
          setTransactions([]);
          setError("No transactions found");
          return;
        }
        setTransactions(
          data.transactions
            .map((tx: RawTransaction) => ({
              id: tx.merchantRequestId,
              token: tx.token,
              amountToken: Number(tx.cryptoAmount),
              tokenIcon: tokenLookup[tx.token]?.icon || "",
              status: tx.status as TransactionStatus,
              direction: (tx.details && (tx.details.Remarks?.toLowerCase().includes("sell") || tx.details.TransactionDesc?.toLowerCase().includes("sell")))
                ? "sell"
                : "buy",
              hash: tx.details.blockHash || "",
              date: tx.timestamp,
              detailStatus: tx.details.ResultDesc || tx.details.ResponseDescription || "",
            }))
            .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
      } catch {
        setError("Could not load transactions");
      } finally {
        setLoading(false);
      }
    }
    fetchTx();
  }, [walletConnected, walletAddress]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        walletConnected={walletConnected}
        username={username}
        walletAddress={walletAddress}
        formatAddress={formatAddress}
        onShowWalletPopup={() => { }}
        onConnectWallet={handleOpenWalletSelector}
        onShowTransactions={() => router.push("/transactions")}
        integrationLink={INTEGRATION_LINK}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl p-6">
          <h2 className="text-xl font-medium mb-6">Your Transactions</h2>
          {!walletConnected ? (
            <div className="flex items-center gap-3 text-gray-500 py-12 flex-col">
              <Wallet className="w-8 h-8 mx-auto mb-4" />
              <span className="text-center">
                Connect your wallet to view transactions.<br />
              </span>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => router.push("/")}
                  className="bg-emerald-500 cursor-pointer hover:bg-emerald-600 text-black font-medium px-6 py-2 rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  Make Another Transaction
                </button>
              </div>
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
                      <div className="flex items-center gap-3 flex-1">
                        <span className="relative w-10 h-10 block overflow-hidden">
                          <img
                            src={tx.tokenIcon}
                            alt={tx.token}
                            width={40}
                            height={40}
                            className="object-contain w-10 h-10"
                          />
                        </span>
                        <div>
                          <div className="font-bold text-white">
                            {tx.direction === "buy" ? "Bought" : "Sold"} {tx.token}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(tx.date).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">{tx.detailStatus}</div>
                        </div>
                      </div>
                      <div className="md:w-1/3 flex flex-row md:flex-col justify-between md:items-end gap-4 font-mono text-sm mt-2 md:mt-0">
                        <div>
                          <span className="text-gray-400">{tx.token}</span>{" "}
                          <span className="text-white">{tx.amountToken}</span>
                        </div>
                      </div>
                      <div className="hidden md:flex w-px bg-zinc-800 mx-8" />
                      <div className="md:w-1/3 flex flex-col items-start md:items-end gap-2 mt-3 md:mt-0">
                        {tx.hash ? (
                          <a
                            href={explorerUrl(tx.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono break-all"
                          >
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">No chain transaction</span>
                        )}
                        <span className="text-xs">
                          {tx.status === "completed" && (
                            <span className="text-emerald-500">Completed</span>
                          )}
                          {tx.status === "timeout" && (
                            <span className="text-amber-400">Timeout</span>
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
