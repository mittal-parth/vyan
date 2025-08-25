const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory "DB"
const SESSIONS = new Map();
const SESSION_TTL = 300; // 5 min timeout
const TOKEN_TTL = 120; // 2 minutes for QR token

// Security configuration
const SECRET_KEY = process.env.HMAC_SECRET || 'your-secret-key-change-in-production';
const EPOCH_WINDOW = 120; // 2 minutes

/**
 * Generate HMAC token for station QR code
 * @param {string} stationId 
 * @returns {object} {token, expiresAt}
 */
function generateStationToken(stationId) {
  const currentEpoch = Math.floor(Date.now() / 1000 / EPOCH_WINDOW);
  const payload = `${stationId}:${currentEpoch}`;
  const token = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex').substring(0, 16);
  const expiresAt = (currentEpoch + 1) * EPOCH_WINDOW * 1000; // Convert back to milliseconds
  
  return { token, expiresAt };
}

/**
 * Verify HMAC token for station
 * @param {string} stationId 
 * @param {string} token 
 * @param {number} expiresAt 
 * @returns {boolean}
 */
function verifyStationToken(stationId, token, expiresAt) {
  const now = Date.now();
  
  // Check if token is expired
  if (now > expiresAt) {
    return false;
  }
  
  // Check current epoch
  const currentEpoch = Math.floor(now / 1000 / EPOCH_WINDOW);
  const currentPayload = `${stationId}:${currentEpoch}`;
  const currentToken = crypto.createHmac('sha256', SECRET_KEY).update(currentPayload).digest('hex').substring(0, 16);
  
  if (token === currentToken) {
    return true;
  }
  
  // Check previous epoch (to handle edge cases around epoch boundary)
  const prevEpoch = currentEpoch - 1;
  const prevPayload = `${stationId}:${prevEpoch}`;
  const prevToken = crypto.createHmac('sha256', SECRET_KEY).update(prevPayload).digest('hex').substring(0, 16);
  
  return token === prevToken;
}

/**
 * Generate QR data for station
 */
app.get('/station/:stationId/qr', (req, res) => {
  const { stationId } = req.params;
  
  const { token, expiresAt } = generateStationToken(stationId);
  
  const qrData = {
    type: 'vyan_station',
    stationId,
    token,
    expiresAt,
    timestamp: Date.now(),
    version: '1.0'
  };
  
  res.json({
    qrData,
    qrString: JSON.stringify(qrData),
    expiresIn: Math.floor((expiresAt - Date.now()) / 1000) // seconds
  });
});

/**
 * Start a new session with token verification
 */
app.post('/session/start', (req, res) => {
  const { stationId, userId, token, expiresAt } = req.body;
  
  if (!stationId || !userId || !token || !expiresAt) {
    return res.status(400).json({ 
      error: 'Missing required fields: stationId, userId, token, expiresAt' 
    });
  }
  
  // Verify the token
  if (!verifyStationToken(stationId, token, expiresAt)) {
    return res.status(401).json({ 
      error: 'Invalid or expired QR token',
      code: 'INVALID_TOKEN'
    });
  }
  
  // Expire old sessions for this station
  for (const [sessionId, session] of SESSIONS.entries()) {
    if (session.stationId === stationId && !['completed', 'aborted'].includes(session.status)) {
      SESSIONS.delete(sessionId);
    }
  }
  
  const sessionId = uuidv4();
  const session = {
    stationId,
    userId,
    status: 'pending',
    createdAt: Date.now(),
    tokenUsed: token // Store token for audit
  };
  
  SESSIONS.set(sessionId, session);
  
  res.json({ 
    sessionId,
    session,
    message: 'Session started successfully'
  });
});

/**
 * Update session status
 */
app.post('/session/update', (req, res) => {
  const { sessionId, status, batterySlot, transactionHash } = req.body;
  
  if (!sessionId || !status) {
    return res.status(400).json({ error: 'Missing sessionId or status' });
  }
  
  const session = SESSIONS.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.status = status;
  session.updatedAt = Date.now();
  
  // Store additional data for battery release
  if (batterySlot) session.batterySlot = batterySlot;
  if (transactionHash) session.transactionHash = transactionHash;
  
  // Auto-cleanup if final
  if (['completed', 'aborted'].includes(status)) {
    session.endedAt = Date.now();
    
    // Trigger inventory update notification
    if (status === 'completed') {
      // TODO: Trigger AI agent to check inventory
      // TODO: Notify operator dashboard
      console.log(`🔋 Battery swap completed at station ${session.stationId}, slot ${batterySlot}`);
    }
  }
  
  res.json({ 
    success: true, 
    session,
    message: `Session status updated to ${status}`
  });
});

/**
 * Get session details
 */
app.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  const session = SESSIONS.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Auto-expire after TTL
  if (Date.now() - session.createdAt > SESSION_TTL * 1000) {
    session.status = 'aborted';
    session.reason = 'Session timeout';
  }
  
  res.json(session);
});

/**
 * Get active session for a station
 */
app.get('/station/:stationId/active-session', (req, res) => {
  const { stationId } = req.params;
  
  for (const [sessionId, session] of SESSIONS.entries()) {
    if (session.stationId === stationId && !['completed', 'aborted'].includes(session.status)) {
      return res.json({ sessionId, session });
    }
  }
  
  res.json({ sessionId: null, session: null });
});

/**
 * Verify token endpoint (for debugging)
 */
app.post('/token/verify', (req, res) => {
  const { stationId, token, expiresAt } = req.body;
  
  const isValid = verifyStationToken(stationId, token, expiresAt);
  const currentTime = Date.now();
  const timeRemaining = Math.max(0, Math.floor((expiresAt - currentTime) / 1000));
  
  res.json({
    valid: isValid,
    stationId,
    token,
    expiresAt,
    currentTime,
    timeRemaining,
    expired: currentTime > expiresAt
  });
});

/**
 * Health check
 */
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    uptime: process.uptime(),
    sessions: SESSIONS.size
  });
});

/**
 * Get server stats
 */
app.get('/stats', (req, res) => {
  const activeSessions = Array.from(SESSIONS.values()).filter(
    session => !['completed', 'aborted'].includes(session.status)
  ).length;
  
  res.json({
    totalSessions: SESSIONS.size,
    activeSessions,
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Vyan Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/`);
  console.log(`🔐 HMAC Secret: ${SECRET_KEY.substring(0, 8)}...`);
});
