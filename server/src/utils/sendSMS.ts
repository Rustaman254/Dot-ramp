import './config/env.js';
import AfricasTalking from 'africastalking';

const AT_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AT_API_KEY = process.env.AFRICASTALKING_API_KEY;

if (!AT_USERNAME || !AT_API_KEY) {
    throw new Error("Africa's Talking API credentials are not set in environment variables.");
}

const africastalking = AfricasTalking({
    username: AT_USERNAME,
    apiKey: AT_API_KEY
});

export async function sendSMS(to: string, message: string): Promise<any> {
    const options = {
        to: [to],
        message: message
    };

    try {
        const response = await africastalking.SMS.send(options);
        console.log('SMS sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}
