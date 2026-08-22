// printer-simulator.js - Simulates the external badge-printer vendor
require('dotenv').config();
const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL;
const redisClient = createClient({ url: redisUrl });
const SERVER_URL = 'http://localhost:3000/webhook/print-complete';

redisClient.on('error', (err) => console.log('❌ Redis Client Error:', err));

// Helper function to pause execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startPrinterSimulator() {
  await redisClient.connect();
  console.log('🖨️  Printer Simulator connected to Redis queue. Listening for jobs...');

  while (true) {
    try {
      // Pop a job from the right side of the queue (FIFO)
      const message = await redisClient.rPop('print_queue');

      if (message) {
        const job = JSON.parse(message);
        console.log(`📥 Printer received job: ${job.printJobId} for ${job.attendeeId}`);

        // SIMULATE OUT-OF-ORDER: Wait a random time between 1 and 5 seconds
        const delay = Math.floor(Math.random() * 4000) + 1000;
        console.log(`⏳ Simulating print delay of ${delay}ms for ${job.printJobId}...`);
        await sleep(delay);

        // Send webhook back to our server
        console.log(`📤 Sending webhook to server for ${job.printJobId}...`);
        const response = await fetch(SERVER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printJobId: job.printJobId, status: 'completed' })
        });

        if (response.ok) {
          console.log(`✅ Webhook acknowledged by server for ${job.printJobId}`);
        } else {
          console.log(`❌ Server rejected webhook for ${job.printJobId}`);
        }
      } else {
        // No jobs in queue, wait 1 second before checking again
        await sleep(1000);
      }
    } catch (err) {
      console.log('❌ Printer simulator error:', err.message);
      await sleep(1000);
    }
  }
}

startPrinterSimulator();