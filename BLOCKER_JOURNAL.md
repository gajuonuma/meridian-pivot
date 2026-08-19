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

