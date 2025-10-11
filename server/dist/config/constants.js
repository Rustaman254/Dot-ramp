import { ethers } from 'ethers';
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
(async () => {
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    console.log(`Connected signer: ${address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
})();
export { provider, signer };
//# sourceMappingURL=constants.js.map