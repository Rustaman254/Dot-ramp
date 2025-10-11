import { ethers } from "ethers";
import { PrivyClient } from "@privy-io/node";
import { connectDB } from "../config/db";
const privy = new PrivyClient({
    appId: process.env.PRIVY_API_KEY,
    appSecret: process.env.PRIVY_APP_SECRET
});
export async function buyStablecoin(req, res) {
    try {
        const { businessId, stablecoin, amount, businessWallet } = req.body;
        if (!businessId || !stablecoin || !amount || !businessWallet) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        if (!ethers.isAddress(stablecoin)) {
            res.status(400).json({ error: "Invalid stablecoin address" });
            return;
        }
        const db = await connectDB();
        const orders = db.collection("orders");
        const usersCol = db.collection("users");
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const code = await provider.getCode(stablecoin);
        if (!code || code === "0x") {
            res.status(400).json({ error: "No contract deployed at stablecoin address" });
            return;
        }
        const erc20Readable = [
            "function decimals() view returns (uint8)",
            "function balanceOf(address account) view returns (uint256)",
        ];
        const token = new ethers.Contract(stablecoin, erc20Readable, provider);
        let decimals = 18;
        try {
            decimals = Number(await token.decimals?.());
        }
        catch (err) {
            res.status(400).json({
                error: `Failed to read token decimals: ${err?.message || "unknown error"}`,
            });
            return;
        }
        const tokenAmount = BigInt(amount);
        const candidateAgents = await usersCol
            .find({ status: "active" })
            .limit(50)
            .toArray();
        let selectedPeer = null;
        for (const agent of candidateAgents) {
            try {
                const bal = await token.balanceOf?.(agent.address);
                if (BigInt(bal) >= tokenAmount) {
                    selectedPeer = agent;
                    break;
                }
            }
            catch { }
        }
        if (!selectedPeer || !selectedPeer.privyWalletId) {
            res.status(409).json({ error: "No available liquidity provider with sufficient balance" });
            return;
        }
        // ERC20 transfer call encoding
        const erc20Abi = ["function transfer(address to, uint256 amount) returns (bool)"];
        const iface = new ethers.Interface(erc20Abi);
        const data = iface.encodeFunctionData("transfer", [
            businessWallet,
            tokenAmount.toString(),
        ]);
        let txHash;
        try {
            const caip2 = "eip155:534351";
            const chainId = 534351;
            const privyTx = await privy.wallets().ethereum().sendTransaction(selectedPeer.privyWalletId, {
                caip2,
                params: {
                    transaction: {
                        to: stablecoin,
                        value: "0x0",
                        data: data,
                        chain_id: chainId,
                    },
                },
            });
            txHash = privyTx.hash;
        }
        catch (e) {
            res.status(500).json({ error: `Token transfer failed: ${e?.message || "unknown error"}` });
            return;
        }
        // Write order
        const now = new Date();
        const randomNum = Math.floor(Math.random() * 1000000);
        const orderId = `odr-${Date.now()}${ethers.hexlify(ethers.randomBytes(4)).slice(2)}`;
        const doc = {
            type: "deposit",
            status: "matched",
            amount: tokenAmount.toString(),
            token: stablecoin,
            businessId,
            peerId: selectedPeer?._id?.toString?.(),
            confirmations: { business: false, peer: true, time: undefined },
            createdAt: now,
            updatedAt: now,
            details: "Buy stablecoin order (on-chain transfer)",
            orderId,
            tokenAmount: tokenAmount.toString(),
            peerWallet: selectedPeer.address,
            businessWallet,
            txHash,
        };
        const insert = await orders.insertOne(doc);
        res.status(201).json({
            orderId,
            orderDbId: insert.insertedId?.toString?.(),
            peer: { id: selectedPeer?._id?.toString?.(), wallet: selectedPeer.address },
            token: stablecoin,
            tokenDecimals: decimals,
            tokenAmount: tokenAmount.toString(),
            txHash,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function sellStablecoin(req, res) {
    try {
        const { businessId, stablecoin, amount, businessWallet } = req.body;
        if (!businessId || !stablecoin || !amount || !businessWallet) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        if (!ethers.isAddress(stablecoin)) {
            res.status(400).json({ error: "Invalid stablecoin address" });
            return;
        }
        const db = await connectDB();
        const orders = db.collection("orders");
        const usersCol = db.collection("users");
        // Configure provider (as in buyStablecoin)
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const code = await provider.getCode(stablecoin);
        if (!code || code === "0x") {
            res.status(400).json({ error: "No contract deployed at stablecoin address" });
            return;
        }
        const erc20Readable = [
            "function decimals() view returns (uint8)",
            "function balanceOf(address account) view returns (uint256)"
        ];
        const token = new ethers.Contract(stablecoin, erc20Readable, provider);
        let decimals;
        try {
            decimals = Number(await token.decimals?.());
        }
        catch (err) {
            res.status(400).json({
                error: `Failed to read token decimals: ${err?.message || "unknown error"}`,
            });
            return;
        }
        // Convert user amount (human decimals) to contract units
        const tokenAmount = ethers.parseUnits(String(amount), decimals);
        // Select an agent (buyer) who has privyWalletId (as in buyStablecoin)
        const selectedPeer = await usersCol.findOne({
            isAgent: true,
            status: "active",
            privyWalletId: { $exists: true, $ne: null }
        });
        if (!selectedPeer) {
            res.status(409).json({ error: "No available buyer (agent) found" });
            return;
        }
        const now = new Date();
        const randomNum = Math.floor(Math.random() * 1000000);
        const orderId = `odr-${Date.now()}${ethers.hexlify(ethers.randomBytes(4)).slice(2)}`;
        const doc = {
            type: "withdrawal",
            status: "matched",
            amount: Number(amount), // This is the fiat expected for the sale (not contract units)
            token: stablecoin,
            businessId,
            peerId: selectedPeer?._id?.toString?.(),
            confirmations: { business: false, peer: true, time: undefined },
            createdAt: now,
            updatedAt: now,
            details: "Sell stablecoin order (off-chain settlement, peer payout)",
            orderId,
            tokenAmount: tokenAmount.toString(), // in contract units
            peerWallet: selectedPeer.address,
            peerPrivyWalletId: selectedPeer.privyWalletId,
            businessWallet
        };
        const insert = await orders.insertOne(doc);
        // Build ERC20 transfer calldata for the seller to transfer tokens to the agent/peer
        const erc20Iface = new ethers.Interface([
            "function transfer(address to, uint256 amount) returns (bool)"
        ]);
        const transferCalldata = erc20Iface.encodeFunctionData('transfer', [
            selectedPeer.address,
            tokenAmount.toString(),
        ]);
        res.status(201).json({
            orderId,
            orderDbId: insert.insertedId?.toString?.(),
            peer: { id: selectedPeer?._id?.toString?.(), wallet: selectedPeer.address, privyWalletId: selectedPeer.privyWalletId },
            token: stablecoin,
            tokenDecimals: decimals,
            tokenAmount: tokenAmount.toString(),
            instructions: {
                from: businessWallet,
                to: stablecoin,
                function: "transfer",
                calldata: transferCalldata,
                value: "0x0"
            }
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// to the peers to mark as fulfilled
export async function depositConfirm(req, res) {
    const { orderId } = req.params;
    try {
        const { txHash } = req.body;
        if (!txHash) {
            res.status(400).json({ error: 'txHash required' });
            return;
        }
        const db = await connectDB();
        const orders = db.collection('orders');
        const updated = await orders.findOneAndUpdate({ orderId }, { $set: { status: 'fulfilled', updatedAt: new Date() } }, { returnDocument: 'after' });
        if (!updated) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.status(200).json({
            message: 'Deposit confirmed. Order fulfilled.',
            order: updated
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// To the businesses
export async function fiatConfirm(req, res) {
    const { orderId } = req.params;
    try {
        if (!orderId) {
            res.status(400).json({ error: 'Missing orderId' });
            return;
        }
        const db = await connectDB();
        const orders = db.collection('orders');
        // Mark order as "fulfilled" to confirm fiat payout
        const updated = await orders.findOneAndUpdate({ orderId }, { $set: { status: 'fulfilled', updatedAt: new Date() } }, { returnDocument: 'after' });
        if (!updated) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.status(200).json({
            message: 'Fiat confirmed; order fulfilled',
            order: updated.value
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function dispute(req, res) {
    const { orderId } = req.params;
    try {
        if (!orderId) {
            res.status(400).json({ error: 'Missing orderId' });
            return;
        }
        const db = await connectDB();
        const orders = db.collection('orders');
        const updated = await orders.findOneAndUpdate({ orderId }, { $set: { status: 'disputed', updatedAt: new Date() } }, { returnDocument: 'after' });
        if (!updated) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.status(200).json({ message: 'Order marked disputed', order: updated.value });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function resolve(req, res) {
    const { orderId } = req.params;
    try {
        if (!orderId) {
            res.status(400).json({ error: 'Missing orderId' });
            return;
        }
        const db = await connectDB();
        const orders = db.collection('orders');
        const updated = await orders.findOneAndUpdate({ orderId }, { $set: { status: 'fulfilled', updatedAt: new Date() } }, { returnDocument: 'after' });
        if (!updated) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.status(200).json({ message: 'Dispute resolved; order fulfilled', order: updated.value });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
//# sourceMappingURL=p2pEscrowController.js.map