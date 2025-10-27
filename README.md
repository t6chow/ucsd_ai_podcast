ONLY WORKS ON CHROME! LLM wrote all of ReadMe (still important to skim) but this app isn't able to automatically bring in the transcription file. Go to your podcast, press "Ask AI", open dev tools, go to network, you should see a file .srt -> open and copy its link. paste link in prompted box in "Ask AI" pop up. send questions to me terranchow@gmail.com

# UCSD AI Extension - Setup Guide

This CHROME browser extension helps students interact with UCSD lecture videos using AI (Claude).

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

### Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **Anthropic API Key** - [Get one here](https://console.anthropic.com/)

### 1. Install Node.js Dependencies

Install all required dependencies listed in `requirements.txt`:

```bash
npm install
```

This installs:
- `express@^4.18.2` - Web server framework
- `cors@^2.8.5` - Handles cross-origin requests
- `node-fetch@^2.7.0` - Makes API calls to Anthropic
- `dotenv@^16.3.1` - Loads API key from .env file
- `nodemon@^3.0.1` - Auto-restart during development

**Note:** All dependencies are also listed in `requirements.txt` for reference.

### 1.5. Configure Your API Key

Create a `.env` file in the project root with your Anthropic API key:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

**Important:** Never commit this file to git! It's already in `.gitignore`.

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
