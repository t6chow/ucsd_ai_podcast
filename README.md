# UCSD AI Extension - Setup Guide

This browser extension helps students interact with UCSD lecture videos using AI (Claude).

## Problem: CORS Error

Browser extensions cannot directly call the Anthropic API due to CORS (Cross-Origin Resource Sharing) restrictions. The error you're seeing:

```
Access to fetch at 'https://api.anthropic.com/v1/messages' from origin 'https://podcast.ucsd.edu'
has been blocked by CORS policy
```

This is a security feature that prevents browser JavaScript from directly accessing APIs with sensitive keys.

## Solution: Proxy Server

We solve this by running a local Node.js server that:
1. Receives requests from your browser extension
2. Forwards them to Anthropic API (server-side, no CORS issues)
3. Returns the response back to your extension

## Setup Instructions

### 1. Install Node.js Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `cors` - Handles cross-origin requests
- `node-fetch` - Makes API calls to Anthropic
- `dotenv` - Loads API key from .env file

### 2. Start the Proxy Server

```bash
npm start
```

You should see:
```
🚀 UCSD AI Proxy Server running on http://localhost:3000
Health check: http://localhost:3000/health
API endpoint: http://localhost:3000/api/chat
```

**Keep this server running while using the extension!**

### 3. Load the Browser Extension

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this folder: `/Users/terranchow/Desktop/other/sdx/ucsd_podcast`

### 4. Test It Out

1. Go to any UCSD podcast video: https://podcast.ucsd.edu
2. The "Ask AI" button should appear in the top-right corner
3. Click it and try asking a question about the lecture

## How It Works

```
Browser Extension (content.js)
    ↓ (HTTP request to localhost:3000)
Local Proxy Server (server.js)
    ↓ (HTTP request with API key)
Anthropic API (Claude)
    ↓ (Response)
Local Proxy Server
    ↓ (Response)
Browser Extension
```

## Files Explained

- **server.js** - Node.js proxy server that handles API calls
- **content.js** - Browser extension code that runs on UCSD pages
- **config.js** - Extension configuration (deprecated, now uses server)
- **.env** - Contains your Anthropic API key (NEVER commit this!)
- **manifest.json** - Browser extension configuration

## Security Notes

- ✅ API key is stored in `.env` file (server-side only)
- ✅ Never exposed to the browser
- ⚠️ Server runs on localhost (only accessible from your computer)
- ⚠️ Make sure `.env` is in `.gitignore`

## Troubleshooting

### "Failed to fetch" error
- Make sure the server is running (`npm start`)
- Check that it's on port 3000: http://localhost:3000/health

### "API key not found" error
- Check that `.env` file exists with `ANTHROPIC_API_KEY`
- Restart the server after editing `.env`

### Transcription not loading
- Open browser console (F12)
- Run `window.loadSRTManually()` to manually load the transcript

## Development

For auto-restart on file changes:
```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when you edit code.
