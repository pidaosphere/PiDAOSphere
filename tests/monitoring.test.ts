import { Connection } from '@solana/web3.js';
import { MonitoringService } from '../src/services/MonitoringService';
import { CacheService } from '../src/services/CacheService';
import { AuditLogService } from '../src/services/AuditLogService';
import { expect } from 'chai';
import sinon from 'sinon';

describe('MonitoringService', () => {
    let monitoringService: MonitoringService;
    let connection: Connection;
    let cacheService: CacheService;
    let auditLogService: AuditLogService;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        // Setup stubs and mocks
        connection = {
            getSlot: sinon.stub().resolves(1000),
        } as any;

        cacheService = {
            redis: {
                ping: sinon.stub().resolves('PONG'),
                keys: sinon.stub().resolves([]),
            },
            set: sinon.stub().resolves(),
            get: sinon.stub().resolves(null),
        } as any;

        auditLogService = {
            logEvent: sinon.stub().resolves(),
        } as any;

        clock = sinon.useFakeTimers();

        monitoringService = new MonitoringService(
            connection,
            cacheService,
            auditLogService
        );
    });

    afterEach(() => {
        clock.restore();
        sinon.restore();
    });

    describe('Health Checks', () => {
        it('should report healthy status when all services are up', async () => {
            const status = await monitoringService.getSystemStatus();
            
            expect(status.overall).to.equal('healthy');
            expect(status.services).to.have.property('solana');
            expect(status.services).to.have.property('redis');
            expect(status.services).to.have.property('api');
        });

        it('should report degraded status when service is slow', async () => {
            // Simulate slow Solana connection
            const getSlotStub = connection.getSlot as sinon.SinonStub;
            getSlotStub.callsFake(async () => {
                await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
                return 1000;
            });

            const status = await monitoringService.getSystemStatus();
            
            expect(status.overall).to.equal('degraded');
            expect(status.services.solana.status).to.equal('degraded');
        });

        it('should report down status when service is unavailable', async () => {
            // Simulate Redis connection failure
            const pingStub = cacheService.redis.ping as sinon.SinonStub;
            pingStub.rejects(new Error('Connection refused'));

            const status = await monitoringService.getSystemStatus();
            
            expect(status.overall).to.equal('down');
            expect(status.services.redis.status).to.equal('down');
        });
    });

    describe('Alert System', () => {
        it('should trigger alert for critical issues', async () => {
            // Simulate connection failure
            const getSlotStub = connection.getSlot as sinon.SinonStub;
            getSlotStub.rejects(new Error('Network error'));

            await monitoringService.getSystemStatus();

            expect(auditLogService.logEvent).to.have.been.calledWith(
                sinon.match({
                    type: 'SECURITY',
                    action: 'SYSTEM_ALERT',
                    status: 'FAILURE',
                })
            );
        });

        it('should not trigger alert for healthy services', async () => {
            await monitoringService.getSystemStatus();
            
            expect(auditLogService.logEvent).to.not.have.been.called;
        });
    });

    describe('Historical Data', () => {
        it('should store and retrieve health check history', async () => {
            const mockCheck = {
                service: 'solana',
                status: 'healthy',
                latency: 100,
                timestamp: new Date(),
            };

            // Setup mock data
            const keysStub = cacheService.redis.keys as sinon.SinonStub;
            keysStub.resolves(['health:solana:123']);
            
            const getStub = cacheService.get as sinon.SinonStub;
            getStub.resolves(mockCheck);

            const history = await monitoringService.getServiceHealth('solana');
            
            expect(history).to.have.lengthOf(1);
            expect(history[0]).to.deep.equal(mockCheck);
        });
    });

    describe('Performance Monitoring', () => {
        it('should detect high latency', async () => {
            // Simulate high latency
            const getSlotStub = connection.getSlot as sinon.SinonStub;
            getSlotStub.callsFake(async () => {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
                return 1000;
            });

            const status = await monitoringService.getSystemStatus();
            
            expect(status.services.solana.status).to.equal('degraded');
            expect(status.services.solana.latency).to.be.above(1000);
        });
    });

    describe('Error Handling', () => {
        it('should handle unexpected errors gracefully', async () => {
            // Simulate unexpected error
            const getSlotStub = connection.getSlot as sinon.SinonStub;
            getSlotStub.throws(new Error('Unexpected error'));

            const status = await monitoringService.getSystemStatus();
            
            expect(status.overall).to.equal('down');
            expect(status.services.solana.status).to.equal('down');
            expect(status.services.solana.details).to.have.property('error');
        });
    });
}); 