# Study Guide: Animal Emergency Rescue App (Bengaluru)

Yeh guide aapke apne project ko andar se samajhne ke liye hai. Har hissa **pehle Hinglish mein**, phir **English mein** hai.
This guide is for understanding your own project from the inside. Every part comes **first in Hinglish**, then **in English**.

Jo bhi yahan likha hai woh asli code padhkar likha gaya hai (backend aur mobile dono), aur backend ke tests chalakar check kiya gaya hai: 6 test files, sab pass.
Everything here was written by reading the real code (backend and mobile), and the backend tests were run to check it: 6 test files, all passing.

---

## Contents

0. [Is guide ko kaise padhein / How to read this guide](#0-is-guide-ko-kaise-padhein--how-to-read-this-guide)
1. [Project kya hai / What the project is](#1-project-kya-hai--what-the-project-is)
2. [Badi tasveer / The big picture](#2-badi-tasveer--the-big-picture)
3. [Folder ka naksha / Folder map](#3-folder-ka-naksha--folder-map)
4. [Teen kirdaar / The three roles](#4-teen-kirdaar--the-three-roles)
5. [Poori kahani, minute by minute / The full story, minute by minute](#5-poori-kahani-minute-by-minute--the-full-story-minute-by-minute)
6. [Rescuer chunne ka hisaab / How the best rescuer is chosen](#6-rescuer-chunne-ka-hisaab--how-the-best-rescuer-is-chosen)
7. [AI urgency check / The AI urgency check](#7-ai-urgency-check--the-ai-urgency-check)
8. [Backend ek-ek file / Backend, file by file](#8-backend-ek-ek-file--backend-file-by-file)
9. [Mobile app ek-ek file / Mobile app, file by file](#9-mobile-app-ek-ek-file--mobile-app-file-by-file)
10. [Demo mode: bina database ke / Demo mode: without a database](#10-demo-mode-bina-database-ke--demo-mode-without-a-database)
11. [Kya asli hai, kya abhi adhura / What is real, what is unfinished](#11-kya-asli-hai-kya-abhi-adhura--what-is-real-what-is-unfinished)
12. [Chalane ka tareeka / How to run it](#12-chalane-ka-tareeka--how-to-run-it)
13. [Mentor pooche to / If your mentor asks](#13-mentor-pooche-to--if-your-mentor-asks)
14. [Chhota shabdkosh / Small glossary](#14-chhota-shabdkosh--small-glossary)

---

## 0. Is guide ko kaise padhein / How to read this guide

### Hinglish mein

- Agar bilkul naye ho: section 1, 2, 4 padho, phir seedha **section 5** (poori kahani). Wahi project ka dil hai.
- Agar code samajhna hai: section 8 aur 9 mein har file ka kaam likha hai.
- Agar presentation ya viva hai: section 11 (kya adhura hai) aur section 13 (sawaal-jawaab) zaroor padho. Imaandari se bataya hua adhura kaam, chhupaye hue adhure kaam se hamesha behtar lagta hai.
- Kahani mein **"exact"** likha ho to woh number code se aaya hai (jaise 5 second, 6 second). **"Example"** likha ho to woh sirf samajhane ke liye hai (jaise insaan ko form bharne mein kitna time lagega).

### In English

- If you are brand new: read sections 1, 2 and 4, then jump to **section 5** (the full story). That is the heart of the project.
- If you want to understand the code: sections 8 and 9 describe what every file does.
- If you have a presentation or viva: read section 11 (what is unfinished) and section 13 (questions and answers). Honestly stated gaps always look better than hidden ones.
- When the story says **"exact"**, the number comes from the code (like 5 seconds, 6 seconds). When it says **"example"**, it is only for understanding (like how long a person takes to fill a form).

---

## 1. Project kya hai / What the project is

### Hinglish mein

Socho aap Bengaluru ki sadak par ho aur ek kutta ghayal pada hai. Aapko nahi pata kise phone karein. Phone kar bhi do to pata nahi chalta ki koi aa raha hai ya nahi.

Yeh app is problem ko ek jagah hal karta hai. Poora kaam 6 aasaan kadam mein hota hai:

1. **Aap report karte ho:** photo, GPS location, jaanwar ka type, aur thoda sa likha hua description.
2. **Server** (woh computer jo saara kaam sambhalta hai) ek AI se poochta hai ki case kitna urgent hai: LOW, MEDIUM ya HIGH.
3. **Server sabse sahi rescuer dhoondta hai:** jo paas ho, free ho, aur us jaanwar ko sambhal sake.
4. **Rescuer ke phone par alert aata hai.** Rescuer Accept ya Decline karta hai.
5. **Aap app mein dekh sakte ho** ki rescue kahan tak pahuncha (On the way, Reached, Picked up...).
6. **Rescue khatam hone par** jaanwar ka ek permanent record (health profile) aur ek **QR code** ban jata hai. Agar yahi jaanwar dobara mile to QR scan karke uski purani history dekh sakte hain.

Pehla version sirf **Bengaluru** ke liye hai. Team: Ridhi Kumari aur Nidhi Sharma. Mentor: Rohit Gupta Sir.

### In English

Imagine you are on a Bengaluru road and a dog is lying injured. You do not know whom to call. Even if you call, you cannot tell whether anyone is coming.

This app solves that in one place, in 6 simple steps:

1. **You report:** a photo, GPS location, the animal type, and a short description.
2. The **server** (the computer that does all the work behind the screen) asks an AI how urgent the case is: LOW, MEDIUM or HIGH.
3. **The server finds the best rescuer:** one who is nearby, free, and able to handle that animal.
4. **The rescuer's phone gets an alert.** The rescuer taps Accept or Decline.
5. **You can follow progress in the app** (On the way, Reached, Picked up...).
6. **When the rescue ends,** a permanent animal record (health profile) and a **QR code** are created. If the same animal is found again, scanning the QR shows its history.

The first version is for **Bengaluru** only. Team: Ridhi Kumari and Nidhi Sharma. Mentor: Rohit Gupta Sir.

---

## 2. Badi tasveer / The big picture

### Hinglish mein

Project ke do bade hisse hain, jaise ek restaurant ke do hisse:

- **`mobile/`** = restaurant ka **dining hall**. Yahan user dikhta hai: screens, buttons, photos. Yeh React Native + Expo se bana hai, aur phone par chalta hai.
- **`animal-rescue-backend/`** = restaurant ki **kitchen**. Yahan asli kaam hota hai: login check karna, AI se poochna, rescuer chunna, data save karna. Yeh Node.js + Express se bana hai.

Phone aur kitchen ke beech baat **API** ke through hoti hai. API matlab: phone ek sawaal bhejta hai (jaise "mujhe saare cases do"), server jawaab deta hai. Phone ko kitchen ka andar ka kaam dekhna nahi padta.

### In English

The project has two big parts, like two parts of a restaurant:

- **`mobile/`** = the **dining hall**. This is what the user sees: screens, buttons, photos. Built with React Native + Expo, runs on the phone.
- **`animal-rescue-backend/`** = the **kitchen**. This is where the real work happens: checking logins, asking the AI, choosing a rescuer, saving data. Built with Node.js + Express.

The phone and the kitchen talk through an **API**. An API is simply: the phone sends a question ("give me all the cases") and the server sends back an answer. The phone never needs to see how the kitchen works.

```
  CITIZEN PHONE                                          RESCUER PHONE
  (mobile app)                                           (same mobile app,
       |                                                  rescuer screens)
       |  "yeh jaanwar ghayal hai"                              ^
       v                                                        | "naya alert / status update"
 +--------------------------------------------------------------+
 |             SERVER  (animal-rescue-backend, port 5000)        |
 |                                                              |
 |   login check --> AI urgency --> best rescuer score          |
 |   --> alert (abhi console mein print) --> 5 min timer        |
 |   --> case ka timeline --> animal record + QR                |
 +-----------------------+--------------------------------------+
                         |
                         v
        MongoDB (asli database)   YA   dev-store.json (demo mode)
```

---

## 3. Folder ka naksha / Folder map

### Hinglish mein

Har folder ka ek kaam hai. Yeh naksha yaad rakhoge to koi bhi file dhoondna aasaan hoga.

### In English

Every folder has one job. If you remember this map, finding any file becomes easy.

```
Animal-Rescue-Application-Development/
|-- README.md                      project ka parichay (plan + features)
|-- study.md                       yeh file
|
|-- animal-rescue-backend/         KITCHEN (server)
|   |-- server.js                  server ko chalu karne wali pehli file
|   |-- package.json               kaun si libraries chahiye + commands (start, test, seed)
|   |-- .env.example               secret settings ka namuna (asli .env git mein nahi jaata)
|   |-- data/dev-store.json        demo mode ka saved data (khud banta hai, git mein nahi)
|   |-- public/uploads/            upload ki hui photos yahan rakhi jati hain
|   |-- scripts/seedRescuers.js    database mein nakli rescuers bharne ki script
|   |-- src/
|   |   |-- app.js                 sab raaste (routes) jodta hai
|   |   |-- socket.js              live (real-time) baat-cheet ka system
|   |   |-- config/                db.js (database se jodna), jwt.js (login ka secret)
|   |   |-- middleware/            auth.js (login guard), errorHandler.js, upload.js
|   |   |-- routes/                10 files: kaun sa address kis controller ko jata hai
|   |   |-- controllers/           8 files: har address ka asli kaam
|   |   |-- services/              dispatchService, aiTriageService, notificationService
|   |   |-- models/                5 files: data ka dhancha (User, Rescuer, Case, Animal, Escalation)
|   |   |-- utils/                 devStore.js (demo memory), distance.js (doori ka hisaab)
|   |   `-- data/                  emergencyContacts.js (Bengaluru ke helpline numbers)
|   `-- tests/                     6 test files + runAllTests.js
|
`-- mobile/                        DINING HALL (phone app)
    |-- index.js                   app ki entry
    |-- App.js                     fonts load karta hai, navigation chalu karta hai
    |-- app.json, package.json     app ki settings aur libraries
    |-- assets/                    photos aur icons
    `-- src/
        |-- navigation/RootNavigator.js    sab 15 screens ka rasta
        |-- screens/shared/                Welcome, Auth
        |-- screens/citizen/               7 screens
        |-- screens/rescuer/               6 screens
        |-- components/                    baar-baar use hone wale tukde (button, header...)
        |-- services/                      api.js, storage.js, location.js, mockTriage.js
        |-- data/adoptablePets.js          adoption ke liye sample jaanwar
        |-- theme.js                       rang, fonts, button sizes
        `-- responsive.js                  alag-alag screen size ke liye naap
```

---

## 4. Teen kirdaar / The three roles

### Hinglish mein

| Kirdaar | Kaun hai | App mein kya kar sakta hai |
|---|---|---|
| **Citizen** | Koi bhi aam insaan jise ghayal jaanwar mila | Report karna, apna case track karna, emergency numbers dekhna, pet adopt karne ki request daalna. **Login zaroori nahi**: guest bhi report kar sakta hai. |
| **Rescuer** | NGO ya volunteer jo jaanwar bachata hai | Alert dekhna, Accept/Decline, Online/Busy badalna, status aage badhana, medical notes likhna, rescue complete karna, QR dekhna |
| **Coordinator / Admin** | Control room ka insaan | Jo case kisi ne nahi liya use haath se kisi ko dena, rescuer ko approve/reject karna, stats dekhna. **Yeh hissa abhi sirf server par hai**, mobile app mein iski screen nahi hai (section 11 dekho). |

### In English

| Role | Who they are | What they can do in the app |
|---|---|---|
| **Citizen** | Any ordinary person who found an injured animal | Report, track their case, see emergency numbers, send a pet adoption request. **Login is not required**: a guest can report too. |
| **Rescuer** | An NGO or volunteer who saves animals | See alerts, Accept/Decline, switch Online/Busy, move the status forward, write medical notes, complete the rescue, view the QR |
| **Coordinator / Admin** | Someone in the control room | Hand a stuck case to a rescuer manually, approve/reject rescuers, view stats. **This part exists only on the server for now**; the mobile app has no screen for it (see section 11). |

---

## 5. Poori kahani, minute by minute / The full story, minute by minute

### Hinglish mein

Ek example lete hain. **Ananya** (demo citizen) shaam ko Indiranagar ki 100 Feet Road par ek ghayal kutta dekhti hai. **Rajesh** (demo rescuer) Bengaluru Animal Rescue Squad ka hai. Hum dekhenge ki har second kya hota hai.

Dhyan do: **insaan ke time** (jaise "30 second form bharna") sirf example hain. **Machine ke time** jahan "exact" likha hai, woh code mein likhe hain.

### In English

Let us follow one example. **Ananya** (the demo citizen) sees an injured dog on 100 Feet Road, Indiranagar in the evening. **Rajesh** (the demo rescuer) belongs to Bengaluru Animal Rescue Squad. We will see what happens at every moment.

Note: **human times** (like "30 seconds to fill the form") are only examples. **Machine times** marked "exact" are written in the code.

---

### Minute 0:00. App khulti hai / The app opens

**Hinglish mein**

1. `mobile/index.js` Expo ko bolta hai: "App.js se shuru karo".
2. `App.js` do fonts load karta hai: **Cormorant SC** (heading ke liye) aur **Caveat** (haath se likhe jaise subtitle ke liye).
3. Jab tak fonts nahi aate, ek chhota gola (spinner) ghoomta hai. Isse text pehle galat font mein dikhkar badalta nahi (flash nahi hota).
4. Agar font load fail ho jaye to app rukti nahi, system ka font use kar leti hai.
5. Phir `RootNavigator` khulta hai. Yeh ek "rasta-batane wala" hai: 15 screens ki list rakhta hai aur batata hai ki kaun si screen kab dikhani hai. Pehli screen **Welcome**.

**In English**

1. `mobile/index.js` tells Expo: "start from App.js".
2. `App.js` loads two fonts: **Cormorant SC** (for headings) and **Caveat** (for handwriting-style subtitles).
3. Until the fonts arrive, a small spinner turns. This stops text from first showing in the wrong font and then changing (no flash).
4. If a font fails to load, the app does not get stuck; it uses the system font.
5. Then `RootNavigator` opens. It is like a signpost: it holds the list of 15 screens and decides which one shows when. The first screen is **Welcome**.

---

### Minute 0:10. Welcome screen / Welcome screen

**Hinglish mein**

Welcome screen par ek painted dog-aur-kitten ki tasveer hai aur teen button:

| Button | Kahan le jata hai |
|---|---|
| **Sign In / Create Profile** | Auth screen (login ya naya account) |
| **I am a Citizen** | Seedha CitizenHome, **bina login ke** |
| **I am a Rescuer / Volunteer** | Login screen (rescuer chuna hua). **Rescuer ke screens sirf login ke baad khulte hain.** |

Matlab emergency mein koi account banane mein time waste na kare. Ananya chahe to login kar sakti hai, ya seedha "I am a Citizen" dabakar report kar sakti hai. Lekin rescuer ka darwaza bina login ke band hai.

**Dhyan do (role ka niyam):** app mein ab do alag "taraf" hain. Guest ya citizen ko sirf **citizen ke screens** milte hain, aur rescuer ko sirf **rescuer ke screens**. Citizen ke andar "Rescuer Portal" naam ka koi tab nahi hai. Rescuer login karte hi uski apni side khulti hai. Dusri side par jaane ke liye pehle **Sign out** karna padta hai. Yeh sirf screen chhupana nahi hai: server bhi har rescuer-wale raaste par role check karta hai (citizen ko `403` milta hai).

**In English**

The Welcome screen shows a painted illustration of a dog and a kitten and three buttons:

| Button | Where it goes |
|---|---|
| **Sign In / Create Profile** | The Auth screen (login or new account) |
| **I am a Citizen** | Straight to CitizenHome, **without login** |
| **I am a Rescuer / Volunteer** | The login screen (rescuer pre-selected). **Rescuer screens open only after login.** |

The idea: in an emergency nobody should waste time creating an account. Ananya can log in, or tap "I am a Citizen" and report right away. The rescuer door, however, is closed without a login.

**Note (the role rule):** the app now has two separate "sides". A guest or citizen gets only the **citizen screens**, and a rescuer gets only the **rescuer screens**. There is no "Rescuer Portal" tab inside the citizen side. A rescuer who logs in lands on their own side, and has to **Sign out** to use the other one. This is not just hiding screens: the server also checks the role on every rescuer route (a citizen gets `403`).

---

### Minute 0:20. Login ya Sign up (agar Ananya karna chahe) / Login or sign up (if Ananya chooses)

**Hinglish mein**

**Phone par (AuthScreen):**

1. Do tab hain: **Sign In** aur **Create Account**. Role chuno: Citizen ya Rescuer.
2. Fields: phone, password. Naya account ho to naam bhi. Rescuer ho to organization ka naam (optional) aur kaun se jaanwar sambhal sakta hai (dog, cat, cattle, bird, wildlife; kam se kam ek hamesha selected rehta hai).
3. Do chhote button hain, **Fill Demo Citizen** aur **Fill Demo Rescuer**, jo demo phone/password khud bhar dete hain. Pehle app server ke `/health` se poochti hai ki woh demo mode mein hai ya MongoDB se juda hai, aur usi hisaab se sahi account bharti hai.
4. Submit dabane par pehle check hota hai ki phone aur password khali to nahi (naya account ho to naam bhi).
5. Phir `api.login` ya `api.register` server ko bulata hai.

**Server par (`authController.js`):**

*Register karte waqt:*
1. name, phone, password, role chahiye. Role sirf citizen / rescuer / coordinator / admin mein se ho sakta hai.
2. Phone ke aas-paas ki khali jagah hata di jati hai (`trim`).
3. Agar yeh phone pehle se hai to "already exists" ka error.
4. Password ko seedha save **nahi** karte. `bcrypt` use karke uska "hash" banate hain: ek aisi garbled string jisse wapas asli password nahi nikal sakta. Isse agar data leak bhi ho jaye to log asli password nahi dekh paate.
5. User save hota hai. Agar role rescuer hai to saath mein ek **Rescuer profile** bhi banti hai: default organization "Independent Rescuer", default jaanwar dog aur cat, default location central Bengaluru (12.9716, 77.5946).
6. Ek **token** (JWT) banta hai. Isme user ki id aur role hoti hai, aur yeh **7 din** tak chalta hai (`JWT_EXPIRES_IN` se badal sakte ho). Token ek "entry pass" jaisa hai: phone ise har agle sawaal ke saath dikhata hai.

*Login karte waqt:*
1. Phone se user dhoondta hai, phir `bcrypt.compare` se password match karta hai.
2. Galat phone ho ya galat password, dono mein **ek hi message** aata hai: "Invalid phone or password". Isse koi andaza nahi laga sakta ki kaunsa galat tha.

**Wapas phone par:** token `AsyncStorage` mein `user_token` naam se, aur user ki details `user_profile` naam se save hoti hain. Phir app ka "session" (kaun login hai) badal jata hai, aur app **apne aap** role ki apni side khol deti hai: citizen ko `CitizenHome`, rescuer ko `RescuerHome`. Us side mein dusri side ke screens maujood hi nahi hote, isliye back dabane par login screen par wapas nahi jaate. Ek aur niyam: agar aap "Rescuer" chunkar citizen account se login karo (ya ulta), to login **nahi hota** aur message aata hai "This is a citizen account. Choose Citizen above". App band-chalu karne par bhi login yaad rehta hai (`SessionContext`), aur 7 din baad token expire hone par app khud Sign out kar deti hai.

**In English**

**On the phone (AuthScreen):**

1. Two tabs: **Sign In** and **Create Account**. Pick a role: Citizen or Rescuer.
2. Fields: phone, password. For a new account, also name. For a rescuer, also the organization name (optional) and which animals they can handle (dog, cat, cattle, bird, wildlife; at least one always stays selected).
3. Two small buttons, **Fill Demo Citizen** and **Fill Demo Rescuer**, fill in the demo phone and password for you. The app first asks the server's `/health` whether it is in demo mode or connected to MongoDB, and fills the matching account.
4. On submit, it first checks that phone and password are not empty (and name, for a new account).
5. Then `api.login` or `api.register` calls the server.

**On the server (`authController.js`):**

*When registering:*
1. It needs name, phone, password and role. Role must be one of citizen / rescuer / coordinator / admin.
2. Spaces around the phone number are removed (`trim`).
3. If this phone already exists, it returns an "already exists" error.
4. The password is **not** saved as it is. `bcrypt` turns it into a "hash": a scrambled string from which the real password cannot be recovered. So even if the data leaks, people cannot see real passwords.
5. The user is saved. If the role is rescuer, a **Rescuer profile** is also created: default organization "Independent Rescuer", default animals dog and cat, default location central Bengaluru (12.9716, 77.5946).
6. A **token** (JWT) is made. It holds the user's id and role and lasts **7 days** (changeable with `JWT_EXPIRES_IN`). A token is like an entry pass: the phone shows it with every later request.

*When logging in:*
1. It finds the user by phone, then checks the password with `bcrypt.compare`.
2. A wrong phone and a wrong password give the **same message**: "Invalid phone or password". Nobody can guess which one was wrong.

**Back on the phone:** the token is saved in `AsyncStorage` under `user_token`, and the user's details under `user_profile`. Then the app's "session" (who is logged in) changes, and the app **opens that role's own side by itself**: `CitizenHome` for a citizen, `RescuerHome` for a rescuer. The screens of the other side do not exist in that side, so pressing Back does not return to the login screen. One more rule: if you pick "Rescuer" but log in with a citizen account (or the reverse), the login is **refused** with "This is a citizen account. Choose Citizen above". The login is remembered when the app restarts (`SessionContext`), and when the 7-day token expires the app signs out by itself.

---

### Minute 0:40. Citizen Home / Citizen Home

**Hinglish mein**

CitizenHome par:

- Upar "Hello, Ananya Sharma" (naam `user_profile` se aata hai; login nahi hai to "Hello, Citizen").
- Ek bada narangi **"Report Emergency Now"** button.
- Do chhote card: **My Reports** aur **Emergency Contacts**.
- Ek **Adopt a Pet** card.
- Neeche **Your Recent Reports**: sirf **aapki apni** pehli 3 reports. Login ho to server se (`api.getMyReports`), guest ho to is phone mein saved reports (unka live status server se). Har card par status ka badge asli stage dikhata hai: *FINDING A RESCUER*, *RESCUER ACCEPTED*, *ON THE WAY*, *REACHED*, *PICKED UP*, *AT SHELTER / VET*, *COMPLETED*, *CANCELLED*.
- Neeche kheenchne par (pull to refresh) list dobara aati hai.

**In English**

On CitizenHome:

- At the top "Hello, Ananya Sharma" (the name comes from `user_profile`; if not logged in, "Hello, Citizen").
- A big orange **"Report Emergency Now"** button.
- Two small cards: **My Reports** and **Emergency Contacts**.
- An **Adopt a Pet** card.
- Below, **Your Recent Reports**: only **your own** first 3 reports. When logged in they come from the server (`api.getMyReports`); as a guest they come from this phone (with live status from the server). Each card's badge shows the real stage: *FINDING A RESCUER*, *RESCUER ACCEPTED*, *ON THE WAY*, *REACHED*, *PICKED UP*, *AT SHELTER / VET*, *COMPLETED*, *CANCELLED*.
- Pulling the list down refreshes it.

---

### Minute 1:00. Report form bharna / Filling the report form

**Hinglish mein**

Ananya "Report Emergency Now" dabati hai. `ReportEmergencyScreen` khulta hai. Yahan chaar cheezein hoti hain:

1. **Photo.** Photo box dabane par pehle phone se *permission* maangi jati hai. Mil jaye to **gallery** khulti hai (camera nahi; code mein `launchImageLibraryAsync` hai), photo crop karne ka option hota hai, aur quality 0.8 rakhi jati hai.
2. **Animal type.** Chips: Dog, Cat, Cow, Bird, Monkey, Other.
3. **Description** (optional): jaise "left hind leg se khoon aa raha hai".
4. **Location.** "Get my current location" dabane par:
   - Pehle location ki permission maangi jati hai.
   - Phir check hota hai ki phone ka GPS on hai ya nahi. Off ho to saaf message: "GPS is switched off".
   - Phir `getCurrentCoordinates()` GPS se sahi jagah nikalta hai (high accuracy). GPS ko lock hone mein **15 second tak** intezaar karta hai (exact). Na mile to phone ki **last known jagah** use karta hai.
   - Phir `reverseGeocode()` coordinates (jaise 12.9784, 77.6408) ko padhne layak address mein badalta hai (jaise "100 Feet Rd, Indiranagar, Bengaluru"). Pehle phone ka apna geocoder try hota hai, na chale to **OpenStreetMap (Nominatim)** se poochta hai.
   - Agar sab fail ho to ek button aata hai **"central Bengaluru use karo"** (approximate jagah), taaki desktop browser par testing bhi ho sake.

**In English**

Ananya taps "Report Emergency Now". `ReportEmergencyScreen` opens. Four things happen here:

1. **Photo.** Tapping the photo box first asks the phone for *permission*. If granted, the **gallery** opens (not the camera; the code uses `launchImageLibraryAsync`), with a crop option and quality set to 0.8.
2. **Animal type.** Chips: Dog, Cat, Cow, Bird, Monkey, Other.
3. **Description** (optional): like "bleeding from the left hind leg".
4. **Location.** Tapping "Get my current location":
   - First it asks for location permission.
   - Then it checks that the phone's GPS is on. If off, a clear message: "GPS is switched off".
   - Then `getCurrentCoordinates()` reads the exact spot from GPS (high accuracy). It waits up to **15 seconds** for the GPS to lock (exact). If it cannot, it uses the phone's **last known position**.
   - Then `reverseGeocode()` turns coordinates (like 12.9784, 77.6408) into a readable address (like "100 Feet Rd, Indiranagar, Bengaluru"). It tries the phone's own geocoder first, and if that does not work, asks **OpenStreetMap (Nominatim)**.
   - If everything fails, a button appears: **"use central Bengaluru"** (an approximate spot), so testing on a desktop browser also works.

---

### Minute 1:30. Submit dabana / Pressing Submit

**Hinglish mein**

`submitReport` pehle teen cheezein check karta hai. Koi bhi kam ho to alert aata hai aur aage nahi badhta:

- photo nahi? "Please add a photo".
- animal type nahi? "Please select the animal type".
- location nahi? "Please allow location access".

Sab theek ho to:

1. Saved `user_profile` se naam aur phone nikalta hai (guest ho to "Citizen Reporter" aur khali phone).
2. `api.submitReport(...)` server ko `POST /reports` bhejta hai. Isme: animalType, description, photoUrl, latitude, longitude, address, reporterName, reporterPhone.

**api.js ka `request()` har sawaal ke saath yeh karta hai:**

- Pehle dekhta hai ki abhi-abhi server "offline" to nahi nikla tha. Agar pichhle **5 second** mein offline nikla tha to naya sawaal bheje bina turant error de deta hai (taaki har call apna alag timeout na jhele).
- `AsyncStorage` se token nikalkar `Authorization: Bearer <token>` header laga deta hai.
- Sawaal ko **6 second** (exact) ka timer deta hai. 6 second mein jawaab na aaye to rok deta hai.
- Server ne error diya to uska likha hua message dikhata hai. Network hi na mile to saaf message: "Cannot reach the server. Make sure the backend is running and your phone is on the same Wi-Fi".

**Server ka address phone ko kaise pata chalta hai?** App PC se `http://<PC ka IP>:8081` par load hoti hai. `api.js` yeh IP wahin se padh leta hai aur backend ke liye `http://<wahi IP>:5000/api/v1` banata hai. Isse Wi-Fi badalne par bhi kaam chalta hai. Na mile to `10.110.153.199` fallback hai. Chaho to `EXPO_PUBLIC_API_URL` se pura address khud de sakte ho.

**In English**

`submitReport` first checks three things. If any is missing, an alert shows and it stops:

- no photo? "Please add a photo".
- no animal type? "Please select the animal type".
- no location? "Please allow location access".

If all is fine:

1. It reads the name and phone from the saved `user_profile` (for a guest: "Citizen Reporter" and an empty phone).
2. `api.submitReport(...)` sends `POST /reports` to the server with: animalType, description, photoUrl, latitude, longitude, address, reporterName, reporterPhone.

**What `request()` in api.js does with every call:**

- It first checks whether the server was found "offline" a moment ago. If it was found offline in the last **5 seconds**, it fails immediately without sending (so every call does not wait for its own timeout).
- It takes the token from `AsyncStorage` and adds the header `Authorization: Bearer <token>`.
- It sets a **6-second** timer (exact). If no answer comes in 6 seconds, the call is stopped.
- If the server returns an error, its message is shown. If there is no network at all, a clear message: "Cannot reach the server. Make sure the backend is running and your phone is on the same Wi-Fi".

**How does the phone know the server's address?** The app loads from the PC at `http://<PC's IP>:8081`. `api.js` reads that IP from there and builds `http://<same IP>:5000/api/v1` for the backend. So it keeps working when the Wi-Fi changes. If that fails, `10.110.153.199` is the fallback. You can also give the full address with `EXPO_PUBLIC_API_URL`.

---

### Minute 1:31. Server report ko sambhalta hai / The server handles the report

**Hinglish mein**

Sawaal server tak pahunchta hai. Yeh sab kuch hi milliseconds mein hota hai (AI wala hissa chhodkar):

| Kadam | Kya hota hai | Kaun si file |
|---|---|---|
| 1 | `app.js` ke "darwaze" sawaal ko padhne layak banate hain: `cors` (kisi bhi phone/website ko baat karne deta hai), `express.json` (bheja hua data samajhta hai, 10 MB tak) | `src/app.js` |
| 2 | Address `/api/v1/reports` hai, to `routes/reports.js` use `optionalProtect` guard se guzarta hai. Token hai aur sahi hai to user pehchan liya jata hai. Token nahi ya galat ho to **guest** maana jata hai, report phir bhi chalti hai. | `middleware/auth.js` |
| 3 | `reportController.createReport` check karta hai ki animalType, latitude, longitude teeno aaye hain. Nahi to **400 error** aur saaf message. | `controllers/reportController.js` |
| 4 | Agar phone ne khud valid urgency (LOW/MEDIUM/HIGH) nahi bheji, to **AI se poochta hai** (section 7). | `services/aiTriageService.js` |
| 5 | Ek **Case** banta hai: animalType chhote akshar mein, location (lat, long, address), urgency, status **`reported`**, aur **timeline** ki pehli entry: "Emergency rescue reported. AI Urgency: HIGH". | `controllers/reportController.js` |
| 6 | Case **save** hota hai: MongoDB connected hai to wahan; nahi to memory store mein (demo mode, section 10). | `utils/devStore.js` |
| 7 | **Sirf agar MongoDB connected hai**, to turant `dispatchService.dispatchCase` chalta hai: sabse sahi rescuer chunna (section 6). | `services/dispatchService.js` |
| 8 | Case ka poora roop (rescuer aur citizen ke naam ke saath) wapas nikalta hai. | `reportController.js` |
| 9 | Socket.IO se `case_created` event bhejta hai (jo sun raha ho use mil jata hai). | `socket.js` |
| 10 | **201** jawaab: success, case, `guidance` (AI ki safe salaah), aur dispatch ki jaankari. | `reportController.js` |

**In English**

The request reaches the server. All of this takes only a few milliseconds (except the AI part):

| Step | What happens | Which file |
|---|---|---|
| 1 | The "doors" in `app.js` make the request readable: `cors` (lets any phone/website talk to the server), `express.json` (understands the data sent, up to 10 MB) | `src/app.js` |
| 2 | The address is `/api/v1/reports`, so `routes/reports.js` passes it through the `optionalProtect` guard. If a valid token is present, the user is recognised. If the token is missing or wrong, the user is treated as a **guest** and the report still works. | `middleware/auth.js` |
| 3 | `reportController.createReport` checks that animalType, latitude and longitude all arrived. If not, a **400 error** with a clear message. | `controllers/reportController.js` |
| 4 | If the phone did not send a valid urgency (LOW/MEDIUM/HIGH), it **asks the AI** (section 7). | `services/aiTriageService.js` |
| 5 | A **Case** is built: animalType in lowercase, location (lat, long, address), urgency, status **`reported`**, and the first **timeline** entry: "Emergency rescue reported. AI Urgency: HIGH". | `controllers/reportController.js` |
| 6 | The case is **saved**: in MongoDB if connected, otherwise in the memory store (demo mode, section 10). | `utils/devStore.js` |
| 7 | **Only if MongoDB is connected**, `dispatchService.dispatchCase` runs right away to choose the best rescuer (section 6). | `services/dispatchService.js` |
| 8 | The full case (with rescuer and citizen names) is read back. | `reportController.js` |
| 9 | A `case_created` event goes out through Socket.IO (anyone listening gets it). | `socket.js` |
| 10 | A **201** reply: success, the case, `guidance` (the AI's safe advice), and dispatch details. | `reportController.js` |

---

### Minute 1:35. "Report Submitted" screen / "Report Submitted" screen

**Hinglish mein**

Phone ko jawaab mil gaya. Ab:

1. Report phone ki apni memory (`AsyncStorage`, key `@animal_rescue_reports`) mein bhi save hoti hai, status "In Progress" ke saath. Isi se **My Reports** screen bharti hai.
2. `ReportSubmittedScreen` khulta hai: hara tick, "Report Submitted", "Finding a suitable rescuer", aur ek **AI Urgency Assessment** card jisme urgency (jaise HIGH) aur safe guidance dikhte hain, jaise *"Keep a safe distance. Do not move the animal unless in immediate road danger."*
3. **"View Case Tracking"** button Ananya ko live status wali screen par le jata hai.

**Agar server mila hi nahi** (Wi-Fi nahi, backend band, ya 30 second mein jawaab nahi): ab app jhoothi "Submitted" screen **nahi** dikhati. Ek saaf message aata hai "Report not sent" aur aap wahi form se dobara Submit kar sakte ho. Aisa isliye ki emergency mein insaan ko pata hona chahiye ki report sach mein gayi ya nahi.

**Duplicate kaise rokte hain:** har report form ke saath ek alag **key** (`clientRequestId`) jaati hai. Submit dabate hi button band ho jata hai ("Sending report..."). Phir bhi agar do request ek hi key ke saath pahunchen (double tap, ya slow net par retry), to server pehle wala case hi wapas deta hai, naya nahi banata. Report bhejne ka timeout 30 second hai, kyunki AI check aur rescuer dhoondne mein kuch second lagte hain.

**Purana app build (bina key ke):** agar phone par purana JavaScript bundle chal raha ho to key nahi aati. Tab server khud pehchanta hai: **wahi insaan + wahi janwar + wahi description + 100 meter ke andar + pichhle 5 minute mein + case abhi khula hai** to naya case nahi banta, pehla wapas milta hai. Ek hi insaan ki ek saath aayi requests server par ek-ek karke chalti hain, taaki do request ek saath check se na nikal jayein.

**In English**

The phone got its answer. Now:

1. The report is also saved in the phone's own memory (`AsyncStorage`, key `@animal_rescue_reports`) with status "In Progress". This is what fills the **My Reports** screen.
2. `ReportSubmittedScreen` opens: a green tick, "Report Submitted", "Finding a suitable rescuer", and an **AI Urgency Assessment** card showing the urgency (like HIGH) and safe guidance, such as *"Keep a safe distance. Do not move the animal unless in immediate road danger."*
3. The **"View Case Tracking"** button takes Ananya to the live status screen.

**If the server could not be reached at all** (no Wi-Fi, backend off, or no reply in 30 seconds): the app no longer shows a fake "Submitted" screen. It shows a clear "Report not sent" message and you can tap Submit again from the same form. This is because in an emergency a person must know whether the report really went.

**How duplicates are stopped:** every report form carries its own **key** (`clientRequestId`). The button locks as soon as it is tapped ("Sending report..."). Even so, if two requests with the same key reach the server (a double tap, or a retry on a slow connection), the server returns the first case instead of creating a new one. The report request waits up to 30 seconds, since the AI check and finding a rescuer take a few seconds.

**Older app build (no key):** if the phone is still running an old JavaScript bundle, no key is sent. The server then recognises a repeat itself: **same person + same animal + same description + within 100 m + in the last 5 minutes + the case is still open** returns the first case instead of creating a new one. Requests from the same sender are processed one at a time on the server, so two requests arriving together cannot both pass the check.

---

### Minute 1:40. Rescuer ke phone par alert / The alert on the rescuer's phone

**Hinglish mein**

Rajesh ne `RescuerHome` kholi hai. Yeh screen:

- Teen cheezein ek saath server se mangwati hai: `api.getNearbyCases()` (is rescuer ke alerts), `api.getActiveRescue()` (chalta hua rescue) aur `api.getRescuerProfile()` (Online/Busy). Isliye screen par wahi dikhta hai jo server ke paas hai.
- **"Incoming Emergency Alerts"** mein sirf woh cases aate hain jo **is rescuer ko bheje gaye** hain, ya jinhe abhi kisi ko diya hi nahi gaya. Kisi aur rescuer ko bheja hua case yahan nahi dikhta.
- Chalta hua rescue upar **"CURRENT ACTIVE RESCUE"** banner mein dikhta hai.
- **Duty status** ka switch hai: **Online** ya **Busy**. Server se padha jata hai, aur badalne par server se confirm hone ke baad hi badalta hai. Rescue ke dauran rescuer **Busy** rehta hai (switch band), aur complete karte hi server use wapas **Online** kar deta hai.
- Screen **har 8 second** mein apne aap refresh hoti hai.
- Server na mile to nakli alerts **nahi** dikhti. Saaf likha aata hai "Could not load alerts".

Har alert card par: urgency badge (HIGH laal, MEDIUM narangi, LOW hara), "Injured DOG", description, address, "Reported by Ananya Sharma", aur do button: **Decline** aur **Accept Rescue**. Card dabane par `RescueRequestScreen` (poori detail) khulta hai.

**In English**

Rajesh has opened `RescuerHome`. This screen:

- Asks the server for three things at once: `api.getNearbyCases()` (this rescuer's alerts), `api.getActiveRescue()` (the rescue in progress) and `api.getRescuerProfile()` (Online/Busy). So what is on screen is what the server has.
- **"Incoming Emergency Alerts"** lists only the cases **sent to this rescuer**, or cases nobody has been given yet. A case sent to a different rescuer does not show up here.
- A rescue in progress shows as the **"CURRENT ACTIVE RESCUE"** banner.
- Has a **Duty status** switch: **Online** or **Busy**. It is read from the server, and changing it only takes effect once the server confirms. During a rescue the rescuer stays **Busy** (the switch is locked), and the server sets them back to **Online** when they complete it.
- The screen **refreshes by itself every 8 seconds**.
- If the server cannot be reached, it does **not** show fake alerts; it says "Could not load alerts".

Each alert card shows: an urgency badge (HIGH red, MEDIUM orange, LOW green), "Injured DOG", the description, the address, "Reported by Ananya Sharma", and two buttons: **Decline** and **Accept Rescue**. Tapping the card opens `RescueRequestScreen` (full detail).

---

### Minute 2:00. Rajesh Accept karta hai / Rajesh accepts

**Hinglish mein**

`RescueRequestScreen` mein photo, species, address, citizen ka observation, reporter ka naam/phone, aur ek **"Smart Dispatch Match"** card hai (batata hai ki aapko kyun chuna gaya). Neeche do button: **Accept Emergency Rescue** aur **Decline & Pass to Next Rescuer**.

**Accept dabane par** phone `POST /dispatch/:id/accept` bhejta hai. Server do tarah se kaam karta hai:

*MongoDB wale mode mein (`handleRescuerAccept`):*
1. 5 minute wala escalation timer **band** kar deta hai (ab intezaar khatam).
2. Case ka status **`accepted`** karta hai aur timeline mein "Rescuer accepted the rescue assignment" likhta hai.
3. Rescuer ko **busy** kar deta hai: `available = false` aur `activeCaseId` = yeh case. Isse use koi aur case nahi milega.
4. Escalation log mein is koshish ko `accepted` mark karta hai.
5. Citizen ko notification bhejta hai ("Rescuer has accepted your request!").

*Demo mode mein:* case ka status `accepted` ho jata hai aur timeline mein entry judti hai. Agar rescuer logged in hai to uska `activeCaseId` bhi set hota hai. Do baar Accept dabane se koi nuksan nahi (dusri baar kuch naya nahi hota).

Phone par chahe server ka jawaab error ho, app phir bhi `ActiveRescue` screen khol deti hai (error sirf console mein likhta hai). Yeh demo ko smooth rakhne ke liye hai.

**Decline dabane par** `POST /dispatch/:id/decline` jata hai:
- MongoDB mode: escalation log mein `declined` likhta hai aur **turant agle sabse achhe rescuer** ko bhej deta hai (koshish number +1).
- Demo mode: case wapas `reported` ho jata hai aur kisi ko assigned nahi rehta.

**In English**

`RescueRequestScreen` shows the photo, species, address, the citizen's observation, reporter name/phone, and a **"Smart Dispatch Match"** card (explaining why you were picked). At the bottom, two buttons: **Accept Emergency Rescue** and **Decline & Pass to Next Rescuer**.

**Tapping Accept** sends `POST /dispatch/:id/accept`. The server works in two ways:

*In MongoDB mode (`handleRescuerAccept`):*
1. It **stops** the 5-minute escalation timer (the waiting is over).
2. It sets the case status to **`accepted`** and writes "Rescuer accepted the rescue assignment" to the timeline.
3. It marks the rescuer **busy**: `available = false` and `activeCaseId` = this case. So no other case will reach them.
4. It marks this attempt `accepted` in the escalation log.
5. It notifies the citizen ("Rescuer has accepted your request!").

*In demo mode:* the case status becomes `accepted` and a timeline entry is added. If the rescuer is logged in, their `activeCaseId` is set too. Pressing Accept twice does no harm (the second time changes nothing).

Even if the server's reply is an error, the app still opens the `ActiveRescue` screen (it only logs the error). This keeps the demo smooth.

**Tapping Decline** sends `POST /dispatch/:id/decline`:
- MongoDB mode: it writes `declined` in the escalation log and **immediately sends the case to the next best rescuer** (attempt number +1).
- Demo mode: the case goes back to `reported` with no assigned rescuer.

---

### Minute 2:10. Ananya ko status dikhta hai / Ananya sees the status

**Hinglish mein**

`CaseTrackingScreen` ek **timeline** dikhati hai, jisme 8 padav hain:

`Report Submitted` -> `Finding a Rescuer` -> `Rescuer Accepted` -> `On the Way` -> `Reached Location` -> `Animal Picked Up` -> `At Shelter / Vet` -> `Case Completed`

Jitne padav ho chuke hain woh hare tick ke saath bhare dikhte hain, baaki khali gole. Case ke status ko ek list mein dhoondkar index se tulna hoti hai ("aaj hum kitne number par hain, usse peeche wale sab hare").

Screen **har 6 second mein** (exact) server se case dobara mangwati hai (`setInterval`). Isi wajah se Rajesh status badalta hai aur kuch second mein Ananya ki screen apne aap badal jati hai. Screen band hone par yeh timer saaf ho jata hai.

Ek **"Assigned Rescuer"** card bhi hai: rescuer ka organization ka naam, aur accepted hone ke baad likha aata hai "Rescuer is active". Pehle likha hota hai "Matching best rescuer by proximity and animal capability...".

Dhyan: yahan **live map par rescuer ki gaadi** nahi dikhti. Server ka live-location system taiyar hai, par phone usse abhi jodta nahi (section 11).

**In English**

`CaseTrackingScreen` shows a **timeline** with 8 stages:

`Report Submitted` -> `Finding a Rescuer` -> `Rescuer Accepted` -> `On the Way` -> `Reached Location` -> `Animal Picked Up` -> `At Shelter / Vet` -> `Case Completed`

Stages already done are filled with a green tick; the rest are empty circles. The case status is looked up in an ordered list and compared by position ("we are at number N, so everything up to N is green").

The screen fetches the case again **every 6 seconds** (exact) with `setInterval`. That is why, when Rajesh changes the status, Ananya's screen updates by itself within a few seconds. The timer is cleared when the screen closes.

There is also an **"Assigned Rescuer"** card: it shows the rescuer's organization name, and after acceptance says "Rescuer is active". Before that it says "Matching best rescuer by proximity and animal capability...".

Note: there is **no live map with the rescuer moving** here. The server's live-location system is ready, but the phone does not connect to it yet (section 11).

---

### Minute 2:30 se aage. Rajesh status aage badhata hai / Rajesh moves the status forward

**Hinglish mein**

Rajesh ki `ActiveRescueScreen` par:

- Upar photo, reporter ka naam, **"Call Reporter"** button (phone ka dialer khulta hai), address, description.
- Ek **stepper** (seedhi): `Accepted -> On the Way -> Reached -> Picked Up -> At Shelter / Vet -> Completed`. Sirf **agle padav** ke saamne **"Advance"** button aata hai, taaki koi padav chhoote nahi. Agar case abhi sirf `assigned` hai (rescuer ne Accept nahi kiya), to stepper ki jagah **"Accept Rescue"** ka button dikhta hai. Server bhi yahi rule lagata hai: Accept ke bina progress nahi, peeche nahi jaa sakte, aur sirf wahi rescuer badal sakta hai jise case mila hai. Screen har 6 second mein server se apne aap refresh hoti hai.
- **Medical Notes** aur **Treatment** ke do box. Yahi likha hua aage jaanwar ke QR health profile mein jata hai.
- Neeche bada hara button **"Complete Rescue & Generate QR Profile"**.

Har "Advance" par `PATCH /cases/:id/status` jata hai. Server (`updateCaseStatus`):
1. Check karta hai ki status in dus mein se ek ho: reported, assigned, accepted, on_the_way, reached_location, animal_picked_up, at_shelter, treatment_started, completed, cancelled. Nahi to 400.
2. Case dhoondta hai. Nahi mila to 404.
3. Naya status lagata hai, medical notes aur treatment (agar diye ho), aur **timeline mein ek aur entry** (kya hua, kab, kisne).
4. Socket.IO se `case_status` event bhejta hai.
5. Citizen ko notification bhejta hai ("Case is now on_the_way").
6. Naya case wapas bhejta hai, jisse Rajesh ki screen turant badal jaye.

**In English**

On Rajesh's `ActiveRescueScreen`:

- At the top: the photo, reporter name, a **"Call Reporter"** button (opens the phone dialer), the address, the description.
- A **stepper** (ladder): `Accepted -> On the Way -> Reached -> Picked Up -> At Shelter / Vet -> Completed`. Only the **next stage** shows an **"Advance"** button, so no stage can be skipped. If the case is still only `assigned` (the rescuer has not accepted), an **"Accept Rescue"** button is shown instead of the stepper. The server enforces the same rules: no progress without Accept, no going backwards, and only the rescuer the case was given to can change it. The screen refreshes itself from the server every 6 seconds.
- Two boxes: **Medical Notes** and **Treatment**. What is written here goes into the animal's QR health profile later.
- A big green button at the bottom: **"Complete Rescue & Generate QR Profile"**.

Every "Advance" sends `PATCH /cases/:id/status`. The server (`updateCaseStatus`):
1. Checks that the status is one of these ten: reported, assigned, accepted, on_the_way, reached_location, animal_picked_up, at_shelter, treatment_started, completed, cancelled. Otherwise 400.
2. Finds the case. If not found, 404.
3. Applies the new status, medical notes and treatment (if given), and adds **one more timeline entry** (what happened, when, by whom).
4. Sends a `case_status` event through Socket.IO.
5. Notifies the citizen ("Case is now on_the_way").
6. Sends the updated case back so Rajesh's screen changes immediately.

---

### Rescue complete hone par / When the rescue is completed

**Hinglish mein**

Jab status `completed` (ya `cancelled`) hota hai, server yeh karta hai:

1. **Rescuer ko wapas free** karta hai: `activeCaseId = null`, `available = true`. `completed` ho to uska `completedCasesCount` **1 badhta hai** (cancel par nahi).
2. `completed` par ek **Animal record** banata hai (agar pehle se na ho, isliye do baar complete dabane par duplicate nahi banta). Isme: caseId, animalType, photos, kahan mila (foundLocation), rescue ki taareekh, medical notes, treatment, status `in_treatment`.
3. Ek **QR code** banata hai (`qrcode` library). QR ke andar chhota sa JSON text hota hai: `type: ANIMAL_RESCUE_RECORD`, animalId, caseId, aur ek lookupUrl. QR ko hari rang (#0E4B43) mein banaya gaya hai, aur **error correction "H"** use hoti hai: matlab QR ka kuch hissa ganda ya kata ho jaye (collar par ghisne se) tab bhi scan ho sakta hai. QR ek lambi tasveer-string (base64) ban kar Animal record mein save hota hai.
4. Phone ko Animal record wapas milta hai aur `AnimalQrScreen` khulta hai: bada **QR**, "Rescued DOG", ID, status, rescue ki taareekh, jagah, medical notes, treatment, aur **"Share Digital Record"** button (phone ka share-sheet).

**Baad mein kabhi:** koi bhi `GET /animals/qr/:identifier` bhej sakta hai (yeh **public** hai, login nahi chahiye). Server animal id ya case id se record dhoondta hai aur naam, jaanwar ka type, photos, kahan mila, rescue ki taareekh, markings, medical notes, treatment, status wapas deta hai. Nahi mile to likha aata hai ki is jaanwar ko report karo agar mushkil mein ho.

**In English**

When the status becomes `completed` (or `cancelled`), the server:

1. **Frees the rescuer again:** `activeCaseId = null`, `available = true`. On `completed`, their `completedCasesCount` goes **up by 1** (not on cancel).
2. On `completed`, it creates an **Animal record** (only if one does not exist yet, so pressing complete twice does not make a duplicate). It holds: caseId, animalType, photos, where it was found (foundLocation), rescue date, medical notes, treatment, status `in_treatment`.
3. It makes a **QR code** (the `qrcode` library). Inside the QR is a small JSON text: `type: ANIMAL_RESCUE_RECORD`, animalId, caseId, and a lookupUrl. The QR is drawn in green (#0E4B43) and uses **error correction "H"**, which means it can still be scanned even if part of it is dirty or scratched (like from rubbing on a collar). The QR is stored as a long image-string (base64) inside the Animal record.
4. The phone receives the Animal record and `AnimalQrScreen` opens: a big **QR**, "Rescued DOG", the ID, status, rescue date, location, medical notes, treatment, and a **"Share Digital Record"** button (the phone's share sheet).

**Later, any time:** anyone can send `GET /animals/qr/:identifier` (it is **public**, no login needed). The server finds the record by animal id or case id and returns the name, animal type, photos, found location, rescue date, markings, medical notes, treatment and status. If nothing is found, it says to report the animal if it is in distress.

---

### Agar koi Accept hi na kare / If nobody accepts

**Hinglish mein**

Yeh hissa `dispatchService.js` mein hai aur **MongoDB connected hone par** chalta hai.

1. Server sabse achhe rescuer ko alert bhejta hai, case ka status `assigned` hota hai, aur ek **Escalation** log banta hai: "koshish number 1, rescuer X, status pending".
2. Saath mein ek **5 minute ka timer** (exact, `ESCALATION_TIMEOUT_MS` se badal sakte ho) shuru hota hai.
3. Agar 5 minute mein jawaab nahi aaya aur case abhi bhi `assigned` hai: log mein `timeout` likhta hai aur **agle rescuer** ko bhejta hai (koshish number 2).
4. Rescuer Decline kare to timer ka intezaar nahi hota, turant agla.
5. **Zyada se zyada 3 koshishein** (exact). Pehle jise alert gaya use dobara nahi bheja jata.
6. 3 ke baad ya agar koi free rescuer hi nahi mila: timeline mein `escalated_to_coordinator` likhta hai aur coordinator ko alert jata hai. Ab **insaan** ko haath se case sambhalna hai.

Coordinator ka "atke hue cases" wala view dhoondta hai: jinki timeline mein `escalated_to_coordinator` ho, **ya** jo `reported` hain aur **3 minute** se zyada purane hain (exact). Coordinator `POST /coordinator/cases/:id/assign` se kisi bhi rescuer ko haath se de sakta hai.

**In English**

This part lives in `dispatchService.js` and runs **when MongoDB is connected**.

1. The server alerts the best rescuer, the case status becomes `assigned`, and an **Escalation** log row is made: "attempt 1, rescuer X, status pending".
2. At the same time a **5-minute timer** starts (exact, changeable with `ESCALATION_TIMEOUT_MS`).
3. If no reply comes in 5 minutes and the case is still `assigned`: the log gets `timeout` and the case goes to the **next rescuer** (attempt 2).
4. If a rescuer declines, there is no waiting for the timer; the next one is tried at once.
5. **At most 3 attempts** (exact). Anyone who was already alerted is never alerted again for that case.
6. After 3, or if no free rescuer exists at all: `escalated_to_coordinator` is written to the timeline and the coordinator is alerted. Now a **human** has to handle the case by hand.

The coordinator's "stuck cases" view finds cases whose timeline has `escalated_to_coordinator`, **or** which are `reported` and older than **3 minutes** (exact). The coordinator can use `POST /coordinator/cases/:id/assign` to give a case to any rescuer by hand.

---

### Yaad rakhne wale numbers / Numbers to remember

| Cheez / Thing | Number | Kahan / Where |
|---|---|---|
| AI ko jawaab dene ka waqt / AI answer limit | **5 sec** | `aiTriageService.js` |
| Phone ka har sawaal timeout / Phone request timeout | **6 sec** | `api.js` |
| "Server offline" yaad rakhne ka waqt / Offline memory | **5 sec** | `api.js` |
| Citizen tracking refresh | **6 sec** | `CaseTrackingScreen.js` |
| GPS lock ka intezaar / GPS wait | **15 sec** | `location.js` |
| Rescuer ke jawaab ka waqt / Rescuer reply window | **5 min** | `dispatchService.js` |
| Zyada se zyada koshish / Max attempts | **3** | `dispatchService.js` |
| Coordinator ke liye "atka hua" / "Stuck" for coordinator | **3 min** | `coordinatorController.js` |
| Login token ki umar / Token lifetime | **7 din / days** | `authController.js` |
| Photo ki max size / Max photo size | **10 MB** | `upload.js` |
| Proximity ka daayra / Proximity range | **50 km** | `dispatchService.js` |
| Demo data save hone ki deri / Demo save delay | **0.25 sec** | `devStore.js` |
| Login ke baad redirect / Redirect after login | **0.5 sec** | `AuthScreen.js` |

---

## 6. Rescuer chunne ka hisaab / How the best rescuer is chosen

### Hinglish mein

Server har rescuer ko ek **number (score) 0 se 1 ke beech** deta hai. Jiska number sabse zyada, wahi chuna jata hai. Number chaar hisson se banta hai:

| Hissa | Kitna wazan | Kaise nikalta hai |
|---|---:|---|
| **Paas hona** (proximity) | 40% | `0.40 x (1 - doori / 50 km)`. Bilkul paas = poore 0.40. 50 km ya usse door = 0 (par list se hatta nahi) |
| **Free hona** (availability) | 30% | `available` sahi ho **aur** koi active case na ho = poore 0.30, warna 0 |
| **Jaanwar sambhalna** (capability) | 20% | Rescuer ki list mein case ka jaanwar hai = 0.20, warna 0 |
| **Pichhla record** (response rate) | 10% | `0.10 x responseRate` (0 se 1). Agar rate nahi pata: koi bhi case complete kar chuka ho to 0.9, warna 0.5 maanta hai |

**Doori kaise napte hain?** `distance.js` mein **Haversine formula** hai. Seedhi bhasha mein: do GPS points ke beech ki doori, prithvi ki golai (radius 6371 km) ko dhyan mein rakhkar. Kilometer mein deta hai, 3 decimal tak. Agar kisi rescuer ki location hi nahi pata to doori "infinity" maani jati hai, matlab paas hone ka koi number nahi.

**AI ki urgency is score mein nahi judti.** Yeh jaanbujhkar kiya gaya hai: urgency sirf citizen ko salaah aur rescuer ko jaankari ke liye hai, rescuer chunne ke liye nahi.

**Ek asli example** (yahi test `dispatchScoring.test.js` mein hai; case ek kutte ka hai, Indiranagar mein 12.9750, 77.6400):

| Rescuer | Halaat | Doori | Paas | Free | Jaanwar | Record | **Kul** |
|---|---|---:|---:|---:|---:|---:|---:|
| **A** | kutta sambhalta hai, free | 1.10 km | 0.391 | 0.30 | 0.20 | 0.090 | **0.981** |
| B | sirf pakshi sambhalta hai, free | 0.43 km | 0.397 | 0.30 | 0.00 | 0.080 | 0.777 |
| C | kutta sambhalta hai, par **busy** | 0.06 km | 0.400 | 0.00 | 0.20 | 0.095 | 0.695 |
| D | kutta sambhalta hai, free, par **bahut door** | 41 km | 0.071 | 0.30 | 0.20 | 0.085 | 0.656 |

**A jeetta hai**, kyunki woh har cheez mein achha hai. B paas hai par kutte ko nahi sambhal sakta. C sabse paas hai par busy hai. D free hai aur kutta sambhalta hai par bahut door hai.
(Asli dispatch mein busy rescuers ko pehle hi hata diya jata hai, yaani C list mein aata hi nahi. Test sirf score ka hisaab dikhane ke liye C ko shaamil karta hai.)

### In English

The server gives every rescuer a **score between 0 and 1**. The highest score is chosen. The score has four parts:

| Part | Weight | How it is worked out |
|---|---:|---|
| **Closeness** (proximity) | 40% | `0.40 x (1 - distance / 50 km)`. Right next door = the full 0.40. 50 km or more = 0 (but the rescuer is not removed from the list) |
| **Being free** (availability) | 30% | `available` is true **and** no active case = the full 0.30, otherwise 0 |
| **Handles that animal** (capability) | 20% | The case's animal is in the rescuer's list = 0.20, otherwise 0 |
| **Past record** (response rate) | 10% | `0.10 x responseRate` (0 to 1). If the rate is unknown: 0.9 if they have completed any cases, otherwise 0.5 |

**How is distance measured?** `distance.js` uses the **Haversine formula**. In plain words: the distance between two GPS points, taking the roundness of the Earth into account (radius 6371 km). It returns kilometres, to 3 decimal places. If a rescuer's location is unknown, the distance is treated as "infinity", meaning no closeness points.

**The AI urgency is not part of this score.** This is deliberate: urgency is only for advice to the citizen and information for the rescuer, not for choosing the rescuer.

**A real example** (this is the same as the test in `dispatchScoring.test.js`; the case is a dog in Indiranagar at 12.9750, 77.6400):

| Rescuer | Situation | Distance | Close | Free | Animal | Record | **Total** |
|---|---|---:|---:|---:|---:|---:|---:|
| **A** | handles dogs, free | 1.10 km | 0.391 | 0.30 | 0.20 | 0.090 | **0.981** |
| B | handles only birds, free | 0.43 km | 0.397 | 0.30 | 0.00 | 0.080 | 0.777 |
| C | handles dogs but **busy** | 0.06 km | 0.400 | 0.00 | 0.20 | 0.095 | 0.695 |
| D | handles dogs, free, but **very far** | 41 km | 0.071 | 0.30 | 0.20 | 0.085 | 0.656 |

**A wins**, because A is good at everything. B is close but cannot handle dogs. C is the closest but busy. D is free and handles dogs but is very far.
(In real dispatch, busy rescuers are filtered out beforehand, so C would not even be in the list. The test includes C only to show the score arithmetic.)

---

## 7. AI urgency check / The AI urgency check

### Hinglish mein

File: `services/aiTriageService.js`. Yeh **Google Gemini** (model `gemini-1.5-flash`) se poochta hai, par sirf tab jab `.env` mein `GEMINI_API_KEY` ho.

**AI ko kya bola jata hai:** "Tum Indian animal rescue ke triage assistant ho. Urgency sirf LOW, MEDIUM ya HIGH. Bimari **mat** batao. Dawai **mat** batao. Bachne ya marne ki baat **mat** karo. Citizen ko 1-2 chhote safe vakya do (jaise doori rakho, jaanwar ko mat hilao jab tak sadak par khatra na ho). Jawaab sirf JSON mein do." Temperature 0.2 hai, matlab jawaab sthir aur kam "creative".

**Safety:** yeh sab rules isliye hain ki AI galat medical salaah na de. Yeh app doctor nahi hai.

**Agar AI fail ho jaye** (key nahi, internet nahi, 5 second se zyada laga, jawaab samajh nahi aaya): ek simple **keyword wala niyam** chalta hai:

- Description mein `bleed, blood, unconscious, severe, badly injured, not breathing, accident, hit by car, fracture, broken bone, mangled, paralyzed, seizure` jaisa kuch ho -> **HIGH**.
- `minor, small cut, slight limp, walking fine, active, alert, scratch` jaisa kuch ho -> **LOW**.
- Dono mein se kuch nahi -> **MEDIUM** (safe default).

Teeno ke liye pehle se likhi salaah hai (jaise HIGH: "Keep a safe distance. Do not move the animal unless in immediate road danger. A trained responder is being contacted immediately."). Jawaab mein `isFallback: true` aur `manualOverrideAllowed: true` bhi hota hai.

Is wajah se **tests bina internet ke pass hote hain**: tests `.env` padhte hi nahi, to jab tak aapke computer ke system mein `GEMINI_API_KEY` set nahi hai, hamesha keyword wala raasta chalta hai.

### In English

File: `services/aiTriageService.js`. It asks **Google Gemini** (model `gemini-1.5-flash`), but only if `GEMINI_API_KEY` is set in `.env`.

**What the AI is told:** "You are a triage assistant for animal rescue in India. Urgency must be only LOW, MEDIUM or HIGH. Do **not** diagnose illness. Do **not** suggest medicine. Do **not** predict survival. Give the citizen 1-2 short safe sentences (like keep your distance, do not move the animal unless in road danger). Reply only in JSON." Temperature is 0.2, meaning steady, less "creative" answers.

**Why the safety rules:** so the AI never gives wrong medical advice. This app is not a doctor.

**If the AI fails** (no key, no internet, took more than 5 seconds, reply could not be understood): a simple **keyword rule** runs instead:

- The description contains something like `bleed, blood, unconscious, severe, badly injured, not breathing, accident, hit by car, fracture, broken bone, mangled, paralyzed, seizure` -> **HIGH**.
- It contains something like `minor, small cut, slight limp, walking fine, active, alert, scratch` -> **LOW**.
- Neither -> **MEDIUM** (the safe default).

Each level has a ready-made piece of advice (for example HIGH: "Keep a safe distance. Do not move the animal unless in immediate road danger. A trained responder is being contacted immediately."). The reply also carries `isFallback: true` and `manualOverrideAllowed: true`.

That is why **the tests pass without internet**: the tests never read `.env`, so unless `GEMINI_API_KEY` is set in your computer's system environment, the keyword path always runs.

---

## 8. Backend ek-ek file / Backend, file by file

### Hinglish mein

Yeh section file-wise map hai. Kuch dhundhna ho to yahan se shuru karo.

### In English

This section is a file-wise map. Start here when you need to find something.

### 8.1 Shuruaat / Start-up

| File | Hinglish | English |
|---|---|---|
| `server.js` | `.env` padhta hai, HTTP server banata hai, Socket.IO jodta hai, port (default **5000**) par sunna shuru karta hai, aur **uske baad** database se jodne ki koshish karta hai. Isliye database na ho tab bhi server turant chalu ho jata hai. | Reads `.env`, creates the HTTP server, attaches Socket.IO, starts listening on the port (default **5000**), and **only then** tries to connect to the database. So the server starts instantly even if there is no database. |
| `src/app.js` | Express ka dhancha: cors, JSON padhna, `/uploads` folder ko photos ke liye khula rakhna, `/api/v1/health` (server zinda hai ya nahi), 10 routes jodna, aur sabse aakhir mein "route nahi mila" (JSON 404) aur error handler. | The Express shell: cors, reading JSON, serving the `/uploads` folder for photos, `/api/v1/health` (is the server alive), mounting the 10 routes, and at the very end the "route not found" (JSON 404) and the error handler. |
| `src/config/db.js` | Database se jodta hai (`MONGO_URI`, nahi ho to local `127.0.0.1:27017/animal_rescue`). **5 second** mein na jud paye to har baar 30 second latakne ke bajaye turant fail hota hai aur **demo mode** shuru ho jata hai. | Connects to the database (`MONGO_URI`, or local `127.0.0.1:27017/animal_rescue` if not set). If it cannot connect in **5 seconds**, it fails fast instead of hanging for 30 seconds, and **demo mode** begins. |
| `src/config/jwt.js` | Login-token ka secret ek hi jagah rakhta hai, taaki token banane wala aur jaanchne wala dono **ek hi secret** use karein. `.env` mein `JWT_SECRET` na ho to ek development wala default use hota hai. | Keeps the login-token secret in one place so the maker and the checker of tokens use the **same secret**. If `JWT_SECRET` is missing in `.env`, a development default is used. |

### 8.2 Guards aur helpers (middleware) / Guards and helpers (middleware)

| File | Hinglish | English |
|---|---|---|
| `middleware/auth.js` | Teen guard. **`protect`**: token zaroori, nahi to 401. **`optionalProtect`**: token ho to user pehchano, nahi ho to guest maano. **`authorize('coordinator','admin')`**: sirf in roles ko jaane do, warna 403. | Three guards. **`protect`**: a token is required, otherwise 401. **`optionalProtect`**: recognise the user if a token exists, otherwise treat as guest. **`authorize('coordinator','admin')`**: let only these roles in, otherwise 403. |
| `middleware/errorHandler.js` | Har error ko saaf JSON mein badalta hai. Galat id = 400. Validation galat = 400. Kharab JSON = 400. Database band ho aur zaroori ho = 503 ("yeh feature database maangta hai"). Baaki = 500 aur console mein poora error. Plus: galat address par HTML ke bajaye JSON 404. | Turns every error into clean JSON. Bad id = 400. Bad validation = 400. Broken JSON = 400. Database off but needed = 503 ("this feature needs the database"). Everything else = 500 with the full error in the console. Plus: a wrong address gives a JSON 404 instead of an HTML page. |
| `middleware/upload.js` | Photo upload (multer). Sirf jpeg/jpg/png/webp/gif, max **10 MB**. File ka naam `animal-<time>-<random>.jpg` jaisa banta hai taaki do photos ka naam kabhi na takraye. `public/uploads/` mein rakhta hai. | Photo upload (multer). Only jpeg/jpg/png/webp/gif, max **10 MB**. The file is named like `animal-<time>-<random>.jpg` so two photos never clash. Stored in `public/uploads/`. |

### 8.3 Raaste (routes) aur kaam (controllers) / Routes and controllers

Routes batate hain "kaun sa address kis function ko jayega". Controllers asli kaam karte hain. Sab `/api/v1` ke andar hain.
Routes say "which address goes to which function". Controllers do the real work. All sit under `/api/v1`.

| Method + Address | Login? | Controller | Hinglish | English |
|---|---|---|---|---|
| GET `/health` | nahi / no | `app.js` | Server zinda hai, kaun se features hain | Is the server alive, which features exist |
| POST `/auth/register` | nahi / no | `authController` | Naya account | New account |
| POST `/auth/login` | nahi / no | `authController` | Login, token wapas | Login, returns a token |
| POST `/reports` | optional | `reportController` | Naya emergency case | New emergency case |
| GET `/cases` | optional | `caseController` | Saare cases, `?status=` aur `?animalType=` se chhanto | All cases, filter with `?status=` and `?animalType=` |
| GET `/cases/my-reports` | **haan / yes** | `caseController` | Sirf mere cases | Only my cases |
| GET `/cases/:id` | optional | `caseController` | Ek case ki poori detail | One case in full |
| PATCH `/cases/:id/status` | optional | `caseController` | Status aage badhao, complete par animal + QR | Move status forward; on complete, animal + QR |
| POST `/dispatch/:id/accept` | optional | `dispatchController` | Rescuer Accept | Rescuer accepts |
| POST `/dispatch/:id/decline` | optional | `dispatchController` | Rescuer Decline | Rescuer declines |
| GET `/dispatch/active` | **haan / yes** | `dispatchController` | Mera chalta hua case | My ongoing case |
| GET `/dispatch/nearby` | **haan / yes** | `dispatchController` | Khule (open) cases | Open cases |
| GET/POST `/rescuers/profile` | **haan / yes** | `rescuerController` | Profile dekho / banao ya badlo | View / create or update profile |
| PATCH `/rescuers/availability` | **haan / yes** | `rescuerController` | Online / Busy | Online / Busy |
| PATCH `/rescuers/location` | **haan / yes** | `rescuerController` | Meri location update | Update my location |
| GET `/rescuers` | optional | `rescuerController` | Rescuers ki list, `?available=` `?animalType=` | List of rescuers, `?available=` `?animalType=` |
| GET `/animals` | optional | `animalController` | Rescued jaanwaron ki list | List of rescued animals |
| GET `/animals/qr/:identifier` | nahi / no (**public**) | `animalController` | QR se history | History from a QR |
| GET `/animals/:id`, `/animals/case/:caseId` | optional | `animalController` | Ek jaanwar | One animal |
| POST `/animals`, PATCH `/animals/:id` | **haan / yes** | `animalController` | Profile banao / badlo | Create / update profile |
| GET `/contacts` | nahi / no | `contactController` | Bengaluru ke helpline (`?category=` `?search=`) | Bengaluru helplines (`?category=` `?search=`) |
| POST `/triage` | nahi / no | `routes/triage.js` | Sirf AI urgency check | Just the AI urgency check |
| POST `/upload` | optional | `routes/upload.js` | Ek photo upload (field ka naam `photo`) | Upload one photo (field name `photo`) |
| GET `/coordinator/cases` | coordinator/admin | `coordinatorController` | Atke hue cases | Stuck cases |
| POST `/coordinator/cases/:id/assign` | coordinator/admin | `coordinatorController` | Haath se rescuer dena | Assign a rescuer by hand |
| PATCH `/coordinator/rescuers/:id/verify` | coordinator/admin | `coordinatorController` | Rescuer approve / reject / pending | Approve / reject / pending a rescuer |
| GET `/coordinator/stats` | coordinator/admin | `coordinatorController` | Kul cases, active, completed, escalated, animals, rescuers | Total cases, active, completed, escalated, animals, rescuers |

### 8.4 Services (dimaag wale hisse) / Services (the brains)

| File | Hinglish | English |
|---|---|---|
| `services/dispatchService.js` | Section 6 aur "agar koi accept na kare" wala poora logic: score, ranking, chunna, 5 minute ka timer, accept, decline, coordinator tak pahunchana. | All the logic of section 6 and "if nobody accepts": scoring, ranking, choosing, the 5-minute timer, accept, decline, reaching the coordinator. |
| `services/aiTriageService.js` | Section 7. | Section 7. |
| `services/notificationService.js` | Teen jagah notification: rescuer ko naya case, citizen ko status, coordinator ko escalation. **Abhi yeh sirf console mein print karta hai** (jaise `[PUSH NOTIFICATION] -> Sent to Rescuer: ...`). Asli push (Firebase) ke liye jagah chhodi gayi hai, par likhi nahi gayi. | Notifications in three places: new case to rescuer, status to citizen, escalation to coordinator. **For now it only prints to the console** (like `[PUSH NOTIFICATION] -> Sent to Rescuer: ...`). A place is left for real push (Firebase), but it is not written yet. |

### 8.5 Data ka dhancha (models) / Shape of the data (models)

| Model | Kya rakhta hai / What it holds |
|---|---|
| **User** | name, phone (alag-alag, unique), passwordHash, role (citizen / rescuer / coordinator / admin), profilePhotoUrl |
| **Rescuer** | kaun sa user (`user`), organizationName, animalsHandled (list), location, `available`, isVerified / verificationStatus (pending / approved / rejected), `activeCaseId`, completedCasesCount, averageResponseTime, responseRate (default 0.9) |
| **Case** | citizen (guest ho to khali), reporterName, reporterPhone, animalType, description, photoUrl, location (lat, long, address), urgency (LOW/MEDIUM/HIGH), **status** (10 mein se ek), assignedRescuer, **timeline** (list: status, time, note, kisne badla), medicalNotes, treatment |
| **Animal** | caseId, animalType, name, photos, foundLocation, rescueDate, identifyingMarkings, medicalNotes, treatment, status (in_treatment / sheltered / adopted / released / deceased), qrCodeUrl, qrCodeData |
| **Escalation** | caseId, attemptNumber, rescuerId, alertedAt, status (pending / accepted / declined / timeout / coordinator_escalated), note. Yeh "kisko kab alert gaya aur kya hua" ka khata hai. / The ledger of "who was alerted when and what happened". |

**Case ke status ka safar / The journey of a case status:**

```
reported -> assigned -> accepted -> on_the_way -> reached_location
        -> animal_picked_up -> at_shelter -> treatment_started -> completed
                                   (kisi bhi waqt / at any time: cancelled)
```

### 8.6 Madad wali files / Helper files

| File | Hinglish | English |
|---|---|---|
| `utils/distance.js` | Haversine doori (section 6). | Haversine distance (section 6). |
| `utils/devStore.js` | Demo mode ki memory (section 10). | The demo-mode memory (section 10). |
| `socket.js` | Live baat-cheet. Har case ka ek "kamra" (room) hota hai, naam `case_<id>`. Citizen aur coordinator us kamre mein `join_case` bhejkar aate hain. Rescuer `rescuer_location_update` bhejta hai (lat, long, heading, speed, **~5 second** par) aur server use kamre ke sab logon ko `rescuer_location` bana kar bhej deta hai, aur rescuer ki last location database mein save karta hai. Status badalne par `case_status` event jata hai. **Server ka yeh hissa poora taiyar hai.** Phone isse abhi nahi jodta (section 11). | Live conversation. Every case has a "room" named `case_<id>`. Citizens and coordinators enter that room by sending `join_case`. The rescuer sends `rescuer_location_update` (lat, long, heading, speed, about **every 5 seconds**) and the server forwards it as `rescuer_location` to everyone in the room, and saves the rescuer's last location in the database. A `case_status` event goes out when the status changes. **This part of the server is fully ready.** The phone does not connect to it yet (section 11). |
| `data/emergencyContacts.js` | Bengaluru ke **7** helpline / shelter / hospital ki list: jaise Government 1962 (Pashu Chikitsa), CUPA Trauma Centre (Hebbal), CARE (Yelahanka). Har ek mein naam, category, phone, address, area, timing, description, website. | A list of **7** Bengaluru helplines / shelters / hospitals, such as Government 1962 (Pashu Chikitsa), CUPA Trauma Centre (Hebbal), CARE (Yelahanka). Each has name, category, phone, address, area, timing, description and website. |
| `scripts/seedRescuers.js` | (`npm run seed`) **MongoDB mein** 4 nakli rescuers (A paas+free, B sirf pakshi, C busy, D bahut door), 1 coordinator (phone `9999999999`) aur 1 citizen (`9888888888`) bharta hai. Sabka password **`rescuer123`**. | (`npm run seed`) Fills **MongoDB** with 4 fake rescuers (A close+free, B birds only, C busy, D very far), 1 coordinator (phone `9999999999`) and 1 citizen (`9888888888`). The password for all is **`rescuer123`**. |

### 8.7 Tests / Tests

`npm test` chhe files ek ke baad ek chalata hai aur kisi mein bhi gadbad ho to wahin ruk jata hai. Tests ke dauran demo data file mein **kuch save nahi hota** (`DEV_STORE_PERSIST=false`).
`npm test` runs six files one after another and stops at the first failure. During tests **nothing is written** to the demo data file (`DEV_STORE_PERSIST=false`).

| Test file | Kya jaanchta hai / What it checks |
|---|---|
| `dispatchScoring.test.js` | Doori ka hisaab aur section 6 wali A/B/C/D ranking / Distance maths and the A/B/C/D ranking from section 6 |
| `aiTriage.test.js` | Gambhir chot = HIGH, chhoti kharonch = LOW, saadharan = MEDIUM; salaah mein dawai ka naam kabhi nahi / Severe injury = HIGH, minor scratch = LOW, ordinary = MEDIUM; the advice never names a medicine |
| `animalsAndQR.test.js` | QR code ek sahi PNG tasveer ban kar aata hai / The QR comes out as a valid PNG image |
| `contacts.test.js` | Kam se kam 7 helpline, aur 1962, CUPA, CARE, Cessna list mein hain / At least 7 helplines, and 1962, CUPA, CARE, Cessna are in the list |
| `devStoreAndRescuers.test.js` | Demo mode: rescuer profile / availability / location, report -> accept -> complete, ek case do baar complete karne par ek hi animal record, coordinator ke raaste, animal update, photo upload, saaf JSON errors, aur restart ke baad data wapas milna / Demo mode: rescuer profile / availability / location, report -> accept -> complete, completing a case twice keeps one animal record, coordinator routes, animal update, photo upload, clean JSON errors, and data surviving a restart |
| `simulateEndToEnd.test.js` | Pura safar: health -> report (HIGH) -> accept -> har status -> completed -> animal + QR -> QR scan -> contacts / The whole journey: health -> report (HIGH) -> accept -> every status -> completed -> animal + QR -> QR scan -> contacts |

---

## 9. Mobile app ek-ek file / Mobile app, file by file

### 9.1 Teen bunyadi hisse / The three core pieces

| File | Hinglish | English |
|---|---|---|
| `index.js` | App ko Expo mein register karta hai. | Registers the app with Expo. |
| `App.js` | Fonts load, `SafeAreaProvider` (notch/status bar se bachata hai), phir `RootNavigator`. Ek pila "Cannot connect to Expo CLI" banner ko chhupata hai (sirf development ka shor hai). | Loads fonts, adds `SafeAreaProvider` (keeps content clear of the notch/status bar), then `RootNavigator`. Hides a yellow "Cannot connect to Expo CLI" banner (development-only noise). |
| `navigation/RootNavigator.js` | 15 screens ki list. Header chhupa hua hai; har screen apna header khud banati hai. | The list of 15 screens. The default header is hidden; each screen draws its own header. |

### 9.2 Services (screens ke peeche ka kaam) / Services (work behind the screens)

| File | Hinglish | English |
|---|---|---|
| `services/api.js` | Server se baat karne ka ek hi darwaza. Section 5 ("Submit dabana") mein bataya `request()` yahin hai. Saare server ke kaam ek jagah: `login, register, checkHealth, getTriage, submitReport, getCaseById, getAllCases, updateCaseStatus, acceptCase, declineCase, getNearbyCases, getActiveRescue, updateAvailability, updateLocation, getContacts, getAnimalByCaseId, getAnimalByQr`. | The single door to the server. The `request()` described in section 5 ("Pressing Submit") lives here. All server calls in one place: `login, register, checkHealth, getTriage, submitReport, getCaseById, getAllCases, updateCaseStatus, acceptCase, declineCase, getNearbyCases, getActiveRescue, updateAvailability, updateLocation, getContacts, getAnimalByCaseId, getAnimalByQr`. |
| `services/storage.js` | Phone ki apni chhoti diary (`AsyncStorage`). Do cheezein: **reports** (`@animal_rescue_reports`) aur **adoption requests** (`@animal_rescue_adoption_requests`). Naya sabse upar judta hai. Padhne/likhne mein gadbad ho to app girti nahi, khali list deti hai. | The phone's own small notebook (`AsyncStorage`). Two things: **reports** (`@animal_rescue_reports`) and **adoption requests** (`@animal_rescue_adoption_requests`). The newest goes on top. If reading or writing fails, the app does not crash; it returns an empty list. |
| `services/location.js` | GPS aur address (section 5, "Report form"): `getCurrentCoordinates`, `reverseGeocode`. | GPS and address (section 5, "Filling the report form"): `getCurrentCoordinates`, `reverseGeocode`. |
| `services/mockTriage.js` | Server na mile tab phone ke andar ka keyword wala urgency check (server wale jaisa, thoda chhota). | The keyword urgency check inside the phone for when the server is unreachable (like the server's, slightly smaller). |

**Phone mein save hone wali chaar chaabiyan / The four keys saved on the phone:**

| Key | Kya hai / What |
|---|---|
| `user_token` | Login ka entry pass / The login entry pass |
| `user_profile` | Naam, phone, role, rescuer ka organization / Name, phone, role, rescuer's organization |
| `@animal_rescue_reports` | Is phone se bheji gayi reports / Reports sent from this phone |
| `@animal_rescue_adoption_requests` | Is phone se gayi adoption requests / Adoption requests made from this phone |

### 9.3 Saari screens / All screens

| Screen | Kirdaar / Role | Hinglish | English |
|---|---|---|---|
| `Welcome` | sab / all | Teen button: login, citizen, rescuer | Three buttons: login, citizen, rescuer |
| `Auth` | sab / all | Sign In / Create Account, demo fill | Sign In / Create Account, demo fill |
| `CitizenHome` | citizen | Report button, quick cards, adoption, recent 3 cases | Report button, quick cards, adoption, recent 3 cases |
| `ReportEmergency` | citizen | Photo + type + description + location, submit | Photo + type + description + location, submit |
| `ReportSubmitted` | citizen | Success + AI urgency + guidance | Success + AI urgency + guidance |
| `CaseTracking` | citizen | 8-padav timeline, har 6 sec refresh, rescuer card; complete hone par QR button | 8-stage timeline, refresh every 6 sec, rescuer card; a QR button once completed |
| `MyReports` | citizen | **Phone mein save** ki hui apni reports | Reports **saved on the phone** |
| `EmergencyContacts` | citizen | Helpline list, "Call" button se seedha dialer. Phone mein 4 numbers pehle se rakhe hain; server se list aaye to woh dikhti hai. Isliye **bina internet ke bhi chalta hai.** | Helpline list, a "Call" button opens the dialer directly. 4 numbers are built into the phone; if the server returns its list, that is shown. So it **works without internet.** |
| `Adoption` | citizen | 4 sample jaanwar (Bruno, Misty, Coco...), filter Dogs/Cats/Birds, "request" form (naam, phone 10 ank, area, kaaran). Request **sirf phone mein** save hoti hai. | 4 sample animals (Bruno, Misty, Coco...), filter Dogs/Cats/Birds, a "request" form (name, 10-digit phone, area, reason). The request is **saved only on the phone**. |
| `RescuerHome` | rescuer | Alerts, active banner, Online/Busy, Accept/Decline | Alerts, active banner, Online/Busy, Accept/Decline |
| `RescueRequest` | rescuer | Case ki poori detail, Accept/Decline | Full case detail, Accept/Decline |
| `ActiveRescue` | rescuer | Call reporter, stepper, medical notes, complete | Call reporter, stepper, medical notes, complete |
| `AnimalQr` | rescuer | QR + health record + share | QR + health record + share |
| `RescuerProfile` | rescuer | Profile, duty switch, stats, jaanwar chips | Profile, duty switch, stats, animal chips |
| `RescuerHistory` | rescuer | Complete ho chuke cases | Completed cases |

### 9.4 Dikhne ka dhancha (components, theme) / Look and feel (components, theme)

**Hinglish mein**

- **`theme.js`**: saare rang aur fonts ek jagah. Page ka rang **cream** (#F6F0E9), gehra **forest green** (#0E4B43) buttons aur headings ke liye, **lime** (#A6E46A) aur **orange** (#F5A524) jo dhyan kheenchte hain, **red/coral** decline ke liye. Buttons ke 4 size hain (`lg, md, sm, pill`) aur sab kam se kam ~44 point ke taaki ungli se dabana aasaan ho.
- **`responsive.js`**: designs 390 pixel chaude phone ke hisaab se bane hain. `rs()` function kisi bhi phone par size ko thoda chhota/bada kar deta hai (0.82 se 1.1 guna), bade heading zyada badalte hain, chhota text kam (taaki padhne layak rahe). 600 pixel se chaude screen (tablet/browser) par designed size hi rehta hai.
- **`components/`**: `AppButton` (8 tarah ke style: primary, lime, accent, success, outline, light, danger, soft), `ScreenBackground` (har page ka peeche ka rang aur design), `ScreenHeader` (upar ka hissa: chhota label, bada title, subtitle, left/right buttons), `SegmentedNav` (upar ki chhoti gol buttons ki patti: Home / Sign out...), `Heading` (aur `Accent` jo ek shabd ko alag rang deta hai), `Doodles` (chhote paw-print drawings).
- **`data/adoptablePets.js`**: adoption screen ke 4 sample jaanwar. File mein likha hai ki baad mein ise API se badal dena hai.

**In English**

- **`theme.js`**: all colours and fonts in one place. The page colour is **cream** (#F6F0E9), deep **forest green** (#0E4B43) for buttons and headings, **lime** (#A6E46A) and **orange** (#F5A524) to draw attention, and **red/coral** for decline. Buttons have 4 sizes (`lg, md, sm, pill`), all at least ~44 points tall so they are easy to tap with a finger.
- **`responsive.js`**: designs are made for a 390-pixel-wide phone. The `rs()` function nudges sizes up or down on other phones (0.82x to 1.1x); big headings change more, small text less (so it stays readable). On screens 600 pixels or wider (tablet/browser) the designed size is kept.
- **`components/`**: `AppButton` (8 styles: primary, lime, accent, success, outline, light, danger, soft), `ScreenBackground` (the backdrop and pattern of each page), `ScreenHeader` (the top part: small label, big title, subtitle, left/right buttons), `SegmentedNav` (the small pill-button strip at the top: Home / Sign out...), `Heading` (and `Accent`, which colours one word differently), `Doodles` (small paw-print drawings).
- **`data/adoptablePets.js`**: the 4 sample animals for the adoption screen. The file itself notes that it should later be replaced by an API call.

---

## 10. Demo mode: bina database ke / Demo mode: without a database

### Hinglish mein

**Problem:** MongoDB har laptop par installed nahi hota. Phir bhi project chalna chahiye, khaas kar demo ke din.

**Hal:** `devStore.js`. Jab server start hota hai aur MongoDB se 5 second mein nahi jud pata, tab:

1. Server band **nahi** hota. Console mein likhta hai "Running in demo mode".
2. Har controller pehle dekhta hai `isDbConnected()` (matlab MongoDB sach mein jud chuka hai?). Nahi, to MongoDB ki jagah **memory ke "Map"** (naam se cheez dhoondne wali list) use karta hai: `usersMap`, `rescuersMap`, `casesMap`, `animalsMap`.
3. Yeh data **`data/dev-store.json`** mein bhi save hota hai, isliye server restart karne par accounts, reports aur animals **wapas mil jaate hain**.

**Save kaise hota hai (sambhal ke):**
- Har badlav par save ka timer **0.25 second** ke liye lagta hai. Is bech mein 10 badlav ho to ek hi baar save hota hai (kaam kam, disk par bojh kam).
- Pehle `dev-store.json.tmp` naam ki **alag file** mein likhta hai, phir use asli file ka naam de deta hai. Isse beech mein bijli jaye ya crash ho to asli file kabhi aadhi-adhuri nahi hoti.
- Server band karte waqt (`Ctrl+C`) ek aakhri baar save karta hai.
- Agar file padhi hi na jaye (kharab ho gayi), to use `.corrupt-<time>` naam deke side mein rakh deta hai, aur saaf slate se shuru karta hai.
- Dates ko JSON mein text banakar likhta hai aur padhte waqt wapas "date" bana leta hai.
- Chaho to band karo: `DEV_STORE_PERSIST=false`. Chaho to kahin aur rakho: `DEV_STORE_FILE=/kuch/path.json`. Poora reset: `data/dev-store.json` delete kar do.

**Pehle se bhara hua data (seed):**
- Citizen **Ananya Sharma**, phone `9876543210`, password `password123`.
- Rescuer **Rajesh Kumar**, phone `9845012345`, password `password123`. Organization: *Bengaluru Animal Rescue Squad (BARS)*, jaanwar: dog, cat, cattle, bird. Verified. 14 cases kar chuka hai, response rate 0.95.
- Do sample alert (sirf jab koi case ho hi nahi): Indiranagar mein kutta (HIGH) aur Koramangala mein billi ka bachcha (MEDIUM).

**Kya demo mode mein nahi chalta:** automatic rescuer chunna, 5 minute ka timer, 3 koshishein, coordinator ko apne aap alert jana. Yeh sab MongoDB wale raaste mein hain (section 11 mein is par aur likha hai).

### In English

**Problem:** not every laptop has MongoDB installed. The project should still run, especially on demo day.

**Solution:** `devStore.js`. When the server starts and cannot connect to MongoDB within 5 seconds:

1. The server does **not** stop. It prints "Running in demo mode" to the console.
2. Every controller first checks `isDbConnected()` (is MongoDB really connected?). If not, it uses **in-memory "Maps"** (lists that look things up by name) instead of MongoDB: `usersMap`, `rescuersMap`, `casesMap`, `animalsMap`.
3. This data is also saved to **`data/dev-store.json`**, so after a server restart the accounts, reports and animals **come back**.

**How saving works (carefully):**
- Every change starts a save timer of **0.25 seconds**. If 10 changes happen in between, there is just one save (less work, less disk load).
- It first writes to a **separate file** called `dev-store.json.tmp`, then renames it to the real file. So if the power goes or the program crashes midway, the real file is never left half-written.
- When the server is stopped (`Ctrl+C`), it does one last save.
- If the file cannot be read (it got corrupted), it is set aside with the name `.corrupt-<time>` and the server starts with a clean slate.
- Dates are written to JSON as text and turned back into real dates when read.
- To turn saving off: `DEV_STORE_PERSIST=false`. To store it elsewhere: `DEV_STORE_FILE=/some/path.json`. For a full reset: delete `data/dev-store.json`.

**Pre-filled data (seed):**
- Citizen **Ananya Sharma**, phone `9876543210`, password `password123`.
- Rescuer **Rajesh Kumar**, phone `9845012345`, password `password123`. Organization: *Bengaluru Animal Rescue Squad (BARS)*, animals: dog, cat, cattle, bird. Verified. 14 completed cases, response rate 0.95.
- Two sample alerts (only when there are no cases at all): a dog in Indiranagar (HIGH) and a kitten in Koramangala (MEDIUM).

**What does not work in demo mode:** automatic rescuer choosing, the 5-minute timer, the 3 attempts, and the automatic alert to the coordinator. All of that is on the MongoDB path (more on this in section 11).

---

## 11. Kya asli hai, kya abhi adhura / What is real, what is unfinished

### Hinglish mein

Yeh section sabse zaroori hai agar aap demo ya viva dene wali ho. Project ki `README.md` poora plan batata hai. Code ka kuch hissa us plan se **aage-peeche** hai. Neeche saaf-saaf likha hai ki kaunsa hissa asli kaam kar raha hai aur kaunsa abhi tayyari mein hai.

**Asli kaam kar raha hai (tests aur code dono se pakka):**
- Account banana, login, token, role guard.
- Report, guest report, AI/keyword urgency, case ka timeline.
- Rescuer ka score, ranking, 3 koshish, 5 minute ka timer, decline par agla rescuer (MongoDB ke saath).
- Accept, status ki poori seedhi, complete, animal record, QR, QR se public lookup.
- Coordinator ke server raaste (atke cases, haath se assign, approve/reject, stats).
- Bengaluru ke 7 emergency numbers.
- Demo mode aur uski saving.
- Mobile ki saari 15 screens aur unka server se judna.

**Abhi adhura ya plan se alag:**

1. **README ki technology list vs asli code.**
   - README mein *Firebase Authentication* hai. Code mein apna login hai: phone + password, `bcrypt` se hash, aur JWT token.
   - README mein *Firebase Cloud Messaging* (push) hai. Code mein `notificationService.js` sirf console mein print karta hai.
   - README mein *Cloudinary* (photo) hai. Code mein photo upload server ke local folder `public/uploads` mein jata hai (multer se).
   - README mein *Google Maps* hai. App mein koi map nahi hai. Address ke liye phone ka apna geocoder, aur uske na chalne par OpenStreetMap use hota hai.
   - *Gemini* asli hai, par sirf tab jab `GEMINI_API_KEY` set ho.

2. **Photo rescuer tak nahi pahunchti.** Report karte waqt phone `photoUrl` mein photo ka **phone ke andar ka path** bhejta hai. Server ka `POST /upload` bana hua hai (10 MB, jpeg/png/webp/gif), par app use bulati hi nahi. Isliye rescuer ke phone par citizen ki photo load nahi hoti. Rescuer screen par photo dikhane ka code hai, par asal mein tab dikhegi jab photo kisi aise web address par ho jo sab dekh sakein.

3. **Live location phone par nahi.** Server ka Socket.IO taiyar hai, par `mobile/package.json` mein koi socket library hi nahi hai. Citizen ki tracking screen 6 second mein status poochkar chalti hai (polling). Rescuer ki live position ya map nahi dikhta.

4. **Demo mode mein automatic matching nahi.** `reportController` mein rescuer chunne ka kaam sirf `isDbConnected()` hone par chalta hai. Demo mode mein report `reported` rehti hai aur kisi ko diya nahi jata, isliye **har rescuer ko woh khula case dikhta hai** (database mode mein case sirf chune hue rescuer ko dikhta hai).

5. **Jaanwar ke naam aapas mein mel nahi khate.** Citizen ki screen par chips hain: Dog, Cat, **Cow**, Bird, **Monkey**, Other. Rescuer ke sign-up par: dog, cat, **cattle**, bird, **wildlife**. Score mein milan **seedha shabd-barabar** (chhote-bade akshar ka fark nahi) se hota hai, to `cow` ka `cattle` se aur `monkey` ka `wildlife` se milan **nahi** hota, aur "capability" ke 20% number nahi milte. Aasaan fix: dono jagah ek hi naam rakho (jaise `cattle`, `wildlife`).

6. **Coordinator ki mobile screen nahi hai.** Server ke raaste hain, par app mein koi coordinator screen nahi. Demo mode mein coordinator account bhi pehle se nahi hai (sirf `npm run seed` se, MongoDB mein).

7. **Rescuer Profile aur History ab asli hain** (pehle nakli data tha). Profile server se naam, organization, completed rescues, response rate aur Online/Busy padhti hai. "Avg Arrival" tab tak `-` dikhta hai jab tak server ke paas average response time nahi hota. History mein sirf **is rescuer ke** completed cases aate hain.

8. **"Your Recent Reports" aur "My Reports" ab dono sirf aapki apni reports dikhate hain.** Login ho to server se (live status ke saath), guest ho to is phone ki diary se.

9. **QR scan karne ka camera app mein nahi hai.** Server public lookup deta hai aur `api.getAnimalByQr` bana hai, par scanner screen nahi. QR ke andar ka `lookupUrl` (`animalrescue.bengaluru.gov.in/...`) ek namune ka address hai; is project mein us address par koi page nahi banaya gaya.

10. **Security ke kuch dhile hisse (prototype ke liye theek, launch se pehle kasna zaroori):**
    - Agar `.env` mein `JWT_SECRET` na ho to code ka default secret use hota hai.
    - `cors` sabko ijazat deta hai.
    - `GET /cases/:id` bina login ke khula hai (taaki guest apni report track kar sake). Case ki id lambi aur andaaze se bahar hoti hai, par jiske paas id ho woh case dekh sakta hai.
    - **Theek ho chuke:** public sign-up ab sirf `citizen` aur `rescuer` banata hai (coordinator/admin sirf `npm run seed` se). Status badalna aur Accept/Decline ab sirf logged-in rescuer ke liye hai (guest ko `401`, citizen ko `403`). Rescuers ki list (phone numbers ke saath) ab sirf coordinator/admin ko milti hai.

11. **Adoption sirf phone mein.** 4 sample jaanwar hain aur request phone ki diary mein jati hai, server ko nahi.

12. **Ek chhoti baat:** README kehta hai AI fail hone par "MEDIUM" lagta hai. Code mein pehle keyword dekhta hai (bleeding jaisa shabd mile to HIGH, minor jaisa mile to LOW), aur kuch na mile tabhi MEDIUM. Yeh README se zyada samajhdaar hai, bas README ko update kar do.

### In English

This section is the most important if you are giving a demo or viva. The project's `README.md` describes the full plan. Some parts of the code are **ahead of or behind** that plan. Below it is stated plainly which parts really work and which are still in progress.

**Really working (confirmed by both the code and the tests):**
- Creating accounts, login, tokens, role guards.
- Reports, guest reports, AI/keyword urgency, the case timeline.
- Rescuer scoring, ranking, 3 attempts, the 5-minute timer, next rescuer on decline (with MongoDB).
- Accept, the whole status ladder, complete, animal record, QR, public lookup from the QR.
- The coordinator's server routes (stuck cases, manual assign, approve/reject, stats).
- The 7 Bengaluru emergency numbers.
- Demo mode and its saving.
- All 15 mobile screens and their connection to the server.

**Still unfinished or different from the plan:**

1. **The README's technology list vs the real code.**
   - The README lists *Firebase Authentication*. The code has its own login: phone + password, hashed with `bcrypt`, and a JWT token.
   - The README lists *Firebase Cloud Messaging* (push). In the code, `notificationService.js` only prints to the console.
   - The README lists *Cloudinary* (photos). In the code, photo uploads go to the server's local `public/uploads` folder (through multer).
   - The README lists *Google Maps*. The app has no map. For addresses it uses the phone's own geocoder, and OpenStreetMap if that fails.
   - *Gemini* is real, but only when `GEMINI_API_KEY` is set.

2. **The photo does not reach the rescuer.** When reporting, the phone sends the photo's **path inside the phone** as `photoUrl`. The server's `POST /upload` exists (10 MB, jpeg/png/webp/gif), but the app never calls it. So the citizen's photo will not load on the rescuer's phone. The rescuer screen has code to show a photo, but it will only really work once the photo lives at a web address everyone can reach.

3. **Live location is not on the phone.** The server's Socket.IO is ready, but `mobile/package.json` has no socket library at all. The citizen's tracking screen works by asking for the status every 6 seconds (polling). There is no live rescuer position or map.

4. **No automatic matching in demo mode.** In `reportController`, the rescuer-choosing step runs only when `isDbConnected()` is true. In demo mode the report stays `reported` and is given to nobody, so **every rescuer sees that open case** (with a database, a case is shown only to the rescuer it was sent to).

5. **Animal names do not match.** The citizen screen has chips: Dog, Cat, **Cow**, Bird, **Monkey**, Other. The rescuer sign-up has: dog, cat, **cattle**, bird, **wildlife**. The score matches by **exact word** (ignoring capital letters), so `cow` does **not** match `cattle` and `monkey` does **not** match `wildlife`, and the 20% "capability" points are lost. An easy fix: use the same names in both places (such as `cattle`, `wildlife`).

6. **No coordinator screen in the mobile app.** The server routes exist, but the app has no coordinator screen. In demo mode there is also no pre-made coordinator account (only `npm run seed`, into MongoDB, creates one).

7. **Rescuer Profile and History are now real** (they used to show sample data). The profile reads the name, organization, completed rescues, response rate and Online/Busy from the server. "Avg Arrival" shows `-` until the server has an average response time. History lists only **this rescuer's** completed cases.

8. **"Your Recent Reports" and "My Reports" now both show only your own reports.** When logged in they come from the server (with live status); as a guest they come from this phone's notebook.

9. **There is no QR-scanning camera in the app.** The server offers a public lookup and `api.getAnimalByQr` exists, but there is no scanner screen. The `lookupUrl` inside the QR (`animalrescue.bengaluru.gov.in/...`) is a sample address; no page has been built at that address in this project.

10. **Some security loose ends (fine for a prototype, must be tightened before launch):**
    - `GET /cases/:id` is open without a login (so a guest can follow their report). A case id is long and unguessable, but anyone who has the id can read that case.
    - **Already fixed:** public sign-up now creates only `citizen` and `rescuer` accounts (coordinator/admin only through `npm run seed`). Changing a status and Accept/Decline are now only for a logged-in rescuer (`401` for a guest, `403` for a citizen). The rescuer list (with phone numbers) is now for coordinators / admins only.
    - If `.env` has no `JWT_SECRET`, a default secret from the code is used.
    - `cors` allows everyone.

11. **Adoption is phone-only.** There are 4 sample animals and the request goes to the phone's notebook, not to the server.

12. **One small thing:** the README says the AI fallback is "MEDIUM". The code first looks for keywords (a word like bleeding gives HIGH, a word like minor gives LOW), and uses MEDIUM only if nothing matches. That is smarter than the README says; just update the README.

---

## 12. Chalane ka tareeka / How to run it

### Hinglish mein

**Zarurat:** Node.js, npm. Phone par testing ke liye **Expo Go** app. (MongoDB zaroori **nahi**, demo mode chalega.)

**Backend:**
```bash
cd animal-rescue-backend
npm install
copy .env.example .env        # Windows (Mac/Linux: cp .env.example .env)
npm start                     # ya: npm run dev  (file badalte hi apne aap restart)
```
Check karo: browser mein `http://localhost:5000/api/v1/health` kholo. `{"status":"ok", ...}` dikhna chahiye.

`.env` ka matlab:
- `PORT=5000` server ka port.
- `MONGO_URI=...` MongoDB ka address. Jaise `.env.example` mein diya hai wahi chhod doge to jud nahi payega aur **demo mode** chalega, jo bilkul theek hai.
- `JWT_SECRET=...` login ka gupt shabd. Apna khud ka likho.
- `JWT_EXPIRES_IN=7d` token kitne din chalega.
- (Optional) `GEMINI_API_KEY=...` asli AI chalane ke liye. `.env.example` mein yeh line nahi hai, khud jodni hogi.

**Mobile:**
```bash
cd mobile
npm install
npx expo start
```
Phir phone mein Expo Go se QR scan karo. **PC aur phone ek hi Wi-Fi par hon** aur firewall Node ko rokta na ho. Browser mein dekhna ho to `npm run web`.

**Tests:**
```bash
cd animal-rescue-backend
npm test
```
Aakhir mein "ALL BACKEND COMPONENT TESTS PASSED WITH 100% SUCCESS" dikhna chahiye.

**MongoDB ke saath (optional):** `.env` mein asli `MONGO_URI` daalo, phir `npm run seed` (4 rescuers + coordinator + citizen, password `rescuer123`) aur `npm start`.

**Demo login:**

| Role | Phone | Password |
|---|---|---|
| Citizen (demo mode) | `9876543210` | `password123` |
| Rescuer (demo mode) | `9845012345` | `password123` |
| Citizen (MongoDB, `npm run seed` ke baad) | `9888888888` | `rescuer123` |
| Rescuer (MongoDB, `npm run seed` ke baad) | `9876543210` | `rescuer123` |
| Coordinator (sirf `npm run seed` ke baad) | `9999999999` | `rescuer123` |

**Ek poora demo dikhane ka tareeka (2 phone ya 1 phone + browser):**
1. Backend chalao. 2. Ek jagah citizen se login karo (ya "I am a Citizen") aur report bhejo. 3. Doosri jagah (ya pehle Sign out karke) "I am a Rescuer" dabakar rescuer se login karo, alert dekho, Accept karo. 4. Citizen ki Case Tracking screen kholo. 5. Rescuer par "Advance" dabate jao aur citizen ki screen ko 6 second mein badalte dekho. 6. "Complete Rescue" dabao aur QR dikhao.

### In English

**You need:** Node.js, npm. For testing on a phone, the **Expo Go** app. (MongoDB is **not** required; demo mode works.)

**Backend:**
```bash
cd animal-rescue-backend
npm install
copy .env.example .env        # Windows (Mac/Linux: cp .env.example .env)
npm start                     # or: npm run dev  (restarts by itself when files change)
```
Check: open `http://localhost:5000/api/v1/health` in a browser. You should see `{"status":"ok", ...}`.

What `.env` holds:
- `PORT=5000` the server's port.
- `MONGO_URI=...` the MongoDB address. If you leave it as in `.env.example`, it cannot connect and **demo mode** runs, which is perfectly fine.
- `JWT_SECRET=...` the secret for login tokens. Write your own.
- `JWT_EXPIRES_IN=7d` how many days a token lasts.
- (Optional) `GEMINI_API_KEY=...` to run the real AI. This line is not in `.env.example`; you add it yourself.

**Mobile:**
```bash
cd mobile
npm install
npx expo start
```
Then scan the QR with Expo Go on the phone. **The PC and phone must be on the same Wi-Fi** and the firewall must not block Node. To view in a browser, use `npm run web`.

**Tests:**
```bash
cd animal-rescue-backend
npm test
```
At the end you should see "ALL BACKEND COMPONENT TESTS PASSED WITH 100% SUCCESS".

**With MongoDB (optional):** put a real `MONGO_URI` in `.env`, then run `npm run seed` (4 rescuers + a coordinator + a citizen, password `rescuer123`) and `npm start`.

**Demo logins:**

| Role | Phone | Password |
|---|---|---|
| Citizen (demo mode) | `9876543210` | `password123` |
| Rescuer (demo mode) | `9845012345` | `password123` |
| Citizen (MongoDB, after `npm run seed`) | `9888888888` | `rescuer123` |
| Rescuer (MongoDB, after `npm run seed`) | `9876543210` | `rescuer123` |
| Coordinator (only after `npm run seed`) | `9999999999` | `rescuer123` |

**A way to show a full demo (2 phones, or 1 phone + a browser):**
1. Start the backend. 2. In one place, log in as the citizen (or tap "I am a Citizen") and send a report. 3. In the other (or after signing out), tap "I am a Rescuer", log in as the rescuer, see the alert, tap Accept. 4. Open the citizen's Case Tracking screen. 5. Keep tapping "Advance" on the rescuer side and watch the citizen's screen change within 6 seconds. 6. Tap "Complete Rescue" and show the QR.

---

## 13. Mentor pooche to / If your mentor asks

### Hinglish mein

**Q1. Rescuer kaise chuna jata hai?**
Chaar cheezon ka number: paas hona 40%, free hona 30%, us jaanwar ko sambhalna 20%, pichhla record 10%. Sabse zyada number wala chuna jata hai. AI ki urgency isme nahi judti. (Section 6.)

**Q2. AI fail ho jaye to?**
5 second ka intezaar, phir keyword wala simple niyam. Citizen ko hamesha safe salaah milti hai. AI dawai ya bimari ki baat nahi karta. (Section 7.)

**Q3. Agar rescuer jawaab hi na de?**
5 minute ka timer. Phir agla rescuer. Zyada se zyada 3 koshish. Uske baad coordinator ko haath se sambhalna hai. (Section 5, "Agar koi Accept hi na kare".)

**Q4. Password safe kaise hai?**
Password kabhi seedha save nahi hota. `bcrypt` se hash banta hai. Login ke baad ek token milta hai jo 7 din chalta hai.

**Q5. Bina database ke kaise chalta hai?**
Demo mode: data memory mein rehta hai aur `dev-store.json` mein save hota hai. Server band-chalu karne par data wapas aata hai. (Section 10.)

**Q6. Aapka project abhi kitna poora hai?**
Server ka lagbhag poora logic taiyar aur tested hai, mobile ki 15 screens jud chuki hain. Live map, asli push notification, photo upload, coordinator ki screen aur QR scanner abhi baaki hain. (Section 11.) Isse imaandari se batana achha lagta hai.

**Q7. QR code kya karta hai?**
Rescue ke baad har jaanwar ka ek permanent record banta hai. QR us record ki pehchaan hai. Collar par laga ho aur jaanwar dobara mile, to scan karke uski purani jaankari milti hai.

### In English

**Q1. How is the rescuer chosen?**
A score from four things: closeness 40%, being free 30%, handling that animal 20%, past record 10%. The highest score wins. The AI urgency is not part of it. (Section 6.)

**Q2. What if the AI fails?**
A 5-second wait, then a simple keyword rule. The citizen always gets safe advice. The AI never talks about medicine or illness. (Section 7.)

**Q3. What if the rescuer never replies?**
A 5-minute timer. Then the next rescuer. At most 3 attempts. After that a coordinator has to handle it by hand. (Section 5, "If nobody accepts".)

**Q4. How are passwords kept safe?**
A password is never saved as it is. `bcrypt` makes a hash. After login a token is issued, valid for 7 days.

**Q5. How does it run without a database?**
Demo mode: data lives in memory and is saved to `dev-store.json`. After the server is stopped and started again, the data comes back. (Section 10.)

**Q6. How complete is your project right now?**
Almost all the server logic is ready and tested, and all 15 mobile screens are connected. The live map, real push notifications, photo upload, a coordinator screen and a QR scanner are still to do. (Section 11.) Saying this honestly makes a good impression.

**Q7. What does the QR code do?**
After a rescue, every animal gets a permanent record. The QR is that record's identity. If it is on a collar and the animal is found again, scanning it brings up its earlier information.

---

## 14. Chhota shabdkosh / Small glossary

| Shabd / Word | Hinglish matlab | Plain meaning |
|---|---|---|
| **Server / Backend** | Woh computer jo saara kaam sambhalta hai | The computer behind the scenes that does the work |
| **Mobile app / Frontend** | Jo phone par dikhta hai | What you see on the phone |
| **API** | Phone aur server ke beech baat karne ka tareeka | The way the phone and server talk |
| **Endpoint / Route** | Server ka ek khaas address (jaise `/reports`) | One specific address of the server (like `/reports`) |
| **Database** | Data ka godown | A store where data is kept |
| **MongoDB** | Ek tarah ka database | One kind of database |
| **Demo mode** | Bina database ke, memory + ek file se chalna | Running without a database, using memory + a file |
| **Token / JWT** | Login ke baad mila entry pass | An entry pass given after login |
| **Hash (bcrypt)** | Password ko aisa ulta-pulta karna ki wapas na nikle | Scrambling a password so it cannot be unscrambled |
| **Middleware** | Raste mein khada guard jo sawaal ko jaanchta hai | A guard standing on the way that checks the request |
| **Controller** | Woh function jo asli kaam karta hai | The function that does the real work |
| **Service** | Bade, dimaag wale kaam ka alag dabba | A separate box for big, brainy jobs |
| **Model** | Data ka dhancha (kaun se khaane hote hain) | The shape of the data (which fields exist) |
| **Case** | Ek ghayal jaanwar ki ek report | One report about one injured animal |
| **Timeline** | Case mein kab kya hua uski list | The list of what happened when in a case |
| **Dispatch** | Case ko sahi rescuer tak bhejna | Sending a case to the right rescuer |
| **Escalation** | Jab pehla raasta na chale to agle ko dena | Passing it up when the first route fails |
| **Triage** | Dekhna ki kaun sa case kitna zaroori hai | Judging how urgent each case is |
| **Haversine** | Do GPS points ke beech doori nikalne ka formula | A formula for distance between two GPS points |
| **Geocoding (reverse)** | GPS ank se padhne layak address nikalna | Turning GPS numbers into a readable address |
| **Socket.IO** | Server aur phone ke beech lagatar khuli line | A line kept open between server and phone |
| **Polling** | Har kuch second mein jaakar poochna "kuch naya?" | Asking "anything new?" every few seconds |
| **AsyncStorage** | Phone ki apni chhoti diary | The phone's own small notebook |
| **QR code** | Scan karne par jaankari kholne wala chitr | A picture that opens information when scanned |
| **Expo / React Native** | Phone app banane ke auzaar | Tools for building phone apps |
| **Guest** | Bina login wala user | A user without a login |
| **.env** | Gupt settings ki file (git par nahi jaati) | A file of secret settings (not committed to git) |
