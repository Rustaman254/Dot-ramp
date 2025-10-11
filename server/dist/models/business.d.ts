export interface Business {
    _id?: string;
    businessName: string;
    legalEntityType: string;
    registrationNumber?: string;
    contactEmail: string;
    address: string;
    publicKey: string;
    website?: string;
    isApproved: boolean;
    kycStatus: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=business.d.ts.map