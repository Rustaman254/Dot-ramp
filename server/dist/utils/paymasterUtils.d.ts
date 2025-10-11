import { PrivyClient } from '@privy-io/node';
import 'dotenv/config';
/**
 * Create a sponsored Smart Account Client for a user (using AA and paymaster)
 * Returns the smart account client for gasless transactions.
 */
export declare function getSponsoredSmartWalletClient({ privy, privyWalletId, evmAddress, authorizationContext }: {
    privy: PrivyClient;
    privyWalletId: string;
    evmAddress: string;
    authorizationContext?: {
        authorization_private_keys: string[];
    };
}): Promise<import("permissionless").SmartAccountClient<import("viem").HttpTransport<undefined, false>, {
    blockExplorers: {
        readonly default: {
            readonly name: "Basescan";
            readonly url: "https://sepolia.basescan.org";
            readonly apiUrl: "https://api-sepolia.basescan.org/api";
        };
    };
    blockTime: 2000;
    contracts: {
        readonly disputeGameFactory: {
            readonly 11155111: {
                readonly address: "0xd6E6dBf4F7EA0ac412fD8b65ED297e64BB7a06E1";
            };
        };
        readonly l2OutputOracle: {
            readonly 11155111: {
                readonly address: "0x84457ca9D0163FbC4bbfe4Dfbb20ba46e48DF254";
            };
        };
        readonly portal: {
            readonly 11155111: {
                readonly address: "0x49f53e41452c74589e85ca1677426ba426459e85";
                readonly blockCreated: 4446677;
            };
        };
        readonly l1StandardBridge: {
            readonly 11155111: {
                readonly address: "0xfd0Bf71F60660E2f608ed56e1659C450eB113120";
                readonly blockCreated: 4446677;
            };
        };
        readonly multicall3: {
            readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
            readonly blockCreated: 1059647;
        };
        readonly gasPriceOracle: {
            readonly address: "0x420000000000000000000000000000000000000F";
        };
        readonly l1Block: {
            readonly address: "0x4200000000000000000000000000000000000015";
        };
        readonly l2CrossDomainMessenger: {
            readonly address: "0x4200000000000000000000000000000000000007";
        };
        readonly l2Erc721Bridge: {
            readonly address: "0x4200000000000000000000000000000000000014";
        };
        readonly l2StandardBridge: {
            readonly address: "0x4200000000000000000000000000000000000010";
        };
        readonly l2ToL1MessagePasser: {
            readonly address: "0x4200000000000000000000000000000000000016";
        };
    };
    ensTlds?: readonly string[] | undefined;
    id: 84532;
    name: "Base Sepolia";
    nativeCurrency: {
        readonly name: "Sepolia Ether";
        readonly symbol: "ETH";
        readonly decimals: 18;
    };
    experimental_preconfirmationTime?: number | undefined | undefined;
    rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://sepolia.base.org"];
        };
    };
    sourceId: 11155111;
    testnet: true;
    custom?: Record<string, unknown> | undefined;
    fees?: import("viem").ChainFees<undefined> | undefined;
    formatters: {
        readonly block: {
            exclude: [] | undefined;
            format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                baseFeePerGas: bigint | null;
                blobGasUsed: bigint;
                difficulty: bigint;
                excessBlobGas: bigint;
                extraData: import("viem").Hex;
                gasLimit: bigint;
                gasUsed: bigint;
                hash: `0x${string}` | null;
                logsBloom: `0x${string}` | null;
                miner: import("viem").Address;
                mixHash: import("viem").Hash;
                nonce: `0x${string}` | null;
                number: bigint | null;
                parentBeaconBlockRoot?: `0x${string}` | undefined;
                parentHash: import("viem").Hash;
                receiptsRoot: import("viem").Hex;
                sealFields: import("viem").Hex[];
                sha3Uncles: import("viem").Hash;
                size: bigint;
                stateRoot: import("viem").Hash;
                timestamp: bigint;
                totalDifficulty: bigint | null;
                transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                transactionsRoot: import("viem").Hash;
                uncles: import("viem").Hash[];
                withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                withdrawalsRoot?: `0x${string}` | undefined;
            } & {};
            type: "block";
        };
        readonly transaction: {
            exclude: [] | undefined;
            format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                blockHash: `0x${string}` | null;
                blockNumber: bigint | null;
                from: import("viem").Address;
                gas: bigint;
                hash: import("viem").Hash;
                input: import("viem").Hex;
                nonce: number;
                r: import("viem").Hex;
                s: import("viem").Hex;
                to: import("viem").Address | null;
                transactionIndex: number | null;
                typeHex: import("viem").Hex | null;
                v: bigint;
                value: bigint;
                yParity: number;
                gasPrice?: undefined | undefined;
                maxFeePerBlobGas?: undefined | undefined;
                maxFeePerGas: bigint;
                maxPriorityFeePerGas: bigint;
                isSystemTx?: boolean;
                mint?: bigint | undefined | undefined;
                sourceHash: import("viem").Hex;
                type: "deposit";
            } | {
                r: import("viem").Hex;
                s: import("viem").Hex;
                v: bigint;
                value: bigint;
                gas: bigint;
                to: import("viem").Address | null;
                from: import("viem").Address;
                nonce: number;
                blockHash: `0x${string}` | null;
                blockNumber: bigint | null;
                transactionIndex: number | null;
                hash: import("viem").Hash;
                input: import("viem").Hex;
                typeHex: import("viem").Hex | null;
                accessList?: undefined | undefined;
                authorizationList?: undefined | undefined;
                blobVersionedHashes?: undefined | undefined;
                chainId?: number | undefined;
                yParity?: undefined | undefined;
                type: "legacy";
                gasPrice: bigint;
                maxFeePerBlobGas?: undefined | undefined;
                maxFeePerGas?: undefined | undefined;
                maxPriorityFeePerGas?: undefined | undefined;
                isSystemTx?: undefined | undefined;
                mint?: undefined | undefined;
                sourceHash?: undefined | undefined;
            } | {
                blockHash: `0x${string}` | null;
                blockNumber: bigint | null;
                from: import("viem").Address;
                gas: bigint;
                hash: import("viem").Hash;
                input: import("viem").Hex;
                nonce: number;
                r: import("viem").Hex;
                s: import("viem").Hex;
                to: import("viem").Address | null;
                transactionIndex: number | null;
                typeHex: import("viem").Hex | null;
                v: bigint;
                value: bigint;
                yParity: number;
                accessList: import("viem").AccessList;
                authorizationList?: undefined | undefined;
                blobVersionedHashes?: undefined | undefined;
                chainId: number;
                type: "eip2930";
                gasPrice: bigint;
                maxFeePerBlobGas?: undefined | undefined;
                maxFeePerGas?: undefined | undefined;
                maxPriorityFeePerGas?: undefined | undefined;
                isSystemTx?: undefined | undefined;
                mint?: undefined | undefined;
                sourceHash?: undefined | undefined;
            } | {
                blockHash: `0x${string}` | null;
                blockNumber: bigint | null;
                from: import("viem").Address;
                gas: bigint;
                hash: import("viem").Hash;
                input: import("viem").Hex;
                nonce: number;
                r: import("viem").Hex;
                s: import("viem").Hex;
                to: import("viem").Address | null;
                transactionIndex: number | null;
                typeHex: import("viem").Hex | null;
                v: bigint;
                value: bigint;
                yParity: number;
                accessList: import("viem").AccessList;
                authorizationList?: undefined | undefined;
                blobVersionedHashes?: undefined | undefined;
                chainId: number;
                type: "eip1559";
                gasPrice?: undefined | undefined;
                maxFeePerBlobGas?: undefined | undefined;
                maxFeePerGas: bigint;
                maxPriorityFeePerGas: bigint;
                isSystemTx?: undefined | undefined;
                mint?: undefined | undefined;
                sourceHash?: undefined | undefined;
            } | {
                blockHash: `0x${string}` | null;
                blockNumber: bigint | null;
                from: import("viem").Address;
                gas: bigint;
                hash: import("viem").Hash;
                input: import("viem").Hex;
                nonce: number;
                r: import("viem").Hex;
                s: import("viem").Hex;
                to: import("viem").Address | null;
                transactionIndex: number | null;
                typeHex: import("viem").Hex | null;
                v: bigint;
                value: bigint;
                yParity: number;
                accessList: import("viem").AccessList;
                authorizationList?: undefined | undefined;
                blobVersionedHashes: readonly import("viem").Hex[];
                chainId: number;
                type: "eip4844";
                gasPrice?: undefined | undefined;
                maxFeePerBlobGas: bigint;
                maxFeePerGas: bigint;
                maxPriorityFeePerGas: bigint;
                isSystemTx?: undefined | undefined;
                mint?: undefined | undefined;
                sourceHash?: undefined | undefined;
            } | {
                blockHash: `0x${string}` | null;
                blockNumber: bigint | null;
                from: import("viem").Address;
                gas: bigint;
                hash: import("viem").Hash;
                input: import("viem").Hex;
                nonce: number;
                r: import("viem").Hex;
                s: import("viem").Hex;
                to: import("viem").Address | null;
                transactionIndex: number | null;
                typeHex: import("viem").Hex | null;
                v: bigint;
                value: bigint;
                yParity: number;
                accessList: import("viem").AccessList;
                authorizationList: import("viem").SignedAuthorizationList;
                blobVersionedHashes?: undefined | undefined;
                chainId: number;
                type: "eip7702";
                gasPrice?: undefined | undefined;
                maxFeePerBlobGas?: undefined | undefined;
                maxFeePerGas: bigint;
                maxPriorityFeePerGas: bigint;
                isSystemTx?: undefined | undefined;
                mint?: undefined | undefined;
                sourceHash?: undefined | undefined;
            }) & {};
            type: "transaction";
        };
        readonly transactionReceipt: {
            exclude: [] | undefined;
            format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                blobGasPrice?: bigint | undefined;
                blobGasUsed?: bigint | undefined;
                blockHash: import("viem").Hash;
                blockNumber: bigint;
                contractAddress: import("viem").Address | null | undefined;
                cumulativeGasUsed: bigint;
                effectiveGasPrice: bigint;
                from: import("viem").Address;
                gasUsed: bigint;
                logs: import("viem").Log<bigint, number, false>[];
                logsBloom: import("viem").Hex;
                root?: `0x${string}` | undefined;
                status: "success" | "reverted";
                to: import("viem").Address | null;
                transactionHash: import("viem").Hash;
                transactionIndex: number;
                type: import("viem").TransactionType;
                l1GasPrice: bigint | null;
                l1GasUsed: bigint | null;
                l1Fee: bigint | null;
                l1FeeScalar: number | null;
            } & {};
            type: "transactionReceipt";
        };
    };
    serializers: {
        readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
    };
    readonly network: "base-sepolia";
}, object & {
    client: import("viem").Client<import("viem").Transport, import("viem").Chain | undefined, {
        address: import("viem").Address;
        nonceManager?: import("viem").NonceManager | undefined;
        sign?: ((parameters: {
            hash: import("viem").Hash;
        }) => Promise<import("viem").Hex>) | undefined | undefined;
        signAuthorization?: ((parameters: import("viem").AuthorizationRequest) => Promise<import("viem/accounts").SignAuthorizationReturnType>) | undefined | undefined;
        signMessage: ({ message }: {
            message: import("viem").SignableMessage;
        }) => Promise<import("viem").Hex>;
        signTransaction: <serializer extends import("viem").SerializeTransactionFn<import("viem").TransactionSerializable> = import("viem").SerializeTransactionFn<import("viem").TransactionSerializable>, transaction extends Parameters<serializer>[0] = Parameters<serializer>[0]>(transaction: transaction, options?: {
            serializer?: serializer | undefined;
        } | undefined) => Promise<import("viem").Hex>;
        signTypedData: <const typedData extends import("viem").TypedData | Record<string, unknown>, primaryType extends keyof typedData | "EIP712Domain" = keyof typedData>(parameters: import("viem").TypedDataDefinition<typedData, primaryType>) => Promise<import("viem").Hex>;
        publicKey: import("viem").Hex;
        source: string;
        type: "local";
    } | import("viem").JsonRpcAccount | undefined>;
    entryPoint: {
        abi: readonly [{
            readonly inputs: readonly [{
                readonly name: "success";
                readonly type: "bool";
            }, {
                readonly name: "ret";
                readonly type: "bytes";
            }];
            readonly name: "DelegateAndRevert";
            readonly type: "error";
        }, {
            readonly inputs: readonly [{
                readonly name: "opIndex";
                readonly type: "uint256";
            }, {
                readonly name: "reason";
                readonly type: "string";
            }];
            readonly name: "FailedOp";
            readonly type: "error";
        }, {
            readonly inputs: readonly [{
                readonly name: "opIndex";
                readonly type: "uint256";
            }, {
                readonly name: "reason";
                readonly type: "string";
            }, {
                readonly name: "inner";
                readonly type: "bytes";
            }];
            readonly name: "FailedOpWithRevert";
            readonly type: "error";
        }, {
            readonly inputs: readonly [{
                readonly name: "returnData";
                readonly type: "bytes";
            }];
            readonly name: "PostOpReverted";
            readonly type: "error";
        }, {
            readonly inputs: readonly [];
            readonly name: "ReentrancyGuardReentrantCall";
            readonly type: "error";
        }, {
            readonly inputs: readonly [{
                readonly name: "sender";
                readonly type: "address";
            }];
            readonly name: "SenderAddressResult";
            readonly type: "error";
        }, {
            readonly inputs: readonly [{
                readonly name: "aggregator";
                readonly type: "address";
            }];
            readonly name: "SignatureValidationFailed";
            readonly type: "error";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "userOpHash";
                readonly type: "bytes32";
            }, {
                readonly indexed: true;
                readonly name: "sender";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "factory";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "paymaster";
                readonly type: "address";
            }];
            readonly name: "AccountDeployed";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [];
            readonly name: "BeforeExecution";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "totalDeposit";
                readonly type: "uint256";
            }];
            readonly name: "Deposited";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "userOpHash";
                readonly type: "bytes32";
            }, {
                readonly indexed: true;
                readonly name: "sender";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "nonce";
                readonly type: "uint256";
            }, {
                readonly indexed: false;
                readonly name: "revertReason";
                readonly type: "bytes";
            }];
            readonly name: "PostOpRevertReason";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "aggregator";
                readonly type: "address";
            }];
            readonly name: "SignatureAggregatorChanged";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "totalStaked";
                readonly type: "uint256";
            }, {
                readonly indexed: false;
                readonly name: "unstakeDelaySec";
                readonly type: "uint256";
            }];
            readonly name: "StakeLocked";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "withdrawTime";
                readonly type: "uint256";
            }];
            readonly name: "StakeUnlocked";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "withdrawAddress";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "amount";
                readonly type: "uint256";
            }];
            readonly name: "StakeWithdrawn";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "userOpHash";
                readonly type: "bytes32";
            }, {
                readonly indexed: true;
                readonly name: "sender";
                readonly type: "address";
            }, {
                readonly indexed: true;
                readonly name: "paymaster";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "nonce";
                readonly type: "uint256";
            }, {
                readonly indexed: false;
                readonly name: "success";
                readonly type: "bool";
            }, {
                readonly indexed: false;
                readonly name: "actualGasCost";
                readonly type: "uint256";
            }, {
                readonly indexed: false;
                readonly name: "actualGasUsed";
                readonly type: "uint256";
            }];
            readonly name: "UserOperationEvent";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "userOpHash";
                readonly type: "bytes32";
            }, {
                readonly indexed: true;
                readonly name: "sender";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "nonce";
                readonly type: "uint256";
            }];
            readonly name: "UserOperationPrefundTooLow";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "userOpHash";
                readonly type: "bytes32";
            }, {
                readonly indexed: true;
                readonly name: "sender";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "nonce";
                readonly type: "uint256";
            }, {
                readonly indexed: false;
                readonly name: "revertReason";
                readonly type: "bytes";
            }];
            readonly name: "UserOperationRevertReason";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "withdrawAddress";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "amount";
                readonly type: "uint256";
            }];
            readonly name: "Withdrawn";
            readonly type: "event";
        }, {
            readonly inputs: readonly [{
                readonly name: "unstakeDelaySec";
                readonly type: "uint32";
            }];
            readonly name: "addStake";
            readonly outputs: readonly [];
            readonly stateMutability: "payable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "account";
                readonly type: "address";
            }];
            readonly name: "balanceOf";
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "uint256";
            }];
            readonly stateMutability: "view";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "target";
                readonly type: "address";
            }, {
                readonly name: "data";
                readonly type: "bytes";
            }];
            readonly name: "delegateAndRevert";
            readonly outputs: readonly [];
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "account";
                readonly type: "address";
            }];
            readonly name: "depositTo";
            readonly outputs: readonly [];
            readonly stateMutability: "payable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "";
                readonly type: "address";
            }];
            readonly name: "deposits";
            readonly outputs: readonly [{
                readonly name: "deposit";
                readonly type: "uint256";
            }, {
                readonly name: "staked";
                readonly type: "bool";
            }, {
                readonly name: "stake";
                readonly type: "uint112";
            }, {
                readonly name: "unstakeDelaySec";
                readonly type: "uint32";
            }, {
                readonly name: "withdrawTime";
                readonly type: "uint48";
            }];
            readonly stateMutability: "view";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "account";
                readonly type: "address";
            }];
            readonly name: "getDepositInfo";
            readonly outputs: readonly [{
                readonly components: readonly [{
                    readonly name: "deposit";
                    readonly type: "uint256";
                }, {
                    readonly name: "staked";
                    readonly type: "bool";
                }, {
                    readonly name: "stake";
                    readonly type: "uint112";
                }, {
                    readonly name: "unstakeDelaySec";
                    readonly type: "uint32";
                }, {
                    readonly name: "withdrawTime";
                    readonly type: "uint48";
                }];
                readonly name: "info";
                readonly type: "tuple";
            }];
            readonly stateMutability: "view";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "sender";
                readonly type: "address";
            }, {
                readonly name: "key";
                readonly type: "uint192";
            }];
            readonly name: "getNonce";
            readonly outputs: readonly [{
                readonly name: "nonce";
                readonly type: "uint256";
            }];
            readonly stateMutability: "view";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "initCode";
                readonly type: "bytes";
            }];
            readonly name: "getSenderAddress";
            readonly outputs: readonly [];
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly components: readonly [{
                    readonly name: "sender";
                    readonly type: "address";
                }, {
                    readonly name: "nonce";
                    readonly type: "uint256";
                }, {
                    readonly name: "initCode";
                    readonly type: "bytes";
                }, {
                    readonly name: "callData";
                    readonly type: "bytes";
                }, {
                    readonly name: "accountGasLimits";
                    readonly type: "bytes32";
                }, {
                    readonly name: "preVerificationGas";
                    readonly type: "uint256";
                }, {
                    readonly name: "gasFees";
                    readonly type: "bytes32";
                }, {
                    readonly name: "paymasterAndData";
                    readonly type: "bytes";
                }, {
                    readonly name: "signature";
                    readonly type: "bytes";
                }];
                readonly name: "userOp";
                readonly type: "tuple";
            }];
            readonly name: "getUserOpHash";
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "bytes32";
            }];
            readonly stateMutability: "view";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly components: readonly [{
                    readonly components: readonly [{
                        readonly name: "sender";
                        readonly type: "address";
                    }, {
                        readonly name: "nonce";
                        readonly type: "uint256";
                    }, {
                        readonly name: "initCode";
                        readonly type: "bytes";
                    }, {
                        readonly name: "callData";
                        readonly type: "bytes";
                    }, {
                        readonly name: "accountGasLimits";
                        readonly type: "bytes32";
                    }, {
                        readonly name: "preVerificationGas";
                        readonly type: "uint256";
                    }, {
                        readonly name: "gasFees";
                        readonly type: "bytes32";
                    }, {
                        readonly name: "paymasterAndData";
                        readonly type: "bytes";
                    }, {
                        readonly name: "signature";
                        readonly type: "bytes";
                    }];
                    readonly name: "userOps";
                    readonly type: "tuple[]";
                }, {
                    readonly name: "aggregator";
                    readonly type: "address";
                }, {
                    readonly name: "signature";
                    readonly type: "bytes";
                }];
                readonly name: "opsPerAggregator";
                readonly type: "tuple[]";
            }, {
                readonly name: "beneficiary";
                readonly type: "address";
            }];
            readonly name: "handleAggregatedOps";
            readonly outputs: readonly [];
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly components: readonly [{
                    readonly name: "sender";
                    readonly type: "address";
                }, {
                    readonly name: "nonce";
                    readonly type: "uint256";
                }, {
                    readonly name: "initCode";
                    readonly type: "bytes";
                }, {
                    readonly name: "callData";
                    readonly type: "bytes";
                }, {
                    readonly name: "accountGasLimits";
                    readonly type: "bytes32";
                }, {
                    readonly name: "preVerificationGas";
                    readonly type: "uint256";
                }, {
                    readonly name: "gasFees";
                    readonly type: "bytes32";
                }, {
                    readonly name: "paymasterAndData";
                    readonly type: "bytes";
                }, {
                    readonly name: "signature";
                    readonly type: "bytes";
                }];
                readonly name: "ops";
                readonly type: "tuple[]";
            }, {
                readonly name: "beneficiary";
                readonly type: "address";
            }];
            readonly name: "handleOps";
            readonly outputs: readonly [];
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "key";
                readonly type: "uint192";
            }];
            readonly name: "incrementNonce";
            readonly outputs: readonly [];
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "callData";
                readonly type: "bytes";
            }, {
                readonly components: readonly [{
                    readonly components: readonly [{
                        readonly name: "sender";
                        readonly type: "address";
                    }, {
                        readonly name: "nonce";
                        readonly type: "uint256";
                    }, {
                        readonly name: "verificationGasLimit";
                        readonly type: "uint256";
                    }, {
                        readonly name: "callGasLimit";
                        readonly type: "uint256";
                    }, {
                        readonly name: "paymasterVerificationGasLimit";
                        readonly type: "uint256";
                    }, {
                        readonly name: "paymasterPostOpGasLimit";
                        readonly type: "uint256";
                    }, {
                        readonly name: "preVerificationGas";
                        readonly type: "uint256";
                    }, {
                        readonly name: "paymaster";
                        readonly type: "address";
                    }, {
                        readonly name: "maxFeePerGas";
                        readonly type: "uint256";
                    }, {
                        readonly name: "maxPriorityFeePerGas";
                        readonly type: "uint256";
                    }];
                    readonly name: "mUserOp";
                    readonly type: "tuple";
                }, {
                    readonly name: "userOpHash";
                    readonly type: "bytes32";
                }, {
                    readonly name: "prefund";
                    readonly type: "uint256";
                }, {
                    readonly name: "contextOffset";
                    readonly type: "uint256";
                }, {
                    readonly name: "preOpGas";
                    readonly type: "uint256";
                }];
                readonly name: "opInfo";
                readonly type: "tuple";
            }, {
                readonly name: "context";
                readonly type: "bytes";
            }];
            readonly name: "innerHandleOp";
            readonly outputs: readonly [{
                readonly name: "actualGasCost";
                readonly type: "uint256";
            }];
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "";
                readonly type: "address";
            }, {
                readonly name: "";
                readonly type: "uint192";
            }];
            readonly name: "nonceSequenceNumber";
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "uint256";
            }];
            readonly stateMutability: "view";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "interfaceId";
                readonly type: "bytes4";
            }];
            readonly name: "supportsInterface";
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "bool";
            }];
            readonly stateMutability: "view";
            readonly type: "function";
        }, {
            readonly inputs: readonly [];
            readonly name: "unlockStake";
            readonly outputs: readonly [];
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "withdrawAddress";
                readonly type: "address";
            }];
            readonly name: "withdrawStake";
            readonly outputs: readonly [];
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "withdrawAddress";
                readonly type: "address";
            }, {
                readonly name: "withdrawAmount";
                readonly type: "uint256";
            }];
            readonly name: "withdrawTo";
            readonly outputs: readonly [];
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }, {
            readonly stateMutability: "payable";
            readonly type: "receive";
        }];
        address: import("viem").Address;
        version: "0.7";
    };
    extend?: object | undefined;
    getAddress: () => Promise<import("viem").Address>;
    decodeCalls?: ((data: import("viem").Hex) => Promise<readonly {
        to: import("viem").Hex;
        data?: import("viem").Hex | undefined;
        value?: bigint | undefined;
    }[]>) | undefined | undefined;
    encodeCalls: (calls: readonly {
        to: import("viem").Hex;
        data?: import("viem").Hex | undefined;
        value?: bigint | undefined;
    }[]) => Promise<import("viem").Hex>;
    getFactoryArgs: () => Promise<{
        factory?: import("viem").Address | undefined;
        factoryData?: import("viem").Hex | undefined;
    }>;
    getNonce?: (parameters?: {
        key?: bigint | undefined;
    } | undefined) => Promise<bigint>;
    getStubSignature: (parameters?: import("viem/_types/account-abstraction").UserOperationRequest | undefined) => Promise<import("viem").Hex>;
    nonceKeyManager?: import("viem").NonceManager | undefined;
    sign: (parameters: {
        hash: import("viem").Hash;
    }) => Promise<import("viem").Hex>;
    signMessage: (parameters: {
        message: import("viem").SignableMessage;
    }) => Promise<import("viem").Hex>;
    signTypedData: <const typedData extends import("viem").TypedData | Record<string, unknown>, primaryType extends keyof typedData | "EIP712Domain" = keyof typedData>(parameters: import("viem").TypedDataDefinition<typedData, primaryType>) => Promise<import("viem").Hex>;
    signUserOperation: (parameters: import("viem").UnionPartialBy<import("viem/_types/account-abstraction").UserOperation, "sender"> & {
        chainId?: number | undefined;
    }) => Promise<import("viem").Hex>;
    userOperation?: {
        estimateGas?: ((userOperation: import("viem/_types/account-abstraction").UserOperationRequest) => Promise<import("viem").ExactPartial<import("viem/_types/account-abstraction/types/userOperation").EstimateUserOperationGasReturnType> | undefined>) | undefined;
    } | undefined | undefined;
    authorization?: undefined | undefined;
} & {
    address: import("viem").Address;
    getNonce: NonNullable<import("viem/_types/account-abstraction").SmartAccountImplementation["getNonce"]>;
    isDeployed: () => Promise<boolean>;
    type: "smart";
}, undefined, undefined>>;
//# sourceMappingURL=paymasterUtils.d.ts.map