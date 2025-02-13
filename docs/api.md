# PiDAOSphere API Documentation

## Authentication

### Pi Network Authentication

```http
POST /auth/pi
```

Request body:
```json
{
    "accessToken": "string"
}
```

Response:
```json
{
    "user": {
        "username": "string",
        "accessToken": "string"
    }
}
```

## Projects

### Create Project

```http
POST /projects
```

Request headers:
```
Authorization: Bearer <token>
```

Request body:
```json
{
    "name": "string",
    "description": "string",
    "totalSupply": "number",
    "initialPrice": "number",
    "duration": "number",
    "minInvestment": "number",
    "maxInvestment": "number",
    "inviteOnly": "boolean",
    "inviteCode": "string?"
}
```

Response:
```json
{
    "projectId": "string",
    "status": "string",
    "timestamp": "string"
}
```

### List Projects

```http
GET /projects
```

Query parameters:
- `status`: Filter by project status
- `page`: Page number
- `limit`: Items per page

Response:
```json
{
    "projects": [
        {
            "id": "string",
            "name": "string",
            "description": "string",
            "status": "string",
            "totalSupply": "number",
            "currentPrice": "number",
            "totalInvestment": "number",
            "totalInvestors": "number",
            "startTime": "string",
            "endTime": "string"
        }
    ],
    "pagination": {
        "total": "number",
        "page": "number",
        "pages": "number"
    }
}
```

### Get Project Details

```http
GET /projects/:id
```

Response:
```json
{
    "id": "string",
    "name": "string",
    "description": "string",
    "status": "string",
    "totalSupply": "number",
    "currentPrice": "number",
    "totalInvestment": "number",
    "totalInvestors": "number",
    "startTime": "string",
    "endTime": "string",
    "minInvestment": "number",
    "maxInvestment": "number",
    "inviteOnly": "boolean"
}
```

## Investments

### Create Investment

```http
POST /investments
```

Request headers:
```
Authorization: Bearer <token>
```

Request body:
```json
{
    "projectId": "string",
    "amount": "number",
    "paymentId": "string",
    "inviteCode": "string?"
}
```

Response:
```json
{
    "transactionId": "string",
    "status": "string",
    "tokenAmount": "number"
}
```

### Get Investment History

```http
GET /investments/history
```

Request headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
    "investments": [
        {
            "projectId": "string",
            "amount": "number",
            "tokenAmount": "number",
            "status": "string",
            "timestamp": "string"
        }
    ]
}
```

## Proposals

### Create Proposal

```http
POST /proposals
```

Request headers:
```
Authorization: Bearer <token>
```

Request body:
```json
{
    "title": "string",
    "description": "string",
    "votingPeriod": "number",
    "executionData": "string"
}
```

Response:
```json
{
    "proposalId": "string",
    "status": "string",
    "startTime": "string",
    "endTime": "string"
}
```

### List Proposals

```http
GET /proposals
```

Query parameters:
- `status`: Filter by proposal status
- `page`: Page number
- `limit`: Items per page

Response:
```json
{
    "proposals": [
        {
            "id": "string",
            "title": "string",
            "description": "string",
            "creator": "string",
            "status": "string",
            "forVotes": "number",
            "againstVotes": "number",
            "startTime": "string",
            "endTime": "string"
        }
    ],
    "pagination": {
        "total": "number",
        "page": "number",
        "pages": "number"
    }
}
```

### Cast Vote

```http
POST /proposals/:id/vote
```

Request headers:
```
Authorization: Bearer <token>
```

Request body:
```json
{
    "support": "boolean"
}
```

Response:
```json
{
    "success": "boolean",
    "votingPower": "number",
    "proposalStatus": "string"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
    "error": "string",
    "message": "string"
}
```

### 401 Unauthorized
```json
{
    "error": "Unauthorized",
    "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
    "error": "Forbidden",
    "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
    "error": "Not Found",
    "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
    "error": "Internal Server Error",
    "message": "An unexpected error occurred"
}
```

## Rate Limiting

API requests are limited to:
- 100 requests per minute for authenticated endpoints
- 500 requests per minute for public endpoints

Rate limit headers:
```
X-RateLimit-Limit: <number>
X-RateLimit-Remaining: <number>
X-RateLimit-Reset: <timestamp>
```

## Websocket API

### Connection

```javascript
const ws = new WebSocket('wss://api.pidaosphere.com/ws');
```

### Subscribe to Project Updates

```json
{
    "type": "subscribe",
    "channel": "project",
    "projectId": "string"
}
```

### Subscribe to Proposal Updates

```json
{
    "type": "subscribe",
    "channel": "proposal",
    "proposalId": "string"
}
```

### Event Types

1. Project Updates:
```json
{
    "type": "project_update",
    "projectId": "string",
    "data": {
        "currentPrice": "number",
        "totalInvestment": "number",
        "totalInvestors": "number"
    }
}
```

2. Proposal Updates:
```json
{
    "type": "proposal_update",
    "proposalId": "string",
    "data": {
        "forVotes": "number",
        "againstVotes": "number",
        "status": "string"
    }
}
``` 