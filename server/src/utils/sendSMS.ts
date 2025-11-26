import AfricasTalking from 'africastalking';

const AT_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AT_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AT_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID 

if (!AT_USERNAME || !AT_API_KEY) {
    console.error("Africa's Talking API credentials are not set in environment variables.");
    process.exit(1); 
}

const africastalking = AfricasTalking({
    username: AT_USERNAME,
    apiKey: AT_API_KEY
});

export async function sendSMS(to: string, message: string): Promise<any> {
    console.log('Original phone number:', to);
    let formattedTo = to;
    
    // Remove any existing + prefix first
    if (formattedTo.startsWith('+')) {
        formattedTo = formattedTo.substring(1);
    }
    
    // Format phone number to international format
    if (formattedTo.startsWith('07')) {
        // Convert 0722... to 254722...
        formattedTo = '254' + formattedTo.substring(1);
    } else if (formattedTo.startsWith('7')) {
        // Convert 722... to 254722...
        formattedTo = '254' + formattedTo;
    } else if (!formattedTo.startsWith('254')) {
        // If it doesn't start with 254, add it
        formattedTo = '254' + formattedTo;
    }
    
    formattedTo = '+' + formattedTo;
    
    console.log('Formatted phone number:', formattedTo);

    const options = {
        to: [formattedTo],
        message: message,
        from: AT_SENDER_ID 
    };
    console.log('Sending SMS with options:', options);

    try {
        const response = await africastalking.SMS.send(options);
        console.log('SMS sent successfully. Full response:', response);
        return response;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}