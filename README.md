# LogSense

LogSense is a full-stack Smart Log Analyzer & Anomaly Detector built for the technical assessment. It stores application logs, uses a deterministic anomaly-detection algorithm to flag unusual entries, persists the findings, and uses AI only to explain already-detected anomalies.

## Assessment Coverage

- Log ingestion and MySQL persistence
- Timestamp, source IP, event type, severity, endpoint, HTTP method and status code
- Deterministic anomaly detection with a 0–100 score
- Persisted anomaly reason and severity
- Security Alerts / anomaly list
- Anomaly detail view
- AI-generated plain-English explanation
- AI-generated likely root cause
- AI-generated recommended next step
- Search and filters
- Create, view and delete logs
- Validation for timestamps, IP addresses, status codes and severity
- Empty-state handling
- Deployment-ready frontend and backend

## Architecture

```text
React + Vite
    |
    | REST / JSON
    v
Node.js + Express
    |
    +--> Anomaly Detection Engine
    |       |
    |       +--> anomaly score + reason
    |
    +--> OpenAI (only after anomaly is detected)
    |
    v
MySQL / Aiven
    |
    +--> logs
    +--> anomalies
    +--> ai_analysis
```

The AI does not determine whether a log is anomalous. The application algorithm makes that decision first. AI receives the flagged log, score and deterministic reason and generates the explanation, root cause and next step.

## Anomaly Detection Approach

The detector uses explainable weighted rules:

- HTTP 5xx response: +40
- HTTP 4xx response: +20
- SQL injection pattern: +55
- XSS pattern: +55
- Sensitive/admin endpoint: +20
- CRITICAL log severity: +35
- ERROR log severity: +25
- WARNING log severity: +10
- DELETE request to an admin endpoint: +20

The score is capped at 100.

Severity:
- 0–29: normal / not persisted
- 30–39: LOW
- 40–59: MEDIUM
- 60–79: HIGH
- 80–100: CRITICAL

The reason is persisted with the anomaly so the result is auditable and explainable.

## AI Configuration

The backend keeps the AI API key server-side.

Set these environment variables on Render:

```text
GEMINI_API_KEY=your_key
GEMINI_MODEL=gpt-4.1-mini
```

Do not put `GEMINI_API_KEY` in the React frontend or commit it to GitHub.

The backend calls the AI only for an anomaly that has already been created by the detector.

## Database Setup

For a fresh database, run:

```text
database/schema.sql
```

For the already deployed LogSense database where the `logs` table already exists, run:

```text
database/migration_anomalies.sql
```

The deployed schema uses `http_method` for the HTTP method column and does not require `response_time`.

## Backend

```bash
cd server
npm install
npm start
```

Required variables:

```text
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
DB_PORT
OPENAI_API_KEY
OPENAI_MODEL
```

The server uses Render's `PORT` automatically and falls back to 5000 locally.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

For deployment, set:

```text
VITE_API_URL=https://your-backend.onrender.com/api
```

If the variable is absent, the current deployed LogSense backend URL is used as a fallback.

## Important API Endpoints

```text
GET    /api/health
GET    /api/logs
POST   /api/logs
GET    /api/logs/:id
DELETE /api/logs/:id

GET    /api/logs/stats
GET    /api/logs/alerts

GET    /api/logs/anomalies/:id
POST   /api/logs/anomalies/:id/analyze
```

## Assumptions

- A log is considered unusual when its deterministic score reaches 30 or higher.
- Security-oriented patterns are intentionally weighted more heavily than ordinary HTTP errors.
- AI output is advisory and should not replace human incident response.
- Existing logs are backfilled into the anomaly table when Security Alerts is opened.

## Limitations

- The detector is rule-based rather than statistical or ML-based.
- IP frequency/time-window anomaly detection is not currently implemented.
- AI analysis requires a valid OpenAI API key and network access.
- AI-generated root cause and remediation are recommendations and should be verified by an engineer.
- No authentication/authorization layer is included because it was outside the assessment's core requirements.

## Deployment

### Backend on Render

Root directory:

```text
server
```

Build command:

```text
npm install
```

Start command:

```text
npm start
```

Add the database variables and `GEMINI_API_KEY`.

### Frontend on Render

Root directory:

```text
frontend
```

Build command:

```text
npm install && npm run build
```

Publish directory:

```text
dist
```

Set:

```text
VITE_API_URL=https://logsense-backend-o3dn.onrender.com/api
```

## Project Structure

```text
LogSense/
├── database/
│   ├── schema.sql
│   └── migration_anomalies.sql
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       │   └── anomalyDetector.js
│       └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── AlertCenter.jsx
        │   ├── LogForm.jsx
        │   └── LogTable.jsx
        ├── services/
        ├── App.jsx
        └── App.css
```
