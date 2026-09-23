const mongoose = require('mongoose');

/**
 * In-memory Development Store
 * Used automatically when MongoDB is not connected locally,
 * ensuring the prototype app and demo run seamlessly without errors.
 */

const casesMap = new Map();
const animalsMap = new Map();

// Seed initial realistic emergency alerts for demo
function seedInitialDemoCases() {
  if (casesMap.size === 0) {
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

    casesMap.set(demo1._id, { ...demo1, toObject: () => demo1 });
    casesMap.set(demo2._id, { ...demo2, toObject: () => demo2 });
  }
}

seedInitialDemoCases();

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function saveCase(caseData) {
  const id = caseData._id ? caseData._id.toString() : new mongoose.Types.ObjectId().toString();
  const doc = {
    ...caseData,
    _id: id,
    createdAt: caseData.createdAt || new Date(),
    updatedAt: new Date(),
    toObject: function () {
      return this;
    },
  };
  casesMap.set(id, doc);
  return doc;
}

function getCase(id) {
  return casesMap.get(id ? id.toString() : '');
}

function getAllCases(filter = {}) {
  const list = Array.from(casesMap.values());
  if (filter.status) {
    return list.filter((c) => c.status === filter.status);
  }
  return list;
}

function updateCase(id, updates) {
  const existing = casesMap.get(id ? id.toString() : '');
  if (!existing) return null;
  const updated = {
    ...existing,
    ...updates,
    timeline: [...(existing.timeline || []), ...(updates.timeline || [])],
    updatedAt: new Date(),
    toObject: function () {
      return this;
    },
  };
  casesMap.set(id.toString(), updated);
  return updated;
}

function saveAnimal(animalData) {
  const id = animalData._id ? animalData._id.toString() : new mongoose.Types.ObjectId().toString();
  const doc = {
    ...animalData,
    _id: id,
    rescueDate: animalData.rescueDate || new Date(),
    createdAt: new Date(),
    toObject: function () {
      return this;
    },
  };
  animalsMap.set(id, doc);
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

module.exports = {
  isDbConnected,
  saveCase,
  getCase,
  getAllCases,
  updateCase,
  saveAnimal,
  getAnimalByCaseId,
  getAnimalById,
  casesMap,
  animalsMap,
};
