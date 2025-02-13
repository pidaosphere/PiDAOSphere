# PiDAOSphere Troubleshooting Guide

## Table of Contents
1. [Common Issues Diagnosis](#common-issues)
2. [System Status Check](#system-status)
3. [Error Code Explanation](#error-codes)
4. [Emergency Handling](#emergencies)

## Common Issues Diagnosis <a name="common-issues"></a>

### Authentication Issues

#### Pi Network Authentication Failure
1. Check Items:
- Pi Network service status
- User accessToken validity
- Network connection status

2. Solutions:
- Clear browser cache
- Re-login to Pi Network
- Check Pi Network API configuration

#### Solana Wallet Connection Issues
1. Check Items:
- Wallet extension installation
- Network selection (Mainnet/Devnet)
- Wallet balance

2. Solutions:
- Reinstall wallet extension
- Switch to correct network
- Ensure sufficient SOL balance

### Transaction Issues

#### Transaction Failure
1. Check Items:
- Network congestion
- Gas fee settings
- Transaction parameters

2. Solutions:
- Retry during lower congestion
- Adjust gas fee
- Verify transaction data

#### Investment Failure
1. Check Items:
- Investment amount limits
- Project status
- User eligibility

2. Solutions:
- Verify investment amount
- Check project timeline
- Confirm user requirements

## System Status Check <a name="system-status"></a>

### Service Health Check
```bash
# Check pod status
kubectl get pods -n pidaosphere

# Check service status
kubectl get services -n pidaosphere

# Check logs
kubectl logs -f deployment/pidaosphere-app -n pidaosphere
```

### Database Check
```bash
# Check Redis connection
redis-cli ping

# Check Redis metrics
redis-cli info
```

### Blockchain Check
```bash
# Check Solana connection
solana cluster-version

# Check program status
solana program show <PROGRAM_ID>
```

## Error Code Explanation <a name="error-codes"></a>

### HTTP Status Codes
- 400: Bad Request - Invalid parameters
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Server-side issue

### Contract Error Codes
- 6000: Invalid configuration
- 6001: Investment amount out of bounds
- 6002: Investment cap reached
- 6003: Invalid time window
- 6004: Insufficient funds
- 6005: Unauthorized access

## Emergency Handling <a name="emergencies"></a>

### System Outage
1. Immediate Actions:
- Check system monitoring alerts
- Identify affected components
- Notify incident response team

2. Recovery Steps:
- Execute emergency shutdown if needed
- Restore from latest backup
- Verify system integrity

### Security Incidents
1. Immediate Actions:
- Isolate affected components
- Enable emergency mode
- Notify security team

2. Recovery Steps:
- Assess damage scope
- Apply security patches
- Reset compromised credentials

### Data Recovery
1. Backup Restoration:
```bash
# Restore Redis data
aws s3 cp s3://pidaosphere-backups/redis/latest.rdb /data/
redis-cli flushall
redis-cli config set dir /data
redis-cli config set dbfilename dump.rdb

# Restore contract state
solana program deploy backup/program.so
```

2. Verification Steps:
- Check data integrity
- Verify system functionality
- Test critical operations

### Emergency Contacts
- Technical Lead: tech-lead@pidaosphere.com
- Security Team: security@pidaosphere.com
- Operations: ops@pidaosphere.com

### Monitoring Metrics
- TPS (Transactions Per Second): > 1000
- Response Time: < 500ms
- Error Rate: < 0.1%
- CPU Usage: < 80%
- Memory Usage: < 85%
- Disk Usage: < 90% 