"use client";

import Link from "next/link";
import React from "react";

const Header: React.FC<{
  walletConnected?: boolean;
  username?: string;
  walletAddress?: string;
  formatAddress?: (addr: string) => string;
  onShowWalletPopup?: () => void;
  onConnectWallet?: () => void;
  onShowTransactions?: () => void;
  integrationLink?: string;
}> = ({
  walletConnected = false,
  username,
  walletAddress,
  formatAddress,
  onShowWalletPopup,
  onConnectWallet,
  onShowTransactions,
  integrationLink = "/developer",
}) => (
    <div className="border-b border-zinc-800">
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
              <a
                href={integrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium px-4 py-3 rounded-xl transition-colors text-gray-400 hover:text-emerald-400 focus:outline-none"
              >
                Integrate API
              </a>
            </div>
          )}
        </div>
        <div>
          {walletConnected && username && walletAddress && formatAddress && onShowWalletPopup ? (
            <button
              onClick={onShowWalletPopup}
              className="flex items-center cursor-pointer gap-3 bg-zinc-900 border border-zinc-800 hover:border-emerald-500 rounded-xl px-4 py-3 transition-colors"
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

export default Header;
