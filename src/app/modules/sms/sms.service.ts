import config from '../../../app/config';

/**
 * @description
 * This function is used to send SMS to users
 * @param msisdn Phone number of the user
 * @param messageBody Message body of the SMS
 * @param customCsmsId Custom CSMS ID of the SMS
 * @returns {
 *  success: boolean,
 *  error?: string,
 *  rawResponse?: any,
 * }
 */

async function sendSmsToUser(msisdn: string, messageBody: string, customCsmsId?: string) {
    const generateCsmsId = () => {
        return Math.random().toString(36).substring(2, 26);
    }

    const csms_id = customCsmsId || generateCsmsId();

    const payload = {
        api_token: config.sms.api_token,
        sid: config.sms.sid,
        msisdn: msisdn,
        sms: messageBody,
        csms_id: csms_id,
    };
    console.log('SMS Payload:', payload);

    try {
        const response = await fetch(config.sms.api_url, {
            method: 'POST',
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        return handleSmsResponse(data, msisdn);
    } catch (error: any) {
        console.error(`❌ Network error for ${msisdn}:`, error.message);
        return { success: false, msisdn, error: 'Network Error' };
    }
}

function handleSmsResponse(data: any, msisdn: string) {
    const statusCode = data.code || data.status;
    if (statusCode === 200 || data.status === 'SUCCESS') {
        console.log(`✅ SMS sent successfully to ${msisdn}`);
        return { success: true, msisdn, message: 'SMS Sent' };
    }

    const errorMap: Record<number, string> = {
        4001: 'Authentication failed (Token/SID incorrect)',
        4022: 'Required parameter missing (a field is omitted)',
        4025: 'Invalid MSISDN (phone number in wrong format)',
        4026: 'Blocked MSISDN (the number is blocked)',
        4029: 'Rate limit exceeded',
        4031: 'TPS limit exceeded (too many requests in one second)',
        4032: 'Invalid SMS body (message contains invalid characters)',
        5000: 'Server internal error (problem on SSL Wireless server)',
    };


    const errorMessage = errorMap[statusCode] || `Unknown Error: ${statusCode}`;
    console.error(`❌ Failed for ${msisdn}. Reason: ${errorMessage}`);

    return { success: false, msisdn, error: errorMessage, rawResponse: data };
}

export { sendSmsToUser };
