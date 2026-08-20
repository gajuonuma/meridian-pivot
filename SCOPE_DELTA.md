# Scope Delta Analysis: The Meridian Pivot

## 1. The Pivot Event
**Date:** Day 4 of Sprint  
**Client Change:** Solstice Events Co. deprecated the synchronous badge-printer REST API.  
**New Requirement:** Rebuild the check-in kiosk around an asynchronous model using a message queue and a webhook callback, while maintaining duplicate-scan protection and handling out-of-order confirmations.

## 2. Architectural Changes
| Area | Pre-Pivot (Assignment 1) | Post-Pivot (Assignment 2) |
| :--- | :--- | :--- |
| **Client/Domain** | Northstar Retail (Inventory Sync) | Solstice Events (Check-in Kiosk) |
| **Trigger** | Scheduled 5-min polling (or mock 5-sec interval) | Staff QR code scan (`POST /checkin`) |
| **Data Flow** | Pull: App requests data from Warehouse | Push: App publishes to Queue, waits for Webhook |
| **UI State** | Live inventory cache | `PENDING` → `CHECKED_IN` (async state machine) |
| **New Complexity** | None | Duplicate scan protection, Out-of-order callbacks |

## 3. Codebase Actions Taken
- **Deprecated:** `producer.js`, `consumer.js`, and `public/` (moved to `/archive` with deprecation headers).
- **Added:** New `server.js` to handle `/checkin` and `/webhook/print-complete` endpoints.
- **Added:** `printer-simulator.js` to mimic the vendor's async message queue processing.
- **Retained:** Redis (Upstash) as the message broker, leveraging Assignment 1 learning.

## 4. Trade-offs & Backlog
- **Trade-off:** The UI can no longer show instant "Checked In" feedback. It must show "Pending" and rely on the webhook, which introduces a slight delay but prevents the app from blocking/hanging if the printer is slow.
- **Backlog Refactor:** Dropped all inventory polling logic. Reprioritized building the attendee state machine and webhook receiver.