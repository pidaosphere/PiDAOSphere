import autocannon from 'autocannon';
import { app } from '../../src/index';
import { expect } from 'chai';

describe('Performance Tests', () => {
    let server: any;
    const PORT = 3001;

    before((done) => {
        server = app.listen(PORT, done);
    });

    after((done) => {
        server.close(done);
    });

    it('should handle high concurrent requests for project listing', (done) => {
        const instance = autocannon({
            url: `http://localhost:${PORT}/projects`,
            connections: 100,
            pipelining: 10,
            duration: 10
        });

        autocannon.track(instance);

        instance.on('done', (result) => {
            expect(result.errors).to.equal(0);
            expect(result.timeouts).to.equal(0);
            expect(result.latency.p99).to.be.below(1000); // 99th percentile latency should be under 1s
            expect(result.requests.average).to.be.above(1000); // Should handle over 1000 req/sec
            done();
        });
    });

    it('should handle concurrent authentication requests', (done) => {
        const instance = autocannon({
            url: `http://localhost:${PORT}/auth/pi`,
            connections: 50,
            pipelining: 5,
            duration: 10,
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                accessToken: 'test_token'
            })
        });

        autocannon.track(instance);

        instance.on('done', (result) => {
            expect(result.errors).to.equal(0);
            expect(result.timeouts).to.equal(0);
            expect(result.latency.p95).to.be.below(500); // 95th percentile latency should be under 500ms
            expect(result.requests.average).to.be.above(500); // Should handle over 500 req/sec
            done();
        });
    });

    it('should handle concurrent investment requests', (done) => {
        const instance = autocannon({
            url: `http://localhost:${PORT}/investments`,
            connections: 20,
            pipelining: 2,
            duration: 10,
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer test_token'
            },
            body: JSON.stringify({
                projectId: 'test_project',
                amount: 1000,
                paymentId: 'test_payment'
            })
        });

        autocannon.track(instance);

        instance.on('done', (result) => {
            expect(result.errors).to.equal(0);
            expect(result.timeouts).to.equal(0);
            expect(result.latency.p95).to.be.below(1000); // 95th percentile latency should be under 1s
            expect(result.requests.average).to.be.above(200); // Should handle over 200 req/sec
            done();
        });
    });

    it('should handle concurrent proposal creation requests', (done) => {
        const instance = autocannon({
            url: `http://localhost:${PORT}/proposals`,
            connections: 30,
            pipelining: 3,
            duration: 10,
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer test_token'
            },
            body: JSON.stringify({
                title: 'Test Proposal',
                description: 'Test Description',
                votingPeriod: 259200
            })
        });

        autocannon.track(instance);

        instance.on('done', (result) => {
            expect(result.errors).to.equal(0);
            expect(result.timeouts).to.equal(0);
            expect(result.latency.p95).to.be.below(800); // 95th percentile latency should be under 800ms
            expect(result.requests.average).to.be.above(300); // Should handle over 300 req/sec
            done();
        });
    });
}); 