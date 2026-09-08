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
| Node.js + Express | Backend |
| MongoDB | Database |
| Firebase Authentication | Authentication |
| Firebase Cloud Messaging | Push notifications |
| Google Maps Platform | Maps and location |
| Socket.IO | Real time tracking |
| Cloudinary | Image storage |
| Gemini API | AI urgency triage |

## Project Structure

```text
animal-rescue-app/
├── mobile/
├── backend/
├── .env.example
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Git
- Expo
- MongoDB
- Firebase project
- Google Maps API access
- Cloudinary account
- Gemini API access

### Backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and add the required credentials.

Start the backend using the script defined in `backend/package.json`.

### Mobile

```bash
cd mobile
npm install
npx expo start
```

The application can be tested on an Android device using Expo Go during development.

## Environment Variables

Keep API keys, database credentials, Firebase configuration, and other secrets in environment variables.

Do not commit real credentials to GitHub.

## Team

- Ridhi Kumari
- Nidhi Sharma

## Mentor

Rohit Gupta Sir
