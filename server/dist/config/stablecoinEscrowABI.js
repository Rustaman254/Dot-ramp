// ABI for StablecoinEscrow as provided in the user's Solidity contract
// Functions: deposit(bytes32,address,uint256,address), release(bytes32), dispute(bytes32), resolveDispute(bytes32,bool), transferAdmin(address)
const stablecoinEscrowABI = [
    {
        "inputs": [
            { "internalType": "bytes32", "name": "orderId", "type": "bytes32" },
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "address", "name": "beneficiary", "type": "address" }
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "orderId", "type": "bytes32" }
        ],
        "name": "release",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "orderId", "type": "bytes32" }
        ],
        "name": "dispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "orderId", "type": "bytes32" },
            { "internalType": "bool", "name": "releaseToBeneficiary", "type": "bool" }
        ],
        "name": "resolveDispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "newAdmin", "type": "address" }
        ],
        "name": "transferAdmin",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
export default stablecoinEscrowABI;
//# sourceMappingURL=stablecoinEscrowABI.js.map