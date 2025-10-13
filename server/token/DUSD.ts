import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import dotenv from 'dotenv';

dotenv.config();

const PASEO_ASSET_HUB_ENDPOINT = 'wss://pas-rpc.stakeworld.io/assethub';
const ADMIN_MNEMONIC = process.env.ADMIN_MNEMONIC as string; // Account that will create the asset

interface AssetMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

/**
 * Creates a new asset (DUSD) on Paseo Asset Hub
 */
async function createDUSDAsset() {
  console.log('Connecting to Paseo Asset Hub...');
  const wsProvider = new WsProvider(PASEO_ASSET_HUB_ENDPOINT);
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReady;
  console.log('Connected to Paseo Asset Hub');

  const keyring = new Keyring({ type: 'sr25519' });
  const admin = keyring.addFromUri(ADMIN_MNEMONIC);
  console.log(`Admin account: ${admin.address}`);

  // Choose an asset ID (must be >= 1000 for user-created assets)
  // Check if this ID is available first
  const assetId = 2024; // You can choose any available ID >= 1000

  try {
    // Step 1: Create the asset
    console.log(`\n--- Step 1: Creating asset with ID ${assetId} ---`);
    const minBalance = 1; // Minimum balance in base units (0.000001 DUSD)

    const createTx = api.tx.assets.create(
      assetId,
      admin.address, // Admin (owner) address
      minBalance     // Minimum balance
    );

    const createHash = await createTx.signAndSend(admin, ({ status, events }) => {
      if (status.isInBlock) {
        console.log(`Asset creation included in block: ${status.asInBlock.toHex()}`);
        
        events.forEach(({ event }) => {
          if (api.events.assets.Created.is(event)) {
            console.log('✅ Asset Created event detected');
            const [assetId, creator, owner] = event.data;
            console.log(`   Asset ID: ${assetId}`);
            console.log(`   Creator: ${creator}`);
            console.log(`   Owner: ${owner}`);
          }
        });
      }
    });

    // Wait a bit for the transaction to finalize
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Set metadata
    console.log(`\n--- Step 2: Setting asset metadata ---`);
    const metadata: AssetMetadata = {
      name: 'Dot-USD',
      symbol: 'DUSD',
      decimals: 6 // Same as USDT
    };

    const metadataTx = api.tx.assets.setMetadata(
      assetId,
      metadata.name,
      metadata.symbol,
      metadata.decimals
    );

    await metadataTx.signAndSend(admin, ({ status, events }) => {
      if (status.isInBlock) {
        console.log(`Metadata set in block: ${status.asInBlock.toHex()}`);
        
        events.forEach(({ event }) => {
          if (api.events.assets.MetadataSet.is(event)) {
            console.log('✅ Metadata Set event detected');
            const [assetId, name, symbol, decimals] = event.data;
            console.log(`   Asset ID: ${assetId}`);
            console.log(`   Name: ${name.toHuman()}`);
            console.log(`   Symbol: ${symbol.toHuman()}`);
            console.log(`   Decimals: ${decimals}`);
          }
        });
      }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Mint some initial supply
    console.log(`\n--- Step 3: Minting initial supply ---`);
    const initialSupply = BigInt(1_000_000 * 1e6); // 1 million DUSD
    
    const mintTx = api.tx.assets.mint(
      assetId,
      admin.address,
      initialSupply.toString()
    );

    await mintTx.signAndSend(admin, ({ status, events }) => {
      if (status.isInBlock) {
        console.log(`Mint transaction in block: ${status.asInBlock.toHex()}`);
        
        events.forEach(({ event }) => {
          if (api.events.assets.Issued.is(event)) {
            console.log('✅ Assets Issued event detected');
            const [assetId, owner, amount] = event.data;
            console.log(`   Asset ID: ${assetId}`);
            console.log(`   Owner: ${owner}`);
            console.log(`   Amount: ${amount.toString()} (${Number(amount) / 1e6} DUSD)`);
          }
        });
      }
    });

    console.log('\n🎉 DUSD Asset successfully created on Paseo Asset Hub!');
    console.log(`\n📋 Asset Details:`);
    console.log(`   Asset ID: ${assetId}`);
    console.log(`   Name: ${metadata.name}`);
    console.log(`   Symbol: ${metadata.symbol}`);
    console.log(`   Decimals: ${metadata.decimals}`);
    console.log(`   Initial Supply: ${Number(initialSupply) / 1e6} DUSD`);
    console.log(`   Admin: ${admin.address}`);
    
    // Query the asset details to confirm
    await new Promise(resolve => setTimeout(resolve, 3000));
    const assetDetails = await api.query.assets.asset(assetId);
    console.log(`\n🔍 On-chain verification:`);
    console.log(assetDetails.toHuman());

  } catch (error: any) {
    console.error('Error creating DUSD asset:', error.message);
    throw error;
  } finally {
    await api.disconnect();
  }
}

/**
 * Check if an asset ID is available
 */
async function checkAssetIdAvailability(assetId: number) {
  const wsProvider = new WsProvider(PASEO_ASSET_HUB_ENDPOINT);
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReady;

  const asset = await api.query.assets.asset(assetId);
  await api.disconnect();

  return asset.isNone;
}

// Main execution
(async () => {
  try {
    const assetId = 2024;
    console.log(`Checking if asset ID ${assetId} is available...`);
    
    const isAvailable = await checkAssetIdAvailability(assetId);
    
    if (!isAvailable) {
      console.log(`❌ Asset ID ${assetId} is already taken. Please choose a different ID.`);
      process.exit(1);
    }
    
    console.log(`✅ Asset ID ${assetId} is available!\n`);
    await createDUSDAsset();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();