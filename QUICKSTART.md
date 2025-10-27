# Quick Start Guide

## The Problem You Had

You were getting this error:
```
Access to fetch at 'https://api.anthropic.com/v1/messages' from origin 'https://podcast.ucsd.edu'
has been blocked by CORS policy
```

**Why?** Browser extensions can't directly call APIs like Anthropic's due to CORS security restrictions.

## The Solution

I've set up a **local proxy server** that sits between your browser extension and the Anthropic API.

## How to Run (3 Steps)

### Step 1: Start the Server
Open a terminal in this folder and run:
```bash
npm start
```

You should see:
```
🚀 UCSD AI Proxy Server running on http://localhost:3000
```

**Leave this terminal window open!** The server must keep running.

### Step 2: Reload the Extension
1. Go to `chrome://extensions/`
2. Find "UCSD AI Extension"
3. Click the refresh button 🔄
4. (If not installed yet, click "Load unpacked" and select this folder)

### Step 3: Test It
1. Go to https://podcast.ucsd.edu
2. Click "Ask AI" button (top-right)
3. Type a question like "hello"
4. You should get a response from Claude!

## What Changed

### Before (didn't work):
```
Browser → Anthropic API ❌ CORS ERROR
```

### After (works):
```
Browser → Localhost Server → Anthropic API ✅
```

## Files I Created/Modified

1. **server.js** - New proxy server
2. **package.json** - Dependencies list
3. **content.js** - Updated to use `http://localhost:3000/api/chat` instead of direct API
4. **README.md** - Full documentation

## Troubleshooting

**"Failed to fetch" error?**
- Check the server is running (Step 1)
- Visit http://localhost:3000/health - should say "ok"

**Server won't start?**
- Run `npm install` first
- Check if port 3000 is already in use

**No response from AI?**
- Check `.env` file has your API key
- Check server terminal for error messages
- Reload the extension (Step 2)

## Next Steps

- For production use, you'd host this server on a cloud platform (Heroku, Railway, etc.)
- For now, you need to keep the server running locally
- Use `npm run dev` for auto-restart during development
