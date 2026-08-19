18/08/2026 23:54    
Goal: Initialize Node.js project using npm init -y
What I tried: Ran npm init -y in PowerShell after installing Node.js.
The Error: File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system... PSSecurityException
What I Googled/Read: Searched "npm.ps1 cannot be loaded running scripts is disabled". Found Microsoft documentation on PowerShell Execution Policies.
The Fix: Realized Windows blocks script execution by default for security. Ran Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser, confirmed with 'Y', and the npm command worked successfully, generating package.json.