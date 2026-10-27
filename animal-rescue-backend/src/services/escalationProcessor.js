const mongoose = require('mongoose');
const Case = require('../models/Case');
const Escalation = require('../models/Escalation');
const {
  isDbConnected,
  getCase,
  updateCase,
  getAllEscalations,
  updateEscalation,
} = require('../utils/devStore');

let processorTimer = null;
let isProcessing = false;

const DEFAULT_CHECK_INTERVAL_MS = parseInt(process.env.ESCALATION_CHECK_INTERVAL_MS, 10) || 15 * 1000; // 15 seconds
const LOCK_TIMEOUT_MS = parseInt(process.env.ESCALATION_LOCK_TIMEOUT_MS, 10) || 2 * 60 * 1000; // 2 minutes

function checkDbConnected() {
  return typeof isDbConnected === 'function' ? isDbConnected() : mongoose.connection?.readyState === 1;
}

async function saveEscalationDoc(doc) {
  if (typeof doc.save === 'function') {
    return await doc.save();
  }
  return updateEscalation(doc._id, doc);
}

/**
 * Recovers escalations that got stuck in 'processing' status
 * (e.g. if another worker or instance crashed midway).
 */
async function recoverStuckProcessingEscalations() {
  try {
    const stuckCutoff = new Date(Date.now() - LOCK_TIMEOUT_MS);
    if (checkDbConnected()) {
      const result = await Escalation.updateMany(
        {
          status: 'processing',
          claimedAt: { $lt: stuckCutoff },
        },
        {
          $set: {
            status: 'pending',
            claimedAt: null,
            note: 'Auto-recovered from crashed worker lock',
          },
        }
      );
      if (result && result.modifiedCount > 0) {
        console.warn(`[ESCALATION RECOVERY] Recovered ${result.modifiedCount} stuck processing escalation(s)`);
      }
      return result ? result.modifiedCount : 0;
    } else {
      const all = getAllEscalations();
      let recovered = 0;
      for (const e of all) {
        if (e.status === 'processing' && e.claimedAt && new Date(e.claimedAt) < stuckCutoff) {
          updateEscalation(e._id, {
            status: 'pending',
            claimedAt: null,
            note: 'Auto-recovered from crashed worker lock',
          });
          recovered++;
        }
      }
      return recovered;
    }
  } catch (err) {
    console.error('Error recovering stuck processing escalations:', err.message);
    return 0;
  }
}

/**
 * Process a single claimed expired escalation.
 */
async function handleExpiredEscalation(escalation) {
  // Lazy require dispatchService to avoid circular dependency
  const { dispatchCase } = require('./dispatchService');

  try {
    const caseDoc = checkDbConnected()
      ? await Case.findById(escalation.caseId)
      : getCase(escalation.caseId);

    // If case no longer exists, cancel the escalation
    if (!caseDoc) {
      escalation.status = 'cancelled';
      escalation.note = 'Parent case no longer exists';
      await saveEscalationDoc(escalation);
      return;
    }

    // If case is already accepted, completed, or cancelled, deactivate escalation
    const nonAssignedStatuses = [
      'accepted',
      'completed',
      'cancelled',
      'on_the_way',
      'reached_location',
      'animal_picked_up',
      'at_shelter',
      'treatment_started',
    ];

    if (nonAssignedStatuses.includes(caseDoc.status)) {
      escalation.status = caseDoc.status === 'accepted' ? 'accepted' : 'cancelled';
      escalation.note = `Case is already in status: ${caseDoc.status}`;
      await saveEscalationDoc(escalation);
      return;
    }

    // If case has been reassigned to a different rescuer
    if (
      caseDoc.assignedRescuer &&
      escalation.rescuerId &&
      caseDoc.assignedRescuer.toString() !== escalation.rescuerId.toString()
    ) {
      escalation.status = 'cancelled';
      escalation.note = 'Case reassigned to another responder';
      await saveEscalationDoc(escalation);
      return;
    }

    // Rescuer timed out on this attempt!
    const responseTimeSeconds = escalation.alertedAt
      ? Math.round((Date.now() - new Date(escalation.alertedAt).getTime()) / 1000)
      : Math.round((parseInt(process.env.ESCALATION_TIMEOUT_MS, 10) || 300000) / 1000);

    escalation.status = 'timeout';
    escalation.responseTimeSeconds = responseTimeSeconds;
    escalation.note = `Rescuer failed to respond within escalation window. Auto-escalating to attempt #${escalation.attemptNumber + 1}.`;
    await saveEscalationDoc(escalation);

    console.log(
      `[ESCALATION TIMEOUT] Persistent escalation triggered for Case ${caseDoc._id} (Attempt #${escalation.attemptNumber}, Rescuer: ${escalation.rescuerId})`
    );

    const timelineEntry = {
      status: 'timeout',
      timestamp: new Date(),
      note: `Attempt #${escalation.attemptNumber} timed out after ${responseTimeSeconds}s. Rescuer did not respond.`,
    };

    if (typeof caseDoc.save === 'function') {
      caseDoc.timeline.push(timelineEntry);
      await caseDoc.save();
    } else {
      updateCase(caseDoc._id, {
        timeline: [timelineEntry],
      });
    }

    // Trigger next dispatch attempt
    await dispatchCase(caseDoc._id, escalation.attemptNumber + 1);
  } catch (err) {
    console.error(`Error processing expired escalation ${escalation._id}:`, err);
    // On unexpected error, do not leave stuck forever: reset to pending if still within reason
    try {
      escalation.status = 'pending';
      escalation.claimedAt = null;
      await saveEscalationDoc(escalation);
    } catch (saveErr) {
      /* ignore */
    }
  }
}

/**
 * Queries and claims expired pending escalations atomically.
 * Returns the number of escalations processed.
 */
async function processExpiredEscalations() {
  if (isProcessing) return 0;

  isProcessing = true;
  let processedCount = 0;

  try {
    // 1. Recover any stuck locks
    await recoverStuckProcessingEscalations();

    // 2. Claim and process expired escalations one by one
    if (checkDbConnected()) {
      while (true) {
        const now = new Date();
        // Atomic findAndModify: only 1 instance will succeed in claiming the document
        const escalation = await Escalation.findOneAndUpdate(
          {
            status: 'pending',
            expiresAt: { $lte: now },
          },
          {
            $set: {
              status: 'processing',
              claimedAt: now,
            },
          },
          { new: true }
        );

        if (!escalation) {
          break; // No more expired escalations to claim
        }

        processedCount++;
        await handleExpiredEscalation(escalation);
      }
    } else {
      // DevStore in-memory processing
      while (true) {
        const now = new Date();
        const all = getAllEscalations();
        const pendingExpired = all.find(
          (e) => e.status === 'pending' && new Date(e.expiresAt).getTime() <= now.getTime()
        );
        if (!pendingExpired) break;

        const claimed = updateEscalation(pendingExpired._id, {
          status: 'processing',
          claimedAt: now,
        });

        processedCount++;
        await handleExpiredEscalation(claimed);
      }
    }
  } catch (err) {
    console.error('Error in escalation processor tick:', err);
  } finally {
    isProcessing = false;
  }

  return processedCount;
}

/**
 * Starts the periodic background escalation checker.
 */
function startEscalationProcessor(intervalMs = DEFAULT_CHECK_INTERVAL_MS) {
  if (processorTimer) {
    return; // Already running
  }

  console.log(`⏱️ Persistent Escalation Processor started (check interval: ${intervalMs}ms)`);

  // Run initial check after 2 seconds to catch any escalations that expired during downtime
  setTimeout(() => {
    processExpiredEscalations().catch((err) => {
      console.error('Error in initial escalation scan:', err);
    });
  }, 2000);

  processorTimer = setInterval(async () => {
    try {
      await processExpiredEscalations();
    } catch (err) {
      console.error('Unhandled error in escalation timer loop:', err);
    }
  }, intervalMs);

  // Allow Node process to exit cleanly if this is the only active timer
  if (processorTimer.unref) {
    processorTimer.unref();
  }
}

/**
 * Stops the periodic background escalation checker.
 */
function stopEscalationProcessor() {
  if (processorTimer) {
    clearInterval(processorTimer);
    processorTimer = null;
    console.log('🛑 Persistent Escalation Processor stopped');
  }
}

function isProcessorRunning() {
  return processorTimer !== null;
}

module.exports = {
  startEscalationProcessor,
  stopEscalationProcessor,
  processExpiredEscalations,
  handleExpiredEscalation,
  recoverStuckProcessingEscalations,
  isProcessorRunning,
  LOCK_TIMEOUT_MS,
  DEFAULT_CHECK_INTERVAL_MS,
};
