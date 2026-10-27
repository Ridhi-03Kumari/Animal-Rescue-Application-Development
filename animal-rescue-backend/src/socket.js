const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Case = require('./models/Case');
const Rescuer = require('./models/Rescuer');
const { JWT_SECRET } = require('./config/jwt');
const { findRescuerForUser, sameId } = require('./utils/rescuerLookup');
const { isDbConnected, getCase, updateRescuer } = require('./utils/devStore');

let io = null;

async function loadCase(caseId) {
  if (!caseId) return null;
  return isDbConnected()
    ? await Case.findById(caseId).select('assignedRescuer citizen status').lean()
    : getCase(caseId);
}

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

  // ---------------------------------------------------------------------------
  // 1. Socket Authentication Middleware
  // ---------------------------------------------------------------------------
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers && socket.handshake.headers.authorization;
      const bearerToken = authHeader && authHeader.replace(/^Bearer\s+/i, '');
      const token =
        socket.handshake.auth?.token ||
        bearerToken ||
        socket.handshake.query?.token;

      if (!token) {
        const err = new Error('Authentication required: No token provided');
        err.data = { code: 'UNAUTHORIZED' };
        return next(err);
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;

      // Look up rescuer profile if user is a rescuer
      if (decoded.role === 'rescuer') {
        const rescuer = await findRescuerForUser(decoded.id);
        socket.rescuer = rescuer;
      }

      next();
    } catch (authErr) {
      const err = new Error('Authentication failed: Invalid or expired token');
      err.data = { code: 'INVALID_TOKEN' };
      next(err);
    }
  });

  // ---------------------------------------------------------------------------
  // 2. Connection and Event Handlers
  // ---------------------------------------------------------------------------
  io.on('connection', (socket) => {
    const userRole = socket.user?.role || 'unknown';
    const userId = socket.user?.id || 'unknown';
    console.log(`[SOCKET] Authenticated client connected: ${socket.id} (user: ${userId}, role: ${userRole})`);

    // Handler for joining a private case room
    const handleJoinCase = async (data, callback) => {
      try {
        const caseId = data?.caseId;
        if (!caseId) {
          const errMsg = 'caseId is required to join a case room';
          socket.emit('case_error', { error: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        const caseDoc = await loadCase(caseId);
        if (!caseDoc) {
          const errMsg = 'Case not found';
          socket.emit('case_error', { caseId, error: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        // Authorization checks
        const role = socket.user?.role;
        let isAuthorized = false;

        if (['coordinator', 'admin'].includes(role)) {
          isAuthorized = true;
        } else if (role === 'citizen') {
          // Citizen can only join cases they submitted
          if (sameId(caseDoc.citizen, socket.user?.id)) {
            isAuthorized = true;
          }
        } else if (role === 'rescuer') {
          // Rescuer can only join their assigned case
          if (socket.rescuer && sameId(caseDoc.assignedRescuer, socket.rescuer._id)) {
            isAuthorized = true;
          }
        }

        if (!isAuthorized) {
          console.warn(`[SOCKET AUTH] User ${userId} (${role}) denied access to Case ${caseId}`);
          const errMsg = 'Unauthorized: You are not authorized to access this private case room';
          socket.emit('case_error', { caseId, error: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        const room = `case_${caseId}`;
        socket.join(room);
        console.log(`[SOCKET] User ${userId} joined room ${room}`);

        socket.emit('joined_case', { caseId, room });
        socket.emit('case:joined', { caseId, room });
        if (typeof callback === 'function') callback({ success: true, caseId, room });
      } catch (err) {
        console.error('[SOCKET ERROR in join_case]:', err.message);
        socket.emit('case_error', { error: 'Internal error processing case room subscription' });
        if (typeof callback === 'function') callback({ success: false, error: 'Internal error' });
      }
    };

    socket.on('join_case', handleJoinCase);
    socket.on('case:join', handleJoinCase);

    // Handler for leaving a case room
    const handleLeaveCase = (data, callback) => {
      try {
        const caseId = data?.caseId;
        if (!caseId) return;
        const room = `case_${caseId}`;
        socket.leave(room);
        console.log(`[SOCKET] User ${userId} left room ${room}`);
        socket.emit('left_case', { caseId, room });
        socket.emit('case:left', { caseId, room });
        if (typeof callback === 'function') callback({ success: true, caseId });
      } catch (err) {
        console.error('[SOCKET ERROR in leave_case]:', err.message);
      }
    };

    socket.on('leave_case', handleLeaveCase);
    socket.on('case:leave', handleLeaveCase);

    // Handler for rescuer streaming GPS location updates
    const handleLocationUpdate = async (data, callback) => {
      try {
        const { caseId, heading, speed, timestamp: clientTimestamp } = data || {};
        const latitude = parseFloat(data?.latitude);
        const longitude = parseFloat(data?.longitude);

        if (!caseId || isNaN(latitude) || isNaN(longitude)) {
          const errMsg = 'Valid caseId, latitude (-90 to 90) and longitude (-180 to 180) are required';
          socket.emit('location_error', { caseId, error: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          const errMsg = 'Coordinates out of valid geographical range (-90..90, -180..180)';
          socket.emit('location_error', { caseId, error: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        // Only authenticated rescuers can emit location
        if (socket.user?.role !== 'rescuer' && socket.user?.role !== 'coordinator') {
          const errMsg = 'Only rescuers can stream live location updates';
          socket.emit('location_error', { caseId, error: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        const caseDoc = await loadCase(caseId);
        if (!caseDoc) {
          const errMsg = 'Case not found';
          socket.emit('location_error', { caseId, error: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        // Verify rescuer is assigned to this case
        if (socket.rescuer && !sameId(caseDoc.assignedRescuer, socket.rescuer._id)) {
          const errMsg = 'Unauthorized: Rescuer is not assigned to this rescue case';
          socket.emit('location_error', { caseId, error: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        const rescuerProfileId = socket.rescuer ? String(socket.rescuer._id) : String(userId);
        const serverTimestamp = new Date().toISOString();

        const payload = {
          caseId: String(caseId),
          rescuerId: rescuerProfileId,
          latitude,
          longitude,
          heading: typeof heading === 'number' ? heading : 0,
          speed: typeof speed === 'number' ? speed : 0,
          clientTimestamp: clientTimestamp || null,
          serverTimestamp,
        };

        const room = `case_${caseId}`;

        // Broadcast to clients in this case room only
        io.to(room).emit('rescuer_location', payload);
        io.to(room).emit('rescuer:location', payload);

        // Update rescuer location in database
        if (socket.rescuer?._id) {
          if (isDbConnected()) {
            await Rescuer.findByIdAndUpdate(socket.rescuer._id, {
              location: { latitude, longitude },
            });
          } else {
            updateRescuer(socket.user.id, {
              location: { latitude, longitude },
            });
          }
        }

        if (typeof callback === 'function') {
          callback({ success: true, serverTimestamp });
        }
      } catch (err) {
        console.error('[SOCKET ERROR in rescuer_location_update]:', err.message);
        socket.emit('location_error', { error: 'Internal error processing location update' });
        if (typeof callback === 'function') callback({ success: false, error: 'Internal error' });
      }
    };

    socket.on('rescuer_location_update', handleLocationUpdate);
    socket.on('rescuer:location', handleLocationUpdate);

    // Reject direct client mutations of case status
    socket.on('case_status_update', (data, callback) => {
      const errMsg = 'Case status changes must be submitted via REST API endpoints';
      socket.emit('case_error', { error: errMsg });
      if (typeof callback === 'function') callback({ success: false, error: errMsg });
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
    const serverTimestamp = new Date().toISOString();
    const fullPayload = {
      caseId: String(caseId),
      ...payload,
      serverTimestamp,
    };

    io.to(room).emit(event, fullPayload);

    // Also emit PRD-aligned aliases
    if (event === 'case_status') {
      io.to(room).emit('case:updated', fullPayload);
    }
    if (event === 'rescuer_location') {
      io.to(room).emit('rescuer:location', fullPayload);
    }
  }
}

module.exports = {
  initSocket,
  getIO,
  emitCaseEvent,
};
