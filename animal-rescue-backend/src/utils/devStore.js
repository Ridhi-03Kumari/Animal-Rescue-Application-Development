const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * In-memory Development Store
 * Used automatically when MongoDB is not connected locally,
 * ensuring the prototype app and demo run seamlessly without errors.
 *
 * Data is also saved to a small JSON file (data/dev-store.json) so accounts, reports and
 * rescued-animal records survive a server restart. Set DEV_STORE_PERSIST=false to turn that off
 * (the automated tests do), or DEV_STORE_FILE to store it somewhere else.
 */

const PERSIST = process.env.DEV_STORE_PERSIST !== 'false';
const DATA_FILE = process.env.DEV_STORE_FILE || path.join(__dirname, '..', '..', 'data', 'dev-store.json');

const casesMap = new Map();
const animalsMap = new Map();
const usersMap = new Map();
const rescuersMap = new Map();

// Every stored document gets toObject() so it behaves like a Mongoose document in the controllers
function asDoc(data) {
  return {
    ...data,
    toObject: function () {
      return this;
    },
  };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
let saveTimer = null;

function writeToDisk() {
  if (!PERSIST) return;
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const snapshot = {
      savedAt: new Date().toISOString(),
      users: Array.from(usersMap.values()),
      rescuers: Array.from(rescuersMap.values()),
      cases: Array.from(casesMap.values()),
      animals: Array.from(animalsMap.values()),
    };
    // Write to a temp file first so a crash mid-write can never corrupt the saved data
    const tmp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(snapshot));
    fs.renameSync(tmp, DATA_FILE);
  } catch (err) {
    console.warn('⚠️ Could not save dev store to disk:', err.message);
  }
}

// Debounced so a burst of updates becomes a single write
function persist() {
  if (!PERSIST || saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeToDisk();
  }, 250);
}

function flushNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    writeToDisk();
  }
}

function loadFromDisk() {
  if (!PERSIST || !fs.existsSync(DATA_FILE)) return;
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw, (key, value) =>
      typeof value === 'string' && ISO_DATE.test(value) ? new Date(value) : value
    );
    (data.users || []).forEach((u) => usersMap.set(String(u.phone).trim(), asDoc(u)));
    (data.rescuers || []).forEach((r) => rescuersMap.set(String(r.user), asDoc(r)));
    (data.cases || []).forEach((c) => casesMap.set(String(c._id), asDoc(c)));
    (data.animals || []).forEach((a) => animalsMap.set(String(a._id), asDoc(a)));
    console.log(
      `💾 Loaded saved data: ${usersMap.size} users, ${casesMap.size} cases, ${animalsMap.size} animals`
    );
  } catch (err) {
    // Keep the unreadable file for inspection and carry on with a clean store
    console.warn('⚠️ Saved dev store could not be read, starting fresh:', err.message);
    try {
      fs.renameSync(DATA_FILE, `${DATA_FILE}.corrupt-${Date.now()}`);
    } catch (e) {
      /* ignore */
    }
  }
}

if (PERSIST) {
  process.on('exit', flushNow);
  ['SIGINT', 'SIGTERM'].forEach((sig) =>
    process.on(sig, () => {
      flushNow();
      process.exit(0);
    })
  );
}

// ---------------------------------------------------------------------------
// Seed demo data (only fills gaps; anything loaded from disk wins)
// ---------------------------------------------------------------------------
const bcrypt = require('bcryptjs');
const defaultHash = bcrypt.hashSync('password123', 10);

const demoCitizen = {
  _id: '66f001122334455667788991',
  name: 'Ananya Sharma',
  phone: '9876543210',
  passwordHash: defaultHash,
  role: 'citizen',
  profilePhotoUrl: '',
};

const demoRescuerUser = {
  _id: '66f001122334455667788992',
  name: 'Rajesh Kumar',
  phone: '9845012345',
  passwordHash: defaultHash,
  role: 'rescuer',
  profilePhotoUrl: '',
};

const demoRescuerProfile = {
  _id: 'mock_rescuer_01',
  user: demoRescuerUser._id,
  organizationName: 'Bengaluru Animal Rescue Squad (BARS)',
  animalsHandled: ['dog', 'cat', 'cattle', 'bird'],
  location: { latitude: 12.9716, longitude: 77.5946 },
  available: true,
  isVerified: true,
  verificationStatus: 'approved',
  activeCaseId: null,
  completedCasesCount: 14,
  responseRate: 0.95,
};

function seedDemoAccounts() {
  if (!usersMap.has(demoCitizen.phone)) usersMap.set(demoCitizen.phone, asDoc(demoCitizen));
  if (!usersMap.has(demoRescuerUser.phone)) usersMap.set(demoRescuerUser.phone, asDoc(demoRescuerUser));
  if (!rescuersMap.has(demoRescuerUser._id)) rescuersMap.set(demoRescuerUser._id, asDoc(demoRescuerProfile));
}

// Seed initial realistic emergency alerts for demo
function seedInitialDemoCases() {
  if (casesMap.size > 0) return false;

  const demo1 = {
    _id: '66f001122334455667788001',
    animalType: 'dog',
    description: 'Street dog hit by scooter on 100ft Road, limping and bleeding from hind leg',
    urgency: 'HIGH',
    status: 'assigned',
    location: {
      latitude: 12.9784,
      longitude: 77.6408,
      address: '100 Feet Rd, Indiranagar, Bengaluru',
    },
    reporterName: 'Ananya Sharma',
    reporterPhone: '9876543210',
    createdAt: new Date(Date.now() - 10 * 60000),
    timeline: [
      {
        status: 'reported',
        timestamp: new Date(Date.now() - 10 * 60000),
        note: 'Emergency reported by citizen. AI Urgency: HIGH',
      },
    ],
  };

  const demo2 = {
    _id: '66f001122334455667788002',
    animalType: 'cat',
    description: 'Kitten stuck in stormwater drain pipe, crying and unable to climb out',
    urgency: 'MEDIUM',
    status: 'assigned',
    location: {
      latitude: 12.9352,
      longitude: 77.6245,
      address: '5th Block, Koramangala, Bengaluru',
    },
    reporterName: 'Vikram Rao',
    reporterPhone: '9845012345',
    createdAt: new Date(Date.now() - 25 * 60000),
    timeline: [
      {
        status: 'reported',
        timestamp: new Date(Date.now() - 25 * 60000),
        note: 'Emergency reported by citizen. AI Urgency: MEDIUM',
      },
    ],
  };

  casesMap.set(demo1._id, asDoc(demo1));
  casesMap.set(demo2._id, asDoc(demo2));
  return true;
}

seedDemoAccounts();
loadFromDisk();
seedDemoAccounts(); // re-add demo accounts if an older save file did not contain them
if (seedInitialDemoCases() || PERSIST) persist();

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
function saveCase(caseData) {
  const id = caseData._id ? caseData._id.toString() : new mongoose.Types.ObjectId().toString();
  const doc = asDoc({
    ...caseData,
    _id: id,
    createdAt: caseData.createdAt || new Date(),
    updatedAt: new Date(),
  });
  casesMap.set(id, doc);
  persist();
  return doc;
}

function getCase(id) {
  return casesMap.get(id ? id.toString() : '');
}

// Used to recognise a report that was sent twice (double tap, retry after a timeout)
function findCaseByClientRequestId(clientRequestId) {
  if (!clientRequestId) return undefined;
  return Array.from(casesMap.values()).find((c) => c.clientRequestId === clientRequestId);
}

// Newest first, like the Mongo query (.sort({ createdAt: -1 })) in the controllers
function getAllCases(filter = {}) {
  let list = Array.from(casesMap.values());
  if (filter.status) {
    list = list.filter((c) => c.status === filter.status);
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateCase(id, updates) {
  const existing = casesMap.get(id ? id.toString() : '');
  if (!existing) return null;
  const updated = asDoc({
    ...existing,
    ...updates,
    timeline: [...(existing.timeline || []), ...(updates.timeline || [])],
    updatedAt: new Date(),
  });
  casesMap.set(id.toString(), updated);
  persist();
  return updated;
}

// ---------------------------------------------------------------------------
// Animals
// ---------------------------------------------------------------------------
function saveAnimal(animalData) {
  const id = animalData._id ? animalData._id.toString() : new mongoose.Types.ObjectId().toString();
  const doc = asDoc({
    ...animalData,
    _id: id,
    rescueDate: animalData.rescueDate || new Date(),
    createdAt: new Date(),
  });
  animalsMap.set(id, doc);
  persist();
  return doc;
}

function getAnimalByCaseId(caseId) {
  return Array.from(animalsMap.values()).find(
    (a) => a.caseId && a.caseId.toString() === caseId.toString()
  );
}

function getAnimalById(id) {
  return animalsMap.get(id ? id.toString() : '');
}

// Newest rescue first, like the Mongo query (.sort({ rescueDate: -1 }))
function getAllAnimals() {
  return Array.from(animalsMap.values()).sort(
    (a, b) => new Date(b.rescueDate) - new Date(a.rescueDate)
  );
}

// Only fields that were actually sent are changed (undefined values are ignored)
function updateAnimal(id, updates) {
  const existing = animalsMap.get(id ? id.toString() : '');
  if (!existing) return null;
  const defined = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
  const updated = asDoc({ ...existing, ...defined });
  animalsMap.set(id.toString(), updated);
  persist();
  return updated;
}

// ---------------------------------------------------------------------------
// Users and rescuers
// ---------------------------------------------------------------------------
function getUserByPhone(phone) {
  return usersMap.get(phone ? phone.toString().trim() : '');
}

function getUserById(id) {
  if (!id) return undefined;
  return Array.from(usersMap.values()).find((u) => u._id === id.toString());
}

function saveUser(userData) {
  const id = userData._id ? userData._id.toString() : new mongoose.Types.ObjectId().toString();
  const doc = asDoc({
    ...userData,
    _id: id,
    createdAt: new Date(),
  });
  usersMap.set(userData.phone.toString().trim(), doc);
  persist();
  return doc;
}

// Rescuer profiles are keyed by the owning user's id
function getRescuerByUserId(userId) {
  return rescuersMap.get(userId ? userId.toString() : '');
}

// Cases store the rescuer *profile* id in assignedRescuer, so look profiles up by that too
function getRescuerById(id) {
  if (!id) return undefined;
  return Array.from(rescuersMap.values()).find((r) => r._id === id.toString());
}

function getAllRescuers() {
  return Array.from(rescuersMap.values());
}

function saveRescuer(rescuerData) {
  const id = rescuerData._id ? rescuerData._id.toString() : new mongoose.Types.ObjectId().toString();
  const doc = asDoc({
    ...rescuerData,
    _id: id,
    available: rescuerData.available !== undefined ? rescuerData.available : true,
    isVerified: true,
    verificationStatus: 'approved',
  });
  rescuersMap.set(rescuerData.user.toString(), doc);
  persist();
  return doc;
}

function updateRescuer(userId, updates) {
  const existing = rescuersMap.get(userId ? userId.toString() : '');
  if (!existing) return null;
  const updated = asDoc({ ...existing, ...updates });
  rescuersMap.set(userId.toString(), updated);
  persist();
  return updated;
}

// ---------------------------------------------------------------------------
// Populate helpers (the in-memory equivalent of Mongoose .populate())
// ---------------------------------------------------------------------------
function publicUser(user) {
  return user ? { _id: user._id, name: user.name, phone: user.phone, role: user.role } : null;
}

function populateRescuer(rescuer) {
  if (!rescuer) return rescuer;
  const user = getUserById(rescuer.user);
  return { ...rescuer, user: publicUser(user) || rescuer.user };
}

function populateCase(caseDoc) {
  if (!caseDoc) return caseDoc;
  const out = { ...caseDoc };
  if (typeof out.assignedRescuer === 'string') {
    const rescuer = getRescuerById(out.assignedRescuer);
    if (rescuer) out.assignedRescuer = populateRescuer(rescuer);
  }
  if (typeof out.citizen === 'string') {
    const citizen = publicUser(getUserById(out.citizen));
    if (citizen) out.citizen = citizen;
  }
  return out;
}

module.exports = {
  isDbConnected,
  persist,
  saveCase,
  getCase,
  findCaseByClientRequestId,
  getAllCases,
  updateCase,
  saveAnimal,
  getAnimalByCaseId,
  getAnimalById,
  getAllAnimals,
  updateAnimal,
  getUserByPhone,
  getUserById,
  saveUser,
  getRescuerByUserId,
  getRescuerById,
  getAllRescuers,
  saveRescuer,
  updateRescuer,
  populateRescuer,
  populateCase,
  casesMap,
  animalsMap,
  usersMap,
  rescuersMap,
};
