import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MONGODB_URL || '';
const dbName = process.env.MONGODB_NAME || '';

let isConnected = false;

export async function connectDB() {
    if (!isConnected) {
        await mongoose.connect(url, { dbName });
        isConnected = true;
        console.log('Database connected');
    }
    return mongoose;
}

export { mongoose };