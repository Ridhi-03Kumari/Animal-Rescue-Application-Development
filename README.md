# Animal Emergency Rescue and Smart Response App

A mobile application for reporting injured animals and connecting each case with a suitable available rescuer.

The first version is focused on Bengaluru, India.

## Overview

When someone finds an injured animal, it can be difficult to find the right person to contact and know whether help is coming.

This application brings animal reporting, responder matching, rescue tracking, and animal records into one system.

A citizen can submit a rescue request with a photo, GPS location, animal type, and optional description. The system performs an initial AI based urgency assessment, selects a suitable responder, and sends the case alert.

Once the responder accepts the case, the citizen can follow the rescue and receive status updates. After the rescue is completed, an animal profile can be created with relevant rescue and medical information.

## Main Features

- Injured animal reporting with photo and GPS
- Guest reporting
- AI based urgency triage
- Smart responder matching
- Push notifications
- Automatic case escalation
- Live rescue tracking
- Rescue status updates
- Digital animal profiles
- QR linked animal records
- Offline emergency contacts
- Role based access

## Smart Responder Matching

Before selecting a responder, the system checks:

- Animal type capability
- Current availability
- Existing active case

The matching score uses:

| Factor | Weight |
|---|---:|
| Proximity | 40% |
| Availability | 30% |
| Animal type capability | 20% |
| Past response rate | 10% |

AI urgency is not included in the responder matching score.

## AI Urgency Triage

Gemini is used for the initial urgency assessment.

It returns:

- LOW
- MEDIUM
- HIGH

The AI can provide short and safe guidance while the user waits for help.

It is not used to diagnose diseases, recommend medicines, or predict recovery or survival.

If the Gemini request fails or takes more than 5 seconds, MEDIUM is used as the fallback and a manual urgency option is provided.

## Case Escalation

If a responder does not take the case:

1. Rescuer 1 is contacted.
2. If the responder declines, the case moves to the next suitable responder.
3. If there is no response for 5 minutes, the next responder is contacted.
4. The system can try up to 3 responders.
5. If all attempts fail, the case is sent to an emergency coordinator for manual intervention.

## Live Rescue Tracking

After accepting a case, the responder's location can be shared with the citizen during the active rescue.

Socket.IO is used for real time communication, with location updates approximately every 5 seconds.

The rescue status can include:

- On the way
- Reached location
- Animal picked up
- At shelter or vet
- Treatment started
- Case complete

## Animal Digital Profile

After a completed rescue, a permanent animal profile can be created with:

- Animal type
- Photos
- Found location
- Rescue date
- Identifying markings
- Medical notes
- Treatment information
- Current status
- QR code

The QR code can be used to access the animal's previous information if the same animal is found again.

## User Roles

### Citizen

Can report injured animals, submit photos and locations, track accepted rescues, view status updates, and access emergency contacts.

### Rescuer

Can receive rescue requests, accept or decline cases, manage availability, navigate to the animal, update rescue status, add medical notes, and complete cases.

### Admin / Coordinator

Supports rescuer approval and handles cases requiring manual intervention.

## Technology Stack

| Technology | Purpose |
|---|---|
| React Native + Expo | Mobile application |
| Node.js + Express | Backend REST API & Realtime Server |
| MongoDB / DevStore Fallback | Database with offline memory fallback |
| JWT Authentication | Token-based authentication with bcrypt hashing |
| Firebase Cloud Messaging | Push notifications for rescuers |
| Google Maps Platform | Maps, geolocation and routing |
| Socket.IO | Real-time live rescue tracking |
| Cloudinary | Cloud image storage for animal photos |
| Gemini API | AI urgency triage (with offline heuristic fallback) |

## Project Structure

```text
Animal-Rescue-Application-Development/
├── animal-rescue-backend/       # Express.js REST API & Socket.IO server
│   ├── src/                     # Controllers, models, routes, middleware, services
│   ├── tests/                   # Automated backend test suites
│   ├── .env.example             # Backend environment variable template
│   └── package.json
├── mobile/                      # React Native / Expo application
│   ├── src/                     # Screens (Citizen, Rescuer, Coordinator), services, navigation
│   ├── app.config.js            # Dynamic Expo config for Maps API key
│   ├── .env.example             # Mobile environment variable template
│   └── package.json
├── .gitignore                   # Root repository ignore rules
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- Git
- Expo CLI
- MongoDB (optional; defaults to in-memory JSON dev store when offline)
- Cloudinary account (required for production image uploads)
- Firebase project (for push notifications)
- Google Maps API key (optional; app falls back to GPS coordinate view)
- Gemini API key (optional; app falls back to offline rule-based triage)

### Backend Setup

```bash
cd animal-rescue-backend
npm install
```

Create `.env` using `.env.example` as a template:

```bash
cp .env.example .env
```

Start the backend:

```bash
# Development (with nodemon)
npm run dev

# Or standard production start
npm start
```

### Running Tests

The backend includes a comprehensive test suite covering authentication, rate limiting, dispatch scoring, AI triage, QR codes, upload validation, devStore fallback, and end-to-end simulation:

```bash
cd animal-rescue-backend
npm test
```

### Mobile Setup

```bash
cd mobile
npm install
npx expo start
```

The application can be tested on an Android or iOS device using Expo Go, in an emulator, or in a web browser during development.

### Google Maps Platform Setup (Phase 7)

1. **Google Cloud Console**: Enable **Maps SDK for Android** and **Maps SDK for iOS**.
2. **API Key Restrictions**: Restrict the mobile key by Application Identity (Android Package Name `com.animalrescue.bengaluru` and SHA-1 certificate fingerprint) and API restrictions (Maps SDK only).
3. **Configuration**: Add `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<your_key>` in `mobile/.env`.
4. **Build Requirements**: Native Google Maps rendering on physical devices requires an Expo Development Build (`npx expo run:android` / `npx expo run:ios` or EAS Build). In Expo Go or Web environments without native Google Maps binaries, the app automatically runs in a resilient fallback mode displaying satellite coordinates, distances, and external navigation links without crashing.

### Coordinator / Admin Mobile Experience (Phase 8)

The application includes an integrated Coordinator & Admin role experience inside the single mobile client:

1. **Role-Based Navigation**: Authenticated users with role `coordinator` or `admin` are automatically routed to the coordinator workspace (`CoordinatorHome`, `EscalatedCases`, `ActiveCases`, `CoordinatorCaseDetail`, `RescuerSelection`, `CoordinatorRescuers`, `CoordinatorProfile`).
2. **Operational Dashboard**: Realtime system overview displaying total cases, cases needing intervention, ongoing active rescues, completed count, available field rescuers, and quick-action navigation.
3. **Escalated Cases Management**: Infinite-scrolling paginated list of cases escalated after maximum failed auto-dispatch attempts or response timeouts, sorted deterministically by urgency.
4. **Manual Rescuer Assignment**: Emergency coordinator can inspect nearby qualified rescuers, check availability status and animal capabilities, and dispatch a specific responder directly via `POST /api/v1/coordinator/cases/:id/assign` with realtime socket alert and push notification dispatch.
5. **Active Rescues & Live Map**: Complete visibility into ongoing rescue missions, rendering case locations and responder movement in realtime via the shared `RescueMapView` and Socket.IO connection.
6. **Robust RBAC Security**: Server-enforced role authentication guards all coordinator endpoints against unauthorized citizen and rescuer access with HTTP 403.

### Adoption Module & Validation Hardening (Phase 9)

Phase 9 completes the final core functional gaps identified in the PRD audit:

1. **Backend-Backed Adoption System**:
   - `Adoption` model supporting sheltered and recovered animal listings with status (`available`, `pending`, `adopted`), species, breed, age, gender, size, medical summary, photos, and temperament.
   - REST endpoints (`/api/v1/adoptions`): public paginated listing with species filter, listing detail, staff creation (`POST`), staff modification (`PATCH`), and admin removal (`DELETE`).
   - Adoption application submission (`POST /api/v1/adoptions/:id/requests`) with validation, duplicate checks, and prohibition of requests on already-adopted animals.
   - Connected `AdoptionScreen.js` to live backend APIs with pull-to-refresh, species category filters, loading indicators, and error recovery.
2. **Backend Validation Audit**:
   - Malformed ObjectId protection across case, animal, and adoption lookup endpoints.
   - Strict lifecycle transition validation: completed and cancelled cases are permanently shielded from accidental or unauthorized transition back into active rescue states.
   - Comprehensive query pagination clamping and bounds checks.
3. **Secure Account Recovery Flow**:
   - Endpoints: `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`.
   - Security features: Cryptographically secure 64-hex tokens (SHA-256 hashed at rest), 15-minute expiration, single-use invalidation, rate limiting (`authLimiter`), and generic enumeration-resistant response messaging.
   - External SMS/email gateway delivery remains an external infrastructure prerequisite (in development/test environments, secure verification tokens are returned in the response payload).

### Known Limitations & Deployment Notes

- **Password Recovery Delivery**: The backend implements secure 15-minute, single-use, SHA-256 hashed password reset tokens. In development and test environments, the token is returned in the API response. Production deployment requires wiring an external SMS or WhatsApp gateway (e.g. Twilio, MSG91) to dispatch reset tokens to citizens' mobile numbers.
- **Render Free Tier Hosting**: Web services on Render's free tier sleep after 15 minutes of inactivity and incur a ~30 second cold start on first request.
- **Persistent Storage**: Render instances have an ephemeral file system. Production deployments must configure Cloudinary credentials for permanent photo storage.
- **Google Maps Key**: Native map rendering requires a Google Cloud API key restricted to the package name `com.animalrescue.bengaluru`. Without a key, the app gracefully falls back to displaying numerical coordinates, distance calculations, and external navigation links.

## Environment Variables

Keep API keys, database credentials, Firebase configuration, and other secrets in environment variables.

Do not commit real credentials to GitHub.

## Team

- Ridhi Kumari
- Nidhi Sharma

## Mentor

Rohit Gupta Sir
