const Rescuer = require('../models/Rescuer');
const { isDbConnected, getRescuerByUserId } = require('./devStore');

// The rescuer profile that belongs to a signed-in user (null if that user is not a rescuer)
async function findRescuerForUser(userId) {
  if (!userId) return null;
  if (isDbConnected()) {
    return Rescuer.findOne({ user: userId });
  }
  return getRescuerByUserId(userId) || null;
}

// Compares two ids whether they are strings, ObjectIds or populated documents
function sameId(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  const idA = a._id !== undefined ? a._id : a;
  const idB = b._id !== undefined ? b._id : b;
  return String(idA) === String(idB);
}

module.exports = { findRescuerForUser, sameId };
