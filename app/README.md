# TSF FMEA Web Application (MVP)

## Run
1. Open terminal in `f:\01 cursor`.
2. Start server:
   - `node app/server.js`
3. Open:
   - `http://localhost:8080`

## What Is Included
- Role-aware API guards (`viewer`, `editor`, `approver`, `admin`) via `x-role` header.
- Facility and versioned session model with workflow states:
  - Draft -> In Review -> Approved -> Superseded
- FMEA item register with core fields:
  - asset hierarchy, loading conditions, failure mechanism, initiating event, controls, detection methods, references
  - S/O/D scoring with automatic RPN and residual RPN
- Recommended action capture per FMEA item.
- Traceability matrix endpoint (`/api/traceability`).
- Immutable-style audit event append log (stored in JSON datastore).

## API Endpoints
- `GET /api/bootstrap`
- `GET /api/health`
- `POST /api/facilities`
- `POST /api/sessions`
- `PATCH /api/sessions/:id/state`
- `POST /api/items`
- `PATCH /api/items/:id`
- `DELETE /api/items/:id`
- `POST /api/items/:id/actions`
- `GET /api/traceability`

## Data Storage
- Data file: `app/data/store.json`
- The data file auto-initializes with TSF seed data on first run.

## Notes
- This implementation is dependency-free (Node core modules only) to run in environments without `npm`.
- For production, migrate storage to PostgreSQL, add real auth/SSO, CSRF/session protection, stronger validation, and approval-signature controls.
