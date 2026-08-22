// server.js - Solstice Events Check-in Kiosk (Post-Pivot)
require('dotenv').config();
const express = require('express');
const { createClient } = require('redis');
const crypto = require('crypto'); // Built-in Node module to generate unique Job IDs

const app = express();
app.use(express.json()); // Allows us to parse JSON bodies in POST requests

const PORT = process.env.PORT || 3000;

// ==========================================
// 1. STATE MANAGEMENT (In-Memory for Prototype)
// ==========================================
// Maps attendeeId -> { status: 'PENDING' | 'CHECKED_IN', printJobId: string }
const attendeeState = new Map();

// ==========================================
// 2. REDIS CONNECTION (Reusing Assignment 1 Knowledge)
// ==========================================
const redisUrl = process.env.REDIS_URL;
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.log('❌ Redis Client Error:', err));

async function connectRedis() {
  await redisClient.connect();
  console.log('✅ Connected to Redis Message Queue');
}

// ==========================================
// 3. ENDPOINTS
// ==========================================

// POST /checkin - Staff scans an attendee QR code
app.post('/checkin', async (req, res) => {
  const { attendeeId } = req.body;

  if (!attendeeId) {
    return res.status(400).json({ error: 'attendeeId is required' });
  }

  // DUPLICATE PROTECTION: Check current state
  const currentState = attendeeState.get(attendeeId);

  if (currentState) {
    if (currentState.status === 'PENDING') {
      return res.status(409).json({ 
        message: 'Already processing', 
        status: 'PENDING', 
        attendeeId,
        printJobId: currentState.printJobId 
      });
    }
    if (currentState.status === 'CHECKED_IN') {
      return res.status(409).json({ 
        message: 'Already checked in', 
        status: 'CHECKED_IN', 
        attendeeId 
      });
    }
  }

  // NEW ATTENDEE: Generate unique print job ID and mark as PENDING
  const printJobId = `JOB-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
  
  attendeeState.set(attendeeId, {
    status: 'PENDING',
    printJobId: printJobId,
    timestamp: new Date().toISOString()
  });

  // TODO (Milestone 4): Publish to Redis Queue here
  console.log(`📤 Publishing print request for ${attendeeId} (Job: ${printJobId}) to queue...`);

  res.status(202).json({
    message: 'Check-in initiated. Badge printing in progress.',
    status: 'PENDING',
    attendeeId,
    printJobId
  });
});

// GET /status/:attendeeId - UI polls this to see if printing is done
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

// TODO (Milestone 6): POST /webhook/print-complete will go here

// ==========================================
// 4. START SERVER
// ==========================================
async function startServer() {
  await connectRedis();
  
  app.listen(PORT, () => {
    console.log(`🚀 Solstice Check-in Server running at http://localhost:${PORT}`);
    console.log(`📋 Test endpoint: POST http://localhost:${PORT}/checkin`);
  });
}

startServer();