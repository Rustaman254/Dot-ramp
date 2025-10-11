import { PrivyClient } from '@privy-io/node';
import { createViemAccount } from '@privy-io/node/viem';
import { createPublicClient, http } from 'viem';
import { createSmartAccountClient } from 'permissionless';
import { toKernelSmartAccount } from 'permissionless/accounts';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { baseSepolia } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';
import 'dotenv/config';

/**
 * Create a sponsored Smart Account Client for a user (using AA and paymaster)
 * Returns the smart account client for gasless transactions.
 */
export async function getSponsoredSmartWalletClient({
  privy,
  privyWalletId,
  evmAddress,
  authorizationContext
}: {
  privy: PrivyClient,
  privyWalletId: string,
  evmAddress: string,
  authorizationContext?: { authorization_private_keys: string[] }
}) {
  if (!process.env.RPC_URL || !process.env.PIMLICO_PAYMASTER_RPC || !process.env.BUNDLER_URL) {
    throw new Error("Missing one of the following env vars: RPC_URL, PIMLICO_PAYMASTER_RPC, BUNDLER_URL");
  }

  // Create viem account for the user's wallet (controller/EOA)
  const viemAccount = await createViemAccount(privy, {
    walletId: privyWalletId,
    address: evmAddress as `0x${string}`,
    ...(authorizationContext ? { authorizationContext } : {})
  });

  // Create viem public client
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.RPC_URL!)
  });

  // Create Kernel smart account
  const kernelSmartAccount = await toKernelSmartAccount({
    client: publicClient,
    entryPoint: { address: entryPoint07Address, version: '0.7' },
    owners: [viemAccount]
  });

  // Create Paymaster client
  const paymasterClient = createPimlicoClient({
    chain: baseSepolia,
    transport: http(process.env.PIMLICO_PAYMASTER_RPC!),
    entryPoint: { address: entryPoint07Address, version: '0.7' }
  });

  // Create gasless smart account client
  const smartAccountClient = await createSmartAccountClient({
    account: kernelSmartAccount,
    chain: baseSepolia,
    paymaster: paymasterClient,
    bundlerTransport: http(process.env.BUNDLER_URL!),
    userOperation: {
      estimateFeesPerGas: async () => (await paymasterClient.getUserOperationGasPrice()).fast
    }
  });

  return smartAccountClient;
}
