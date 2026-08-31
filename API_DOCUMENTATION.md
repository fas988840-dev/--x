# FactLedger API Documentation

**Base URL** (Post-Deployment): `https://factledger-api.fly.dev/api/v1`

**Authentication**: Optional via `X-API-Key` header

---

## Quick Start

```bash
# Health check
curl https://factledger-api.fly.dev/api/v1/health

# Wallet analysis
curl https://factledger-api.fly.dev/api/v1/wallet/9B5X4oQCnHdkF7C3m7G2nP5q8R1s2T3u4V5w6X7y8Z

# Transaction analysis
curl https://factledger-api.fly.dev/api/v1/transaction/2Xk5vN8q9M3p7R6s4T2u5V8w9X3y6Z2a1b5c8d9e
```

---

## Endpoints

### System

#### GET `/health`
Server health status.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-31T12:00:00Z",
  "uptime": 3600,
  "rpcConnected": true
}
```

#### GET `/version`
API version and build info.

**Response**:
```json
{
  "version": "1.0.0",
  "commit": "abc123...",
  "buildDate": "2026-08-31T12:00:00Z",
  "nodeVersion": "v18.0.0"
}
```

---

### Wallet Analysis

#### GET `/wallet/:address`
Complete wallet intelligence report.

**Parameters**:
- `address` (string, required): Solana wallet address

**Response**:
```json
{
  "address": "9B5X4oQCnHdkF7C3m7G2nP5q8R1s2T3u4V5w6X7y8Z",
  "behavior": {
    "transactionCount": 42,
    "successRate": 0.95,
    "activityDiversity": 0.78,
    "volumeUSD": "125000.50",
    "peakActivityHour": 14
  },
  "intelligence": {
    "score": 72,
    "activity": 75,
    "sophistication": 68,
    "consistency": 70,
    "efficiency": 75,
    "factors": ["High success rate", "Moderate volume", "Diverse programs"],
    "reasoning": "Experienced trader with consistent, efficient behavior"
  },
  "risk": {
    "score": 28,
    "level": "low",
    "factors": ["Low failure rate", "Normal frequency", "Diversified activity"],
    "reasoning": "No significant risk indicators detected"
  },
  "alerts": [
    {
      "type": "high_activity",
      "severity": "info",
      "message": "Wallet has above-average transaction volume"
    }
  ],
  "lastAnalyzed": "2026-08-31T12:00:00Z",
  "disclaimer": "This analysis is not financial advice."
}
```

#### GET `/wallet/:address/behavior`
Behavioral metrics only.

**Response**:
```json
{
  "transactionCount": 42,
  "successRate": 0.95,
  "failureRate": 0.05,
  "activityDiversity": 0.78,
  "volumeUSD": "125000.50",
  "peakActivityHour": 14,
  "averageTransactionSize": "2976.19",
  "accountCreationTime": "2025-01-15T10:30:00Z",
  "daysSinceFirstTx": 231,
  "daysSinceLastTx": 1
}
```

#### GET `/wallet/:address/risk`
Risk assessment score.

**Response**:
```json
{
  "score": 28,
  "level": "low",
  "factors": {
    "failureRate": { "value": 0.05, "weight": 0.25, "impact": "low" },
    "frequency": { "value": 0.18, "weight": 0.25, "impact": "low" },
    "concentration": { "value": 0.12, "weight": 0.25, "impact": "low" },
    "volatility": { "value": 0.08, "weight": 0.15, "impact": "minimal" },
    "suspiciousPatterns": { "value": 0, "weight": 0.10, "impact": "none" }
  },
  "reasoning": "Low activity concentration and high success rate indicate legitimate usage",
  "disclaimer": "This analysis is not financial advice."
}
```

#### GET `/wallet/:address/intelligence`
Intelligence score (activity, sophistication, consistency, efficiency).

**Response**:
```json
{
  "score": 72,
  "components": {
    "activity": 75,
    "sophistication": 68,
    "consistency": 70,
    "efficiency": 75
  },
  "factors": [
    "High transaction success rate (95%)",
    "Moderate program diversity",
    "Consistent daily activity",
    "Efficient gas usage"
  ],
  "reasoning": "Experienced trader demonstrating competent, consistent on-chain behavior",
  "disclaimer": "This analysis is not financial advice."
}
```

#### GET `/wallet/:address/alerts`
Alert evaluation (one-shot).

**Query Parameters**:
- `limit` (number): Max results (default 10, max 100)

**Response**:
```json
{
  "address": "9B5X4oQCnHdkF7C3m7G2nP5q8R1s2T3u4V5w6X7y8Z",
  "alerts": [
    {
      "type": "high_activity",
      "severity": "info",
      "timestamp": "2026-08-31T12:00:00Z",
      "message": "Above-average transaction frequency detected",
      "evidence": {
        "transactionCount": 42,
        "averageForSimilarWallets": 18
      }
    }
  ],
  "evaluatedAt": "2026-08-31T12:00:00Z"
}
```

#### GET `/wallet/:address/alerts/stream`
Live alert stream (Server-Sent Events).

**Response** (streaming):
```
event: alert
data: {"type":"new_transaction","signature":"...","program":"Raydium"}

event: alert
data: {"type":"high_failure_rate","severity":"warning","message":"..."}
```

#### GET `/wallet/:address/evidence`
Transaction evidence with DEX detection confidence.

**Query Parameters**:
- `limit` (number): Max transactions (default 10, max 100)
- `offset` (number): Pagination offset

**Response**:
```json
{
  "address": "9B5X4oQCnHdkF7C3m7G2nP5q8R1s2T3u4V5w6X7y8Z",
  "entries": [
    {
      "signature": "2Xk5vN8q9M3p7R6s4T2u5V8w9X3y6Z2a1b5c8d9e",
      "slot": 242000000,
      "blockTime": "2026-08-31T11:50:00Z",
      "status": "success",
      "instructions": [
        {
          "program": "Raydium AMM V4",
          "confidence": "candidate",
          "confidencePercent": 50,
          "description": "Swap instruction (unverified account layout)"
        }
      ]
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0
  }
}
```

#### GET `/wallet/:address/research`
Full research report (intelligence + risk + alerts).

**Response**: Combined response from intelligence, risk, and alerts endpoints.

#### GET `/wallet/:address/explanation`
AI-generated plain-English explanation (requires ChainGPT API key).

**Response**:
```json
{
  "wallet": "9B5X4oQCnHdkF7C3m7G2nP5q8R1s2T3u4V5w6X7y8Z",
  "summary": "This wallet belongs to an experienced trader...",
  "summarySource": "chaingpt",
  "keyActivities": ["Swap execution", "Token transfers", "Liquidity provision"],
  "riskAssessment": "Low risk based on behavioral patterns",
  "patterns": ["Regular trading schedule", "High success rate", "Diversified protocols"],
  "generatedAt": "2026-08-31T12:00:00Z"
}
```

---

### Transaction Analysis

#### GET `/transaction/:signature`
Single transaction details.

**Parameters**:
- `signature` (string, required): Transaction signature

**Response**:
```json
{
  "signature": "2Xk5vN8q9M3p7R6s4T2u5V8w9X3y6Z2a1b5c8d9e",
  "slot": 242000000,
  "blockTime": "2026-08-31T11:50:00Z",
  "status": "success",
  "fee": "5000",
  "wallet": "9B5X4oQCnHdkF7C3m7G2nP5q8R1s2T3u4V5w6X7y8Z",
  "instructions": [
    {
      "index": 0,
      "program": "Raydium AMM V4",
      "confidence": "candidate",
      "data": { /* decoded instruction data */ }
    }
  ],
  "tokenBalanceChanges": [
    {
      "mint": "EPjFWdd5...",
      "owner": "9B5X4oQCnHdkF7C3m7G2nP5q8R1s2T3u4V5w6X7y8Z",
      "preBalance": "1000000",
      "postBalance": "500000",
      "change": "-500000"
    }
  ]
}
```

#### GET `/transaction/:signature/instructions`
Decoded instructions only.

---

## Rate Limiting

- **General**: 60 requests / 15 minutes per IP
- **RPC-heavy** (wallet/transaction): 20 requests / 15 minutes per IP
- **With API key**: 10x higher limits

**Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1693476000
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid wallet address",
  "code": "VALIDATION_ERROR",
  "details": "Address must be 44 characters"
}
```

### 404 Not Found
```json
{
  "error": "Transaction not found",
  "code": "NOT_FOUND"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 900
}
```

### 500 Server Error
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "requestId": "req-abc123..."
}
```

---

## Authentication (Optional)

Set `X-API-Key` header to increase rate limits:

```bash
curl -H "X-API-Key: your-key-here" https://factledger-api.fly.dev/api/v1/health
```

---

## CORS

Default CORS policy allows all origins (`*`). For production, set `CORS_ORIGIN` env var:

```bash
CORS_ORIGIN=https://yourdomain.com,https://anotherdomain.com
```

---

## Changelog

### v1.0.0 (2026-08-31)
- Initial release
- 12 REST endpoints
- Raydium + Jupiter detection (candidate status)
- Risk & intelligence scoring
- Alert evaluation
- Transaction evidence
- Rate limiting
- Security hardening (Helmet, CORS)

---

## Support

- Issues: https://github.com/fas988840-dev/PROJECT-x/issues
- Email: fas988840@gmail.com
- Twitter: @aamm123220

---

**Base URL**: https://factledger-api.fly.dev/api/v1  
**OpenAPI/Swagger**: `/api/v1/docs` (if enabled)
