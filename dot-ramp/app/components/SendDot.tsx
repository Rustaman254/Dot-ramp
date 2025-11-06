"use client"

import { useWallet } from 'polkadot-ui'
import { createApi } from 'polkadot-api'
import { useState } from 'react'

export default function SendDot() {
  const { account } = useWallet()
  const [to, setTo] = useState('')
  const [amt, setAmt] = useState('')
  const [txStatus, setTxStatus] = useState('')

  const send = async () => {
    setTxStatus('Starting...')
    try {
      const api = await createApi()
      const decimals = api.registry.chainDecimals[0] || 10
      const plancks = BigInt(Number(amt) * Math.pow(10, decimals))
      const tx = api.tx.balances.transferKeepAlive(to, plancks)
      const unsub = await tx.signAndSend(account.signer, ({ status }) => {
        if (status.isInBlock) setTxStatus('In block')
        if (status.isFinalized) {
          setTxStatus('Finalized')
          unsub()
        }
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTxStatus(err.message)
      } else {
        setTxStatus('Unknown error')
      }
    }
}

return (
  <div>
    <input value={to} onChange={e => setTo(e.target.value)} placeholder="Recipient Address" />
    <input value={amt} onChange={e => setAmt(e.target.value)} placeholder="Amount (DOT)" />
    <button onClick={send}>Send DOT</button>
    <div>{txStatus}</div>
  </div>
)
}
