# Meridian-pivot
Solo Recon: Message Queue mini-prototype (The Meridian Pivot)

# Inventory Sync Service - Message Queue Prototype

### What This Is

A mini-prototype built during a 2-day solo learning sprint. The goal was to learn Message Queues from scratch and build a working system that demonstrates event-driven architecture.

### How It Works

The system has three parts:

1. **Producer** (`producer.js`) - Simulates a warehouse that generates inventory update events every 5 seconds and pushes them to a Redis queue
2. **Redis Queue** (Upstash) - Acts as the message broker between Producer and Consumer
3. **Consumer** (`consumer.js`) - Listens to the Redis queue, processes events, updates an in-memory cache, and exposes a `/inventory` endpoint

### Running It

```bash
# Terminal 1 - Start the Consumer
node consumer.js

# Terminal 2 - Start the Producer
node producer.js

# Open browser
http://localhost:3000/inventory
```
### What I Learned
- How message queues decouple systems (Producer and Consumer don't know about each other)
- Redis as a message broker (not just a cache)
- Event-driven architecture patterns
Working with async/await for continuous listening loops

### Blockers
See BLOCKER_JOURNAL.md for detailed troubleshooting logs including:
Windows PowerShell execution policy issues

### Redis connection configuration
JSON parsing errors
Tech Stack
Node.js
Express
Redis (Upstash)
dotenv

### Context
This is part of a 5-day simulation. - Days 1-2 focused on independent learning with an unfamiliar tool. 
- Days 3-5 involve team collaboration and a mid-sprint requirement change (polling → webhooks).