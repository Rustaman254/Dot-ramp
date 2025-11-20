"use client";

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { Copy } from "lucide-react";

const truncateAddress = (addr: string): string =>
  addr.slice(0, 7) + "..." + addr.slice(-7);

const Header: React.FC<{
  walletConnected?: boolean;
  username?: string;
  walletAddress?: string;
  formatAddress?: (addr: string) => string;
  onShowWalletPopup?: () => void;
  onConnectWallet?: () => void;
  onShowTransactions?: () => void;
  onLogout: () => void;
  integrationLink?: string;
}> = ({
  walletConnected = false,
  username,
  walletAddress,
  formatAddress,
  onShowWalletPopup,
  onConnectWallet,
  onShowTransactions,
  onLogout,
  integrationLink = "/developer",
}) => {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copied, setCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Outside click logic
  useEffect(() => {
    if (!showProfilePopup) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        setShowProfilePopup(false);
        setShowFullAddress(false);
        setCopied(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfilePopup]);

  // Copy logic
  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1700);
    }
  };

  return (
    <div className="border-b border-zinc-800 relative">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
        <div>
          <Link href="/">
            <img
              src="/dot-ramp-2.png"
              alt="DotRamp Logo"
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <div className="flex-1">
          {walletConnected && (
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={onShowTransactions}
                className="font-medium px-4 py-3 cursor-pointer rounded-xl transition-colors text-gray-400 hover:text-emerald-400 focus:outline-none"
                style={{ background: "none", border: "none" }}
              >
                Transactions
              </button>
              <Link
                href={integrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium px-4 py-3 rounded-xl transition-colors text-gray-400 hover:text-emerald-400 focus:outline-none"
              >
                Integrate API
              </Link>
            </div>
          )}
        </div>
        <div className="relative">
          {walletConnected && username && walletAddress ? (
            <>
              <button
                onClick={() => setShowProfilePopup((v) => !v)}
                className="flex items-center cursor-pointer gap-3 bg-zinc-900 border border-zinc-800 hover:border-emerald-500 rounded-xl px-4 py-3 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-sm font-bold text-black">
                  {username.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{username}</div>
                  <div className="text-xs text-gray-400 font-mono">
                    {formatAddress
                      ? formatAddress(walletAddress)
                      : truncateAddress(walletAddress)}
                  </div>
                </div>
              </button>
              {showProfilePopup && (
                <div
                  ref={popupRef}
                  className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg z-50 p-4"
                  style={{ minWidth: 240 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-lg font-bold text-black">
                      {username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="grow">
                      <div className="text-base font-semibold">{username}</div>
                      <div
                        className={`text-xs text-gray-400 font-mono break-all cursor-pointer select-text transition-all`}
                        onClick={() => setShowFullAddress((v) => !v)}
                        title={showFullAddress ? "Hide full address" : "Show full address"}
                        style={{
                          maxWidth: "210px",
                          whiteSpace: showFullAddress ? "normal" : "nowrap",
                          overflow: showFullAddress ? "visible" : "hidden",
                          textOverflow: showFullAddress ? "clip" : "ellipsis",
                        }}
                      >
                        {showFullAddress
                          ? walletAddress
                          : truncateAddress(walletAddress)}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 text-sm text-gray-400">
                    Wallet connected
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 border border-zinc-700 rounded-lg px-3 py-2 mb-4 hover:bg-zinc-800 transition-colors w-full justify-center text-gray-300"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied" : "Copy Address"}
                  </button>
                  <button
                    onClick={() => {
                      setShowProfilePopup(false);
                      setShowFullAddress(false);
                      onLogout();
                    }}
                    className="block w-full py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onConnectWallet}
              className="flex items-center cursor-pointer gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
