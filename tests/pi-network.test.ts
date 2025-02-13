import { expect } from 'chai';
import { PiNetworkService } from '../src/frontend/services/PiNetworkService';
import axios from 'axios';
import sinon from 'sinon';

describe('PiNetworkService', () => {
    let piNetworkService: PiNetworkService;
    let mockPi: any;

    beforeEach(() => {
        // Mock Pi SDK
        mockPi = {
            init: sinon.stub(),
            authenticate: sinon.stub(),
            createPayment: sinon.stub(),
        };

        // Mock window object
        global.window = {
            Pi: mockPi,
        } as any;

        piNetworkService = new PiNetworkService();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('authenticate', () => {
        it('should authenticate successfully', async () => {
            const mockAuthResponse = {
                accessToken: 'test_token',
                user: { username: 'test_user' },
            };

            mockPi.authenticate.resolves(mockAuthResponse);

            const result = await piNetworkService.authenticate();

            expect(result).to.deep.equal(mockAuthResponse);
            expect(piNetworkService.isAuthenticated()).to.be.true;
            expect(piNetworkService.getUser()).to.deep.equal(mockAuthResponse.user);
        });

        it('should handle authentication failure', async () => {
            mockPi.authenticate.rejects(new Error('Auth failed'));

            try {
                await piNetworkService.authenticate();
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Auth failed');
                expect(piNetworkService.isAuthenticated()).to.be.false;
                expect(piNetworkService.getUser()).to.be.null;
            }
        });
    });

    describe('createPayment', () => {
        it('should create payment successfully', async () => {
            const mockPaymentId = 'test_payment_id';
            const mockTxId = 'test_tx_id';

            mockPi.createPayment.callsFake((payment, callbacks) => {
                // Simulate successful payment flow
                callbacks.onReadyForServerApproval(mockPaymentId);
                callbacks.onReadyForServerCompletion(mockPaymentId, mockTxId);
            });

            // Mock axios calls
            const axiosPostStub = sinon.stub(axios, 'post').resolves({ data: {} });

            await piNetworkService.createPayment(1.0, 'Test payment', { test: true });

            expect(axiosPostStub.callCount).to.equal(2);
            expect(axiosPostStub.firstCall.args[0]).to.equal('/api/payments/approve');
            expect(axiosPostStub.secondCall.args[0]).to.equal('/api/payments/complete');
        });

        it('should handle payment cancellation', async () => {
            mockPi.createPayment.callsFake((payment, callbacks) => {
                callbacks.onCancel('test_payment_id');
            });

            try {
                await piNetworkService.createPayment(1.0, 'Test payment', { test: true });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Payment cancelled');
            }
        });

        it('should handle payment error', async () => {
            const mockError = new Error('Payment failed');
            mockPi.createPayment.callsFake((payment, callbacks) => {
                callbacks.onError(mockError, { test: true });
            });

            try {
                await piNetworkService.createPayment(1.0, 'Test payment', { test: true });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.equal(mockError);
            }
        });
    });

    describe('payment approval and completion', () => {
        it('should handle payment approval failure', async () => {
            mockPi.createPayment.callsFake((payment, callbacks) => {
                callbacks.onReadyForServerApproval('test_payment_id');
            });

            sinon.stub(axios, 'post').rejects(new Error('Approval failed'));

            try {
                await piNetworkService.createPayment(1.0, 'Test payment', { test: true });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Approval failed');
            }
        });

        it('should handle payment completion failure', async () => {
            mockPi.createPayment.callsFake((payment, callbacks) => {
                callbacks.onReadyForServerApproval('test_payment_id');
                callbacks.onReadyForServerCompletion('test_payment_id', 'test_tx_id');
            });

            const axiosPostStub = sinon.stub(axios, 'post');
            axiosPostStub.onFirstCall().resolves({ data: {} });
            axiosPostStub.onSecondCall().rejects(new Error('Completion failed'));

            try {
                await piNetworkService.createPayment(1.0, 'Test payment', { test: true });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Completion failed');
            }
        });
    });
}); 