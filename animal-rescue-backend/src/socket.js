const { Server } = require('socket.io');
const Rescuer = require('./models/Rescuer');

let io = null;

/**
 * Initialize Socket.IO with HTTP Server
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Join room for a specific rescue case
    socket.on('join_case', ({ caseId }) => {
      if (!caseId) return;
      const room = `case_${caseId}`;
      socket.join(room);
      console.log(`[SOCKET] Socket ${socket.id} joined room ${room}`);
      socket.emit('joined_case', { caseId, room });
    });

    // Leave case room
    socket.on('leave_case', ({ caseId }) => {
      if (!caseId) return;
      const room = `case_${caseId}`;
      socket.leave(room);
      console.log(`[SOCKET] Socket ${socket.id} left room ${room}`);
    });

    // Rescuer location stream (~5s interval from mobile/GPS)
    socket.on('rescuer_location_update', async (data) => {
      const { caseId, rescuerId, latitude, longitude, heading, speed } = data;
      if (!caseId || latitude === undefined || longitude === undefined) return;

      const room = `case_${caseId}`;
      const payload = {
        caseId,
        rescuerId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        heading: heading || 0,
        speed: speed || 0,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all clients in the case room (citizen and coordinator)
      io.to(room).emit('rescuer_location', payload);

      // Asynchronously update rescuer's last known location in database
      if (rescuerId) {
        try {
          await Rescuer.findByIdAndUpdate(rescuerId, {
            location: { latitude: payload.latitude, longitude: payload.longitude },
          });
        } catch (dbErr) {
          console.error('[SOCKET] Error updating rescuer location in DB:', dbErr.message);
        }
      }
    });

    // Live case status event
    socket.on('case_status_update', (data) => {
      const { caseId, status, note } = data;
      if (!caseId || !status) return;

      const room = `case_${caseId}`;
      io.to(room).emit('case_status', {
        caseId,
        status,
        note: note || '',
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  return io;
}

/**
 * Emit an event to all clients watching a specific case
 */
function emitCaseEvent(caseId, event, payload) {
  if (io && caseId) {
    const room = `case_${caseId}`;
    io.to(room).emit(event, {
      caseId,
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  initSocket,
  getIO,
  emitCaseEvent,
};
