export interface User {
    _id?: string;
    contact: string;
    fname: string;
    lname: string;
    country: string;
    passwordHash: string;
    did: string;
    address: string;
    publicKey: string;
    isAgent: boolean;
    businessId?: string;
    status: 'active' | 'pending' | 'suspended';
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=user.d.ts.map