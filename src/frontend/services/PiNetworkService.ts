import axios from 'axios';

declare global {
    interface Window {
        Pi: {
            init: ({ version }: { version: string }) => void;
            authenticate: (
                scopes: string[],
                onIncompletePaymentFound: (payment: any) => void
            ) => Promise<{ accessToken: string; user: any }>;
            createPayment: (
                payment: {
                    amount: number;
                    memo: string;
                    metadata: any;
                },
                callbacks: {
                    onReadyForServerApproval: (paymentId: string) => void;
                    onReadyForServerCompletion: (paymentId: string, txid: string) => void;
                    onCancel: (paymentId: string) => void;
                    onError: (error: Error, payment: any) => void;
                }
            ) => void;
        };
    }
}

export interface PaymentResult {
    paymentId: string;
    txid: string;
    amount: number;
    status: 'completed' | 'failed' | 'cancelled';
    timestamp: Date;
}

export class PiNetworkService {
    private accessToken: string | null = null;
    private user: any = null;

    constructor() {
        // Initialize Pi SDK
        if (typeof window !== 'undefined') {
            window.Pi?.init({ version: "2.0" });
        }
    }

    async authenticate(): Promise<{ accessToken: string; user: any }> {
        try {
            const auth = await window.Pi.authenticate(["payments"], this.onIncompletePaymentFound);
            this.accessToken = auth.accessToken;
            this.user = auth.user;
            return auth;
        } catch (error) {
            console.error('Pi Network authentication failed:', error);
            throw error;
        }
    }

    async createPayment(amount: number, memo: string, metadata: any): Promise<void> {
        return new Promise((resolve, reject) => {
            window.Pi.createPayment(
                {
                    amount,
                    memo,
                    metadata,
                },
                {
                    onReadyForServerApproval: async (paymentId: string) => {
                        try {
                            await this.approvePayment(paymentId);
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onReadyForServerCompletion: async (paymentId: string, txid: string) => {
                        try {
                            await this.completePayment(paymentId, txid);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onCancel: (paymentId: string) => {
                        reject(new Error('Payment cancelled'));
                    },
                    onError: (error: Error, payment: any) => {
                        console.error('Payment error:', error, payment);
                        reject(error);
                    },
                }
            );
        });
    }

    private async approvePayment(paymentId: string): Promise<void> {
        try {
            await axios.post('/api/payments/approve', {
                paymentId,
                userId: this.user?.uid,
            });
        } catch (error) {
            console.error('Payment approval failed:', error);
            throw error;
        }
    }

    private async completePayment(paymentId: string, txid: string): Promise<void> {
        try {
            await axios.post('/api/payments/complete', {
                paymentId,
                txid,
                userId: this.user?.uid,
            });
        } catch (error) {
            console.error('Payment completion failed:', error);
            throw error;
        }
    }

    private onIncompletePaymentFound(payment: any): void {
        console.log('Incomplete payment found:', payment);
        // Handle incomplete payment
    }

    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    getUser(): any {
        return this.user;
    }

    async initiatePayment(amount: number, memo: string, metadata: any = {}): Promise<PaymentResult> {
        if (!this.isAuthenticated()) {
            throw new Error('User must be authenticated to make payments');
        }

        return new Promise((resolve, reject) => {
            window.Pi.createPayment(
                {
                    amount,
                    memo,
                    metadata: {
                        ...metadata,
                        userId: this.user?.uid,
                        timestamp: new Date().toISOString(),
                    },
                },
                {
                    onReadyForServerApproval: async (paymentId: string) => {
                        try {
                            await this.approvePayment(paymentId);
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onReadyForServerCompletion: async (paymentId: string, txid: string) => {
                        try {
                            await this.completePayment(paymentId, txid);
                            resolve({
                                paymentId,
                                txid,
                                amount,
                                status: 'completed',
                                timestamp: new Date(),
                            });
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onCancel: (paymentId: string) => {
                        resolve({
                            paymentId,
                            txid: '',
                            amount,
                            status: 'cancelled',
                            timestamp: new Date(),
                        });
                    },
                    onError: (error: Error, payment: any) => {
                        resolve({
                            paymentId: payment?.identifier || '',
                            txid: '',
                            amount,
                            status: 'failed',
                            timestamp: new Date(),
                        });
                    },
                }
            );
        });
    }

    async getPaymentHistory(): Promise<PaymentResult[]> {
        try {
            const response = await axios.get('/api/payments/history', {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch payment history:', error);
            throw error;
        }
    }
} 