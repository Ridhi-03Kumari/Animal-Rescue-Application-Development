# Animal Rescue Backend

Backend for the Animal Emergency Rescue and Smart Response App (Node.js, Express, MongoDB).

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in real values:
   ```
   cp .env.example .env
   ```

3. Run in development (auto-restarts on changes):
   ```
   npm run dev
   ```

4. Check it's alive:
   ```
   GET http://localhost:5000/api/v1/health
   ```

## Current endpoints

- `POST /api/v1/auth/register` — body: `{ name, phone, password, role }` (role: `citizen` or `rescuer`)
- `POST /api/v1/auth/login` — body: `{ phone, password }`

## Folder structure

```
src/
  config/       -> DB connection
  models/       -> Mongoose schemas
  controllers/  -> Route logic
  middleware/   -> Auth + error handling
  routes/       -> API route definitions
```
