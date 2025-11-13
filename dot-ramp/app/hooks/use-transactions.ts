
'use client'

import { useState, useEffect } from 'react';
import { useConnect } from './use-connect';

// TODO: Get an API key from https://subscan.io/
const SUBSCAN_API_KEY = '...';

interface Transaction {
  hash: string;
  block_timestamp: number;
  success: boolean;
  from: string;
  to: string;
  amount: string;
}

export function useTransactions() {
  const { selectedAccount } = useConnect();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAccount || !SUBSCAN_API_KEY) {
      return;
    }

    async function fetchTransactions() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://polkadot.api.subscan.io/api/v2/scan/transfers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': SUBSCAN_API_KEY,
          },
          body: JSON.stringify({
            row: 20,
            page: 0,
            address: selectedAccount.address,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const data = await response.json();
        if (data.code !== 0) {
          throw new Error(data.message);
        }

        setTransactions(data.data.transfers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [selectedAccount]);

  return { transactions, isLoading, error };
}
