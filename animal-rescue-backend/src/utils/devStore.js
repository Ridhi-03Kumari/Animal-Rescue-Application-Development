const mongoose = require('mongoose');

/**
 * In-memory Development Store
 * Used automatically when MongoDB is not connected locally,
 * ensuring the prototype app and demo run seamlessly without errors.
 */

const casesMap = new Map();
const animalsMap = new Map();

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
