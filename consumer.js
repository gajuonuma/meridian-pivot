// consumer.js - The App (Listens to Redis queue and updates inventory cache)

require('dotenv').config();
const { createClient } = require('redis');
const express = require('express');

// Step 1: Set up the in-memory cache (our "database")
const inventoryCache = new Map();

// Step 2: Set up Express server
const app = express();
// Add this line to serve static HTML files from the 'public' folder
app.use(express.static('public'));
const PORT = 3000;

// Step 3: Connect to Redis
const redisUrl = process.env.REDIS_URL;
const client = createClient({ url: redisUrl });

client.on('error', (err) => console.log('Redis Client Error', err));

// Step 4: Define the Express route to query inventory
app.get('/inventory', (req, res) => {
  const inventory = Object.fromEntries(inventoryCache);
  res.json({
    message: 'Current Inventory Cache',
    totalItems: inventoryCache.size,
    inventory: inventory,
  });
});

// Step 5: The main function
async function startConsumer() {
  // Connect to Redis
  await client.connect();
  console.log('✅ Consumer connected to Redis queue');

  // Start the Express server
  app.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log(`📋 Check inventory at http://localhost:${PORT}/inventory`);
  });

  // Step 6: Continuously listen to the Redis queue
  console.log('👂 Listening for inventory updates...');

  while (true) {
    try {
      // rPop removes and returns the rightmost item from the list
      // This creates a FIFO queue (Producer pushes left, Consumer pops right)
      const message = await client.rPop('inventory_updates');

      if (message) {
        // Parse the JSON string back into an object
        const event = JSON.parse(message);

        // Update the in-memory cache
        const currentStock = inventoryCache.get(event.sku) || { name: event.name, quantity: 0 };

        if (event.action === 'restock' || event.action === 'return') {
          currentStock.quantity += event.quantity;
        } else if (event.action === 'sale') {
          currentStock.quantity -= event.quantity;
        }

        currentStock.lastUpdated = event.timestamp;
        inventoryCache.set(event.sku, currentStock);

        console.log(`📥 Received: ${event.name} - ${event.action} ${event.quantity} units | New stock: ${currentStock.quantity}`);
      } else {
        // No message in queue, wait 1 second before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.log('❌ Error processing message:', err.message);
    }
  }
}

startConsumer();