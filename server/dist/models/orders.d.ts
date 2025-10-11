export default interface Order {
    _id?: string;
    type: 'deposit' | 'withdrawal';
    status: 'open' | 'matched' | 'escrowed' | 'fulfilled' | 'cancelled' | 'disputed';
    amount: number;
    token: string;
    businessId: string;
    peerId?: string;
    merchantId?: string;
    escrowTxHash?: string;
    confirmations: {
        business: boolean;
        peer?: boolean;
        merchant?: boolean;
        time?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    escrowExpiresAt?: Date;
    details?: string;
}
//# sourceMappingURL=orders.d.ts.map