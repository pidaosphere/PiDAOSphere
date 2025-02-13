# PiDAOSphere API Reference

## API Overview

Base URL: `https://api.pidaosphere.com/v1`

### Authentication
All API requests require a JWT token in the header:
```
Authorization: Bearer <token>
```

### Response Format
All responses are in JSON format:
```json
{
    "status": "success",
    "data": {
        // Response data
    }
}
```

## API Endpoints

### Authentication

#### Pi Network Authentication
`POST /auth/pi`

Request Body:
```json
{
    "accessToken": "string"
}
```

Response:
```json
{
    "status": "success",
    "data": {
        "user": {
            "id": "string",
            "username": "string",
            "isPiHolder": boolean
        },
        "token": "string"
    }
}
```

### Projects

#### Get Project List
`GET /projects`

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Project status (optional)
- `category`: Project category (optional)

Response:
```json
{
    "status": "success",
    "data": {
        "projects": [
            {
                "id": "string",
                "name": "string",
                "description": "string",
                "status": "string",
                "totalSupply": "number",
                "currentPrice": "number",
                "startTime": "date",
                "endTime": "date",
                "creator": "string"
            }
        ],
        "total": "number",
        "page": "number",
        "limit": "number"
    }
}
```

#### Create Project
`POST /projects`

Request Body:
```json
{
    "name": "string",
    "description": "string",
    "totalSupply": "number",
    "initialPrice": "number",
    "duration": "number",
    "minInvestment": "number",
    "maxInvestment": "number"
}
```

### Investments

#### Create Investment
`POST /investments`

Request Body:
```json
{
    "projectId": "string",
    "amount": "number",
    "paymentId": "string"
}
```

#### Get Investment History
`GET /investments/history`

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `projectId`: Filter by project (optional)

Response:
```json
{
    "status": "success",
    "data": {
        "investments": [
            {
                "id": "string",
                "projectId": "string",
                "amount": "number",
                "tokenAmount": "number",
                "status": "string",
                "timestamp": "date"
            }
        ],
        "total": "number",
        "page": "number",
        "limit": "number"
    }
}
```

### Proposals

#### Create Proposal
`POST /proposals`

Request Body:
```json
{
    "title": "string",
    "description": "string",
    "votingPeriod": "number"
}
```

#### Get Proposal List
`GET /proposals`

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Proposal status (optional)

Response:
```json
{
    "status": "success",
    "data": {
        "proposals": [
            {
                "id": "string",
                "title": "string",
                "description": "string",
                "creator": "string",
                "status": "string",
                "startTime": "date",
                "endTime": "date",
                "forVotes": "number",
                "againstVotes": "number"
            }
        ],
        "total": "number",
        "page": "number",
        "limit": "number"
    }
}
```

#### Cast Vote
`POST /proposals/:id/vote`

Request Body:
```json
{
    "support": "boolean"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid parameters |
| 401  | Unauthorized - Authentication required |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |

### Rate Limiting
- Default rate limit: 100 requests per hour
- Rate limits are applied per IP address and API key
- Rate limit headers are included in all responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Webhook

### Event Notification
```http
POST {your_webhook_url}
```

Supported event types:
- `project.created`
- `investment.completed`
- `proposal.created`
- `vote.cast`
- `liquidity.added`
- `liquidity.removed`

Event format:
```json
{
    "event": "string",
    "timestamp": "date",
    "data": {}
}
``` 