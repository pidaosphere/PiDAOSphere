import request from 'supertest';
import { app } from '../../src/index';
import { expect } from 'chai';
import { PiNetworkService } from '../../src/services/PiNetworkService';
import sinon from 'sinon';

describe('API Integration Tests', () => {
    let piNetworkService: PiNetworkService;

    beforeEach(() => {
        piNetworkService = new PiNetworkService();
        sinon.stub(piNetworkService, 'authenticate').resolves({
            accessToken: 'test_token',
            user: { username: 'test_user' }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Authentication Endpoints', () => {
        it('should authenticate Pi Network user', async () => {
            const response = await request(app)
                .post('/auth/pi')
                .send({ accessToken: 'test_token' });

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('user');
            expect(response.body.user.username).to.equal('test_user');
        });

        it('should handle invalid authentication', async () => {
            const response = await request(app)
                .post('/auth/pi')
                .send({ accessToken: '' });

            expect(response.status).to.equal(400);
            expect(response.body).to.have.property('error');
        });
    });

    describe('Project Endpoints', () => {
        it('should create new project', async () => {
            const projectData = {
                name: 'Test Project',
                description: 'Test Description',
                totalSupply: 1000000,
                initialPrice: 1.0,
                duration: 7 * 24 * 60 * 60,
                minInvestment: 100,
                maxInvestment: 10000
            };

            const response = await request(app)
                .post('/projects')
                .set('Authorization', 'Bearer test_token')
                .send(projectData);

            expect(response.status).to.equal(201);
            expect(response.body).to.have.property('projectId');
        });

        it('should list all projects', async () => {
            const response = await request(app)
                .get('/projects');

            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('array');
        });
    });

    describe('Investment Endpoints', () => {
        it('should process investment', async () => {
            const investmentData = {
                projectId: 'test_project',
                amount: 1000,
                paymentId: 'test_payment'
            };

            const response = await request(app)
                .post('/investments')
                .set('Authorization', 'Bearer test_token')
                .send(investmentData);

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('transactionId');
        });

        it('should get investment history', async () => {
            const response = await request(app)
                .get('/investments/history')
                .set('Authorization', 'Bearer test_token');

            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('array');
        });
    });

    describe('Proposal Endpoints', () => {
        it('should create new proposal', async () => {
            const proposalData = {
                title: 'Test Proposal',
                description: 'Test Description',
                votingPeriod: 3 * 24 * 60 * 60
            };

            const response = await request(app)
                .post('/proposals')
                .set('Authorization', 'Bearer test_token')
                .send(proposalData);

            expect(response.status).to.equal(201);
            expect(response.body).to.have.property('proposalId');
        });

        it('should cast vote', async () => {
            const voteData = {
                proposalId: 'test_proposal',
                support: true
            };

            const response = await request(app)
                .post('/proposals/vote')
                .set('Authorization', 'Bearer test_token')
                .send(voteData);

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('success', true);
        });
    });
}); 