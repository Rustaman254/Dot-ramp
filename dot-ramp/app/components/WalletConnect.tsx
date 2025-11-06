"use client"
import { useWallet, WalletModal } from 'polkadot-ui'
import type { AccountInfo } from '@polkadot/types/interfaces';
import { useEffect, useState } from 'react'
import { createApi } from 'polkadot-api'

export default function WalletConnect() {
  const { wallet, account, open, disconnect } = useWallet()
  const [dotBalance, setDotBalance] = useState('')

  useEffect(() => {
    if (!account?.address) return
    let unsub: (() => void) | null = null

    async function fetchBalance() {
      const api = await createApi()
      unsub = await api.query.system.account(account.address, (accountInfo: AccountInfo) => {
        const free = accountInfo.data.free
        setDotBalance(api.registry.chainDecimals
          ? (Number(free) / Math.pow(10, api.registry.chainDecimals[0])).toLocaleString()
          : free.toString()
        )
      })
    }
    fetchBalance()
    return () => { if (unsub) unsub() }
  }, [account])

  return (
    <div>
      {!wallet.connected ? (
        <button onClick={open}>Connect Wallet</button>
      ) : (
        <div>
          <div>Account: {account?.address}</div>
          <div>DOT: {dotBalance}</div>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
      <WalletModal />
    </div>
  )
}
