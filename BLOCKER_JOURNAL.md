## Blocker Entry #1
**Timestamp:** 18/08/2026 23:54    
**Goal:** Initialize Node.js project using npm init -y
**What I tried:** Ran npm init -y in PowerShell after installing Node.js.
The Error: File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system... PSSecurityException
**What I Googled/Read:** Searched "npm.ps1 cannot be loaded running scripts is disabled". Found Microsoft documentation on PowerShell Execution Policies.
**The Fix:** Realized Windows blocks script execution by default for security. Ran Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser, confirmed with 'Y', and the npm command worked successfully, generating package.json.

## Blocker Entry #2
**Timestamp:** 19/08/2026 13:35  
**Goal:** Verify .env file was created and committed to GitHub  
**What I tried:** Ran `ls` in Git Bash and checked GitHub repo, but .env file was not visible  
**The Error/Confusion:** File appeared to be missing from both terminal and GitHub  
**What I Googled/Read:** Searched "why can't I see .env file in ls" and "why isn't .env showing on GitHub"  
**The Fix/Realization:** 
- Learned that files starting with `.` are hidden by default in Unix/Linux. Must use `ls -a` to see them.
- Learned that the Node.js .gitignore template automatically excludes `.env` files for security reasons (they contain secrets).
- Confirmed the file exists using `ls -a` and `cat .env`.

## Blocker Entry #3

**Timestamp:** [Today's Date & Time]  
**Goal:** Run producer.js to send events to Redis queue  
**What I tried:** Ran `node producer.js` after writing the Producer code  
**The Error:** SyntaxError: Unexpected token '{'
at line 59: If (eventCount) >= 10 {
**What I Googled/Read:** Searched "SyntaxError Unexpected token '{' JavaScript if statement"  
**The Fix/Realization:** I corrected the syntactical error by making if lower case and then changing the code from If (eventCount) >= 10 {} to if(eventCount >= 10) {}; which is the right way to write the code.
- The code ran successfully:
- $ node producer.js 
◇ injected env (1) from .env // tip: ⌘ override existing { override: true }
Success... Producer connected to Redis queue
 Event 1 sent: Mechanical Keyboard - return 11 units
 Event 2 sent: USB-C Hub - return 2 units
 Event 3 sent: USB-C Hub - sale 3 units
 Event 4 sent: Wireless Mouse - sale 9 units
 Event 5 sent: Wireless Mouse - restock 9 units
 Event 6 sent: Wireless Mouse - restock 16 units
 Event 7 sent: Wireless Mouse - return 20 units
 Event 8 sent: Mechanical Keyboard - sale 7 units
 Event 9 sent: Mechanical Keyboard - restock 16 units
 Event 10 sent: USB-C Hub - restock 7 units
Producer finished sending 10 events

## Blocker Entry #4

**Timestamp:** 19/08/2028 18:58
**Goal:** To understand why the browser didn't auto-update when new Redis events arrived.  
**What I tried:** Checked the browser at http://localhost:3000/inventory and noticed I had to manually refresh to see new data.  
**The Realization:** Realized that standard HTTP GET requests are a "Pull" model (Request-Response). The browser asks once, gets the data, and closes the connection. It has no way of knowing the server's cache updated unless it asks again.  
**The Fix/Action:** 
1. Acknowledged that a "query endpoint" (as per assignment spec) is designed to be pulled, so manual refresh is technically correct.
2. To demonstrate deeper understanding, implemented Client-Side Polling by adding a `public/index.html` file with a JavaScript `setInterval` that fetches the `/inventory` endpoint every 2 seconds, creating a "live dashboard" effect.

## Blocker Entry #5

**Timestamp:** 16:54 22/08/2026
**Goal:** Build the core check-in server incrementally  
**What I did:** 
- Built `server.js` first WITHOUT Redis to prove the state machine and duplicate protection worked in isolation
- Tested with curl: confirmed POST /checkin returns 202 for new attendees, 409 for duplicates
- Tested GET /status/:attendeeId to verify state retrieval
- Once that worked, layered on Redis publishing to connect to the message queue
**The Realization:** Should have committed the first working version as a separate milestone to create a clearer audit trail. Going forward, will commit after every working milestone.
**The Fix:** Documented the progression here. Committed the Redis-connected version as the next logical milestone.

## Blocker Entry #6

**Timestamp:** 17:18 22/08/2026 
**Goal:** Test the /checkin endpoint using curl after starting the server.  
**What I tried:** Ran `node server.js` and then immediately tried to run the `curl` command in the same terminal window.  
**The Error:** `curl: (7) Failed to connect to localhost:3000 after 2246 ms: Could not connect to server`  
**What I Googled/Read:** Searched "curl failed to connect to localhost nodejs same terminal".  
**The Fix/Realization:** Realized that running `node server.js` blocks the terminal because it is actively listening for HTTP requests. I cannot run other commands in that same window. I opened a second, separate Git Bash terminal window to run the `curl` commands while leaving the server running in the first window. The test then succeeded immediately.