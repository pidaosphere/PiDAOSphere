import axios from 'axios';
import { PI_NETWORK_API, PI_APP_ID, PI_API_KEY } from '../config';

export class PiNetworkService {
    private readonly apiUrl: string;
    private readonly appId: string;
    private readonly apiKey: string;

    constructor() {
        this.apiUrl = PI_NETWORK_API;
        this.appId = PI_APP_ID;
        this.apiKey = PI_API_KEY;
    }

    async authenticateUser(accessToken: string): Promise<any> {
        try {
            const response = await axios.post(
                `${this.apiUrl}/v2/me`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Pi-App-ID': this.appId,
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Pi Network authentication failed:', error);
            throw error;
        }
    }

    async verifyPayment(paymentId: string): Promise<any> {
        try {
            const response = await axios.post(
                `${this.apiUrl}/v2/payments/${paymentId}/complete`,
                {},
                {
                    headers: {
                        'Authorization': `Key ${this.apiKey}`,
                        'Pi-App-ID': this.appId,
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Payment verification failed:', error);
            throw error;
        }
    }

    async getPiBalance(username: string): Promise<number> {
        try {
            const response = await axios.get(
                `${this.apiUrl}/v2/users/${username}/balance`,
                {
                    headers: {
                        'Authorization': `Key ${this.apiKey}`,
                        'Pi-App-ID': this.appId,
                    }
                }
            );
            return response.data.balance;
        } catch (error) {
            console.error('Balance check failed:', error);
            throw error;
        }
    }
} 