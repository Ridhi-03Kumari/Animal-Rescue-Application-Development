# Animal Rescue Backend

Backend for the Animal Emergency Rescue and Smart Response App (Node.js, Express, MongoDB).

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values:
   ```
   cp .env.example .env
   ```

3. Start the server:
   ```
   npm start        # or: npm run dev  (auto-restarts on changes)
   ```

4. Check it's alive:
   ```
   GET http://localhost:5000/api/v1/health
   ```

## Running without MongoDB (demo mode)

You do **not** need MongoDB to run the app. If the database in `MONGO_URI` can't be reached, the
server starts in demo mode:

- Data lives in memory and is saved to `data/dev-store.json`, so **accounts, reports and rescued-animal
  records survive a restart**. Delete that file to start fresh.
- `DEV_STORE_PERSIST=false` turns saving off; `DEV_STORE_FILE=/some/path.json` moves the file.
- Every endpoint works in this mode.

To use a real database instead, point `MONGO_URI` at a MongoDB server or Atlas cluster and restart.

### Demo accounts

Without a database (demo mode), password `password123`:

| Role     | Phone        |
|----------|--------------|
| Citizen  | `9876543210` |
| Rescuer  | `9845012345` |

With MongoDB, after `npm run seed`, password `rescuer123`:

| Role        | Phone                                  |
|-------------|----------------------------------------|
| Citizen     | `9888888888`                           |
| Rescuer     | `9876543210` (also `…211`, `…212`, `…213`) |
| Coordinator | `9999999999`                           |

`GET /api/v1/health` reports `"database": "mongodb"` or `"demo"`, and the app's **Fill Demo** buttons use it to pick the right accounts.
With a real database a rescuer must be logged in to accept or decline a case (otherwise the API answers 401).

## Using it from a phone

The mobile app finds this server automatically: it is loaded from `http://<your PC>:8081`, so it talks to
`http://<your PC>:5000`. Keep the PC and phone on the same Wi-Fi and allow Node through the firewall.

## Endpoints (`/api/v1`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | - | Service status |
| POST | `/auth/register`, `/auth/login` | - | Create account / sign in (returns a token) |
| POST | `/reports` | optional | Submit an emergency report (`animalType`, `latitude`, `longitude`, optional `address`, optional `clientRequestId`). Sending the same `clientRequestId` again returns the first case instead of creating a duplicate. A request with no `clientRequestId` (older app build) is matched by sender + animal + description + place (within 100 m) over the last 5 minutes while that case is still open |
| GET | `/cases` | token | Your own cases, newest first (`?status=`): a citizen's reports, a rescuer's assigned cases, everything for a coordinator / admin |
| GET | `/cases/:id` | optional | One case (so a guest can follow the report they sent) |
| GET | `/cases/my-reports` | token | The signed-in citizen's reports |
| PATCH | `/cases/:id/status` | rescuer / coordinator / admin | Move a case forward (only the assigned rescuer; no skipping Accept, no going back); `completed` creates the animal record + QR |
| POST | `/dispatch/:id/accept`, `/dispatch/:id/decline` | rescuer | Rescuer responds to an alert (one rescue at a time, only their own cases) |
| GET | `/dispatch/active`, `/dispatch/nearby` | rescuer | The rescuer's active case / alerts sent to them plus unassigned open cases |
| GET/POST | `/rescuers/profile` | rescuer | The rescuer's own profile |
| PATCH | `/rescuers/availability`, `/rescuers/location` | rescuer | Online/busy and position |
| GET | `/rescuers` | coordinator / admin | List rescuers (`?available=`, `?animalType=`) |
| GET | `/animals`, `/animals/:id`, `/animals/case/:caseId`, `/animals/qr/:id` | optional / public | Animal health records and collar QR lookup |
| GET | `/contacts` | - | Bengaluru helplines and shelters |
| POST | `/triage` | - | AI urgency assessment |
| GET/POST/PATCH | `/coordinator/...` | coordinator | Stats, escalated cases, manual assignment, rescuer verification |

Requests send the token as `Authorization: Bearer <token>`.

### Who can do what

- **Guest / citizen:** report an animal, follow their own reports, see helplines, look up an animal by QR.
- **Rescuer:** everything under `/dispatch` and `/rescuers`, and status changes on the cases assigned to them. A citizen account gets `403` on these routes.
- **Coordinator / admin:** the `/coordinator` routes and every case. These accounts cannot be created through public sign-up (only `citizen` and `rescuer` can); create them with `npm run seed`.

## Tests

```
npm test
```

Runs dispatch scoring, AI triage, QR codes, contacts, demo-mode saving/rescuer/coordinator routes, and a full
end-to-end rescue lifecycle.

## Folder structure

```
src/
  config/       -> DB connection, JWT secret
  models/       -> Mongoose schemas
  controllers/  -> Route logic (each has an in-memory fallback for demo mode)
  middleware/   -> Auth + error handling
  routes/       -> API route definitions
  services/     -> Dispatch scoring, AI triage, notifications
  utils/        -> Distance maths, demo-mode data store (devStore.js)
data/           -> Saved demo-mode data (git-ignored)
```
