import { connectDB } from '../config/db';
export const listUsers = async (req, res) => {
    try {
        const db = await connectDB();
        const users = db.collection('users');
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 25;
        const total = await users.countDocuments();
        const data = await users.find({})
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .project({ passwordHash: 0 })
            .toArray();
        res.json({ total, page, pageSize, data });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
export const getUser = async (req, res) => {
    try {
        const contact = req.params.contact;
        if (!contact)
            return res.status(400).json({ error: "contact required" });
        const db = await connectDB();
        const users = db.collection('users');
        const user = await users.findOne({ contact }, { projection: { passwordHash: 0 } });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
//# sourceMappingURL=userManagement.js.map