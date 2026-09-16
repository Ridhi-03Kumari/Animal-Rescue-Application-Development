/**
 * Notification Service
 * Handles push notifications via Firebase Cloud Messaging (FCM) or console fallback
 */

exports.notifyRescuerNewCase = async (rescuer, caseData, scoreDetails = {}) => {
  const message = {
    title: `🚨 Urgent Animal Rescue: ${caseData.animalType.toUpperCase()}`,
    body: `Urgency: ${caseData.urgency}. Location: (${caseData.location.latitude}, ${caseData.location.longitude})`,
    caseId: caseData._id ? caseData._id.toString() : 'mock-case',
    score: scoreDetails.totalScore || 0,
  };

  console.log(`\n========================================`);
  console.log(`[PUSH NOTIFICATION] -> Sent to Rescuer: ${rescuer.organizationName || rescuer._id}`);
  console.log(`Title: ${message.title}`);
  console.log(`Body: ${message.body}`);
  console.log(`Matching Score: ${scoreDetails.totalScore}`);
  console.log(`========================================\n`);

  // When FCM server credentials are configured in .env, send real FCM push here:
  // if (process.env.FIREBASE_SERVER_KEY && rescuer.fcmToken) { ... }

  return { success: true, messageId: `msg_${Date.now()}` };
};

exports.notifyCitizenStatusUpdate = async (caseData, statusMessage) => {
  console.log(`\n[PUSH NOTIFICATION] -> Sent to Citizen: Case ${caseData._id} updated to "${statusMessage}"`);
  return { success: true };
};

exports.notifyCoordinatorEscalation = async (caseData, reason) => {
  console.log(`\n🚨 [COORDINATOR ALERT] -> Case ${caseData._id} requires manual intervention! Reason: ${reason}`);
  return { success: true };
};
