import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import dotenv from 'dotenv';

dotenv.config();

async function checkBalance() {
  const wsProvider = new WsProvider('wss://paseo-asset-hub-rpc.polkadot.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReady;

  const keyring = new Keyring({ type: 'sr25519' });
  const admin = keyring.addFromUri(process.env.ADMIN_MNEMONIC as string);

  const { data: balance } = await api.query.system.account(admin.address);
  
  console.log('Admin Address:', admin.address);
  console.log('Free Balance:', balance.free.toHuman());
  console.log('Reserved:', balance.reserved.toHuman());
  
  const free = BigInt(balance.free.toString());
  const pasBalance = Number(free) / 1e10; // PAS has 10 decimals
  
  console.log(`\nBalance: ${pasBalance} PAS`);
  
  if (pasBalance < 0.1) {
    console.log('⚠️  Warning: You need at least 0.1 PAS for deployment');
    console.log('Get tokens from: https://faucet.polkadot.io/');
  } else {
    console.log('✅ Sufficient balance for deployment');
  }

  await api.disconnect();
}

checkBalance();