# Scope Delta Analysis: The Meridian Pivot (Solstice Events)

## 1. Executive Summary
On Day 4 of the sprint, the client (Solstice Events Co.) deprecated the synchronous badge-printer REST API. The requirement shifted to an asynchronous model using a message queue and a webhook callback, while maintaining strict duplicate-scan protection and handling out-of-order confirmations. This document outlines the architectural changes, trade-offs, and regression checks performed to accommodate this non-negotiable pivot.

## 2. Architectural Changes

| Category | Pre-Pivot (Assignment 1 / Original Spec) | Post-Pivot (Assignment 2 / Current Spec) |
| :--- | :--- | :--- |
| **Domain** | Northstar Retail (Inventory Sync) | Solstice Events (Check-in Kiosk) |
| **Trigger** | Scheduled polling or direct REST call | QR Code Scan (`POST /checkin`) |
| **Data Flow** | Synchronous / Pull | Asynchronous / Push (Queue + Webhook) |
| **UI State** | Immediate availability / Live Cache | `PENDING` → `CHECKED_IN` (Async State Machine) |
| **New Complexity** | Stock freshness | Duplicate scan protection & Out-of-order callbacks |

### Dropped
- The 5-minute polling mechanism and Northstar Retail inventory caching logic. 
- *Reason:* The client deprecated the synchronous/polling model entirely.

### Modified
- The check-in flow. Instead of waiting for a REST response, the server now generates a unique `printJobId`, marks the attendee as `PENDING`, and returns HTTP 202 (Accepted) immediately.

### Added
- **Redis Message Queue Integration:** `POST /checkin` now publishes a JSON payload to a `print_queue` list.
- **Webhook Receiver:** `POST /webhook/print-complete` endpoint to accept asynchronous callbacks from the vendor.
- **Reverse-Lookup State Map:** A `jobToAttendee` Map in the server to securely map incoming `printJobId`s back to the correct `attendeeId`, solving the out-of-order confirmation requirement.
- **Printer Simulator:** A standalone script (`printer-simulator.js`) to mimic the vendor's async behavior and intentionally introduce random delays to prove out-of-order resilience.

## 3. Trade-offs & Technical Decisions

1. **In-Memory State vs. Database:** 
   - *Decision:* Used in-memory `Map` objects (`attendeeState` and `jobToAttendee`) instead of a persistent database.
   - *Trade-off:* State is lost on server restart. However, this was chosen to prioritize rapid prototyping and meeting the 48-hour pivot deadline while keeping the architecture simple and focused on the message queue/webhook flow.
2. **Reverse-Lookup Map for Webhooks:** 
   - *Decision:* The printer simulator only sends the `printJobId` in the webhook. The server maintains a `jobToAttendee` map to resolve this.
   - *Trade-off:* Requires careful memory management, but successfully decouples the external vendor from internal attendee data, ensuring that out-of-order webhooks update the correct user without race conditions.

## 4. Regression Testing & Integrity
To ensure the pivot did not break core requirements, the following tests were executed and passed:
- ✅ **3 Unique Attendees:** `ATT-001`, `ATT-002`, `ATT-003` successfully transitioned from `PENDING` to `CHECKED_IN`.
- ✅ **Duplicate Scan Protection:** A second scan of `ATT-001` while `PENDING` correctly returned HTTP `409 Conflict` and did not publish a second job to the queue.
- ✅ **Out-of-Order Resolution:** The printer simulator was configured with random delays (1000ms–5000ms). Logs confirm that webhooks arriving out of sequence correctly updated the specific attendee associated with that `printJobId` without corrupting others.
- ✅ **Malformed Request Handling:** Empty or missing `attendeeId` payloads gracefully return HTTP `400 Bad Request` without crashing the server.

## 5. Obsolete Code Handling (Non-Negotiable Rule)
In accordance with the sprint rules, obsolete pre-pivot code was not left running in parallel. 
- The original Assignment 1 files (`producer.js`, `consumer.js`, `public/`) have been moved to an `/archive` directory.
- Deprecation headers (`// ⚠️ DEPRECATED...`) were added to the top of these files.
- The pre-pivot state is preserved in Git history via the tag `pre-pivot-assignment-1-complete`.