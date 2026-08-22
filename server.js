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
// CRITICAL: Map printJobId back to attendeeId to handle out-of-order webhooks
const jobToAttendee = new Map();

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
  // Safely extract attendeeId, defaulting to undefined if req.body is empty
  const attendeeId = req.body && req.body.attendeeId;

  if (!attendeeId) {
    return res.status(400).json({ error: 'attendeeId is required' });
  }

  const currentState = attendeeState.get(attendeeId);

  // DUPLICATE PROTECTION
  if (currentState) {
    if (currentState.status === 'PENDING') {
      return res.status(409).json({ message: 'Already processing', status: 'PENDING', attendeeId, printJobId: currentState.printJobId });
    }
    if (currentState.status === 'CHECKED_IN') {
      return res.status(409).json({ message: 'Already checked in', status: 'CHECKED_IN', attendeeId });
    }
  }

  // NEW ATTENDEE
  const printJobId = `JOB-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
  
  attendeeState.set(attendeeId, {
    status: 'PENDING',
    printJobId: printJobId,
    timestamp: new Date().toISOString()
  });
  
  // Link the job ID to the attendee ID for the webhook
  jobToAttendee.set(printJobId, attendeeId);

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

// NEW: WEBHOOK ENDPOINT
app.post('/webhook/print-complete', (req, res) => {
  const { printJobId, status } = req.body;

  if (!printJobId || !status) {
    return res.status(400).json({ error: 'printJobId and status are required' });
  }

  // Resolve out-of-order: Find which attendee this job belongs to
  const attendeeId = jobToAttendee.get(printJobId);

  if (!attendeeId) {
    console.log(`⚠️ Webhook received for unknown printJobId: ${printJobId}`);
    return res.status(404).json({ error: 'Unknown print job' });
  }

  const currentState = attendeeState.get(attendeeId);

  // Prevent duplicate webhook processing
  if (currentState.status === 'CHECKED_IN') {
    console.log(`⚠️ Duplicate webhook ignored for ${attendeeId} (Job: ${printJobId})`);
    return res.status(200).json({ message: 'Already processed' });
  }

  if (status === 'completed') {
    currentState.status = 'CHECKED_IN';
    currentState.timestamp = new Date().toISOString();
    attendeeState.set(attendeeId, currentState);
    console.log(`✅ Webhook processed: ${attendeeId} is now CHECKED_IN`);
  } else {
    console.log(`❌ Print failed for ${attendeeId} (Job: ${printJobId}). Status remains PENDING.`);
  }

  // Always acknowledge the webhook to the vendor immediately
  res.status(200).json({ message: 'Webhook received' });
});

// 4. START SERVER
async function startServer() {
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`🚀 Solstice Check-in Server running at http://localhost:${PORT}`);
  });
}

startServer();