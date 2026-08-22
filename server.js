// server.js - Solstice Events Check-in Kiosk (Post-Pivot)
require('dotenv').config();
const express = require('express');
const { createClient } = require('redis');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. STATE MANAGEMENT
const attendeeState = new Map();

// 2. REDIS CONNECTION
const redisUrl = process.env.REDIS_URL;
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.log('❌ Redis Client Error:', err));

async function connectRedis() {
  await redisClient.connect();
  console.log('✅ Connected to Redis Message Queue');
}

// 3. ENDPOINTS
app.post('/checkin', async (req, res) => {
  const { attendeeId } = req.body;

  if (!attendeeId) {
    return res.status(400).json({ error: 'attendeeId is required' });
  }

  const currentState = attendeeState.get(attendeeId);

  if (currentState) {
    if (currentState.status === 'PENDING') {
      return res.status(409).json({ message: 'Already processing', status: 'PENDING', attendeeId, printJobId: currentState.printJobId });
    }
    if (currentState.status === 'CHECKED_IN') {
      return res.status(409).json({ message: 'Already checked in', status: 'CHECKED_IN', attendeeId });
    }
  }

  const printJobId = `JOB-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
  
  attendeeState.set(attendeeId, {
    status: 'PENDING',
    printJobId: printJobId,
    timestamp: new Date().toISOString()
  });

  const queueMessage = JSON.stringify({ printJobId, attendeeId });
  await redisClient.lPush('print_queue', queueMessage);
  console.log(`📤 Published to queue: ${queueMessage}`);

  res.status(202).json({
    message: 'Check-in initiated. Badge printing in progress.',
    status: 'PENDING',
    attendeeId,
    printJobId
  });
});

app.get('/status/:attendeeId', (req, res) => {
  const { attendeeId } = req.params;
  const state = attendeeState.get(attendeeId);

  if (!state) {
    return res.status(404).json({ error: 'Attendee not found' });
  }

  res.json({
    attendeeId,
    status: state.status,
    printJobId: state.printJobId,
    lastUpdated: state.timestamp
  });
});

// 4. START SERVER
async function startServer() {
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`🚀 Solstice Check-in Server running at http://localhost:${PORT}`);
  });
}

startServer();