import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrivyClient } from '@privy-io/node';
import { connectDB } from '../config/db';
function isEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isPhone(phone) {
    return /^\+[1-9]\d{9,14}$/.test(phone); // expects "+254..." not just "254..."
}
// Normalizes phone by removing the + sign if present
function normalizePhone(phone) {
    return phone && phone[0] === '+' ? phone.slice(1) : phone;
}
const privy = new PrivyClient({
    appId: process.env.PRIVY_APP_ID,
    appSecret: process.env.PRIVY_APP_SECRET
});
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_fallback_secret";
// REGISTER
export const register = async (req, res) => {
    try {
        const { phone, email, password, country, fname, lname, isAgent, businessName, legalEntityType, registrationNumber, businessEmail, website } = req.body;
        // Normalize phone for storage & use in user document
        let contact = undefined;
        if (phone) {
            if (!isPhone(phone)) {
                return res.status(400).json({ error: "Invalid phone format." });
            }
            contact = normalizePhone(phone); // always without "+"
        }
        else if (email) {
            if (!isEmail(email)) {
                return res.status(400).json({ error: "Invalid email format." });
            }
            contact = email;
        }
        else {
            return res.status(400).json({ error: "Invalid phone number or email." });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters." });
        }
        const db = await connectDB();
        const users = db.collection('users');
        const businesses = db.collection('businesses');
        const existPeer = await users.findOne({ contact });
        if (existPeer) {
            return res.status(409).json({ error: "Contact already registered" });
        }
        let businessId = undefined;
        let bizWalletData;
        if (businessName && legalEntityType && businessEmail) {
            const existBiz = await businesses.findOne({ contactEmail: businessEmail });
            if (existBiz) {
                businessId = existBiz._id.toString();
            }
            else {
                bizWalletData = await privy.wallets().create({ chain_type: 'ethereum' });
                const bizDoc = {
                    businessName,
                    legalEntityType,
                    registrationNumber,
                    contactEmail: businessEmail,
                    address: bizWalletData.address,
                    publicKey: bizWalletData.public_key,
                    privyWalletId: bizWalletData.id,
                    website,
                    isApproved: false,
                    kycStatus: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const bizResult = await businesses.insertOne(bizDoc);
                businessId = bizResult.insertedId.toString();
            }
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const userWalletData = await privy.wallets().create({ chain_type: 'ethereum' });
        const did = `did:ethr:${userWalletData.address}`;
        const userDoc = {
            contact,
            fname,
            lname,
            country,
            passwordHash,
            did,
            address: userWalletData.address,
            publicKey: userWalletData.public_key,
            privyWalletId: userWalletData.id,
            isAgent: isAgent || false,
            businessId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await users.insertOne(userDoc);
        const jwtPayload = {
            userId: userDoc.contact,
            did: userDoc.did,
            fname: userDoc.fname,
            lname: userDoc.lname,
            isAgent: userDoc.isAgent,
            businessId,
        };
        const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            token,
            did,
            address: userWalletData.address,
            publicKey: userWalletData.public_key,
            privyWalletId: userWalletData.id,
            contact,
            isAgent: userDoc.isAgent,
            businessId
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
// LOGIN
export const login = async (req, res) => {
    try {
        let { contact, password } = req.body;
        if (!contact || (!isPhone(contact) && !isEmail(contact))) {
            return res.status(400).json({ error: "Invalid phone number or email." });
        }
        // Normalize phone for lookup (if it's a phone)
        if (isPhone(contact)) {
            contact = normalizePhone(contact);
        }
        if (!password) {
            return res.status(400).json({ error: "Password required." });
        }
        const db = await connectDB();
        const users = db.collection('users');
        const user = await users.findOne({ contact });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        const jwtPayload = {
            userId: user.contact,
            did: user.did,
            fname: user.fname,
            lname: user.lname,
            isAgent: user.isAgent,
            businessId: user.businessId,
        };
        const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            token,
            did: user.did,
            address: user.address,
            publicKey: user.publicKey,
            privyWalletId: user.privyWalletId,
            contact: user.contact,
            isAgent: user.isAgent,
            businessId: user.businessId,
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
// RESET PASSWORD
export const resetPassword = async (req, res) => {
    try {
        let { contact, token, password } = req.body;
        if (!contact || !token || !password || password.length < 8) {
            return res.status(400).json({ error: "All fields required and password must be at least 8 characters." });
        }
        if (isPhone(contact))
            contact = normalizePhone(contact);
        const db = await connectDB();
        const recoveries = db.collection('password_resets');
        const users = db.collection('users');
        const recovery = await recoveries.findOne({
            contact,
            used: false,
            expires: { $gt: new Date() }
        });
        if (!recovery) {
            return res.status(400).json({ error: "Invalid or expired recovery token." });
        }
        const tokenValid = await bcrypt.compare(token, recovery.tokenHash);
        if (!tokenValid) {
            return res.status(400).json({ error: "Invalid or expired recovery token." });
        }
        const passwordHash = await bcrypt.hash(password, 12);
        await users.updateOne({ contact }, { $set: { passwordHash } });
        await recoveries.updateOne({ _id: recovery._id }, { $set: { used: true } });
        return res.json({ message: "Password reset successful." });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// RECOVER
export const recover = async (req, res) => {
    try {
        let { contact } = req.body;
        if (!contact || (!isPhone(contact) && !isEmail(contact))) {
            return res.status(400).json({ error: "Invalid phone number or email." });
        }
        if (isPhone(contact))
            contact = normalizePhone(contact);
        const db = await connectDB();
        const users = db.collection('users');
        const user = await users.findOne({ contact });
        if (!user) {
            return res.status(200).json({ message: "If an account exists, recovery instructions have been sent." });
        }
        const token = jwt.sign({
            contact,
            type: "password-reset"
        }, JWT_SECRET, { expiresIn: "30m" });
        // TODO: Send token to user via email/SMS as reset URL
        return res.status(200).json({
            message: "If an account exists, recovery instructions have been sent."
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
//# sourceMappingURL=autController.js.map