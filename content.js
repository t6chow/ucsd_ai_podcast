// UCSD Video AI Assistant - Content Script
console.log('UCSD AI Extension: Content script loaded');
console.log('UCSD AI Extension: Current URL:', window.location.href);

// Make functions available immediately (completely global)


window.debugUCSDExtension = function() {
  console.log('=== UCSD AI Extension Debug Info ===');
  console.log('Transcription loaded:', !!window.ucsdTranscriptionData);
  console.log('Transcription segments:', window.ucsdTranscriptionData ? window.ucsdTranscriptionData.length : 0);
  console.log('Floating button exists:', !!document.getElementById('ucsd-ai-button'));
  console.log('Sidebar exists:', !!document.getElementById('ucsd-ai-sidebar'));
  
  if (window.ucsdTranscriptionData && window.ucsdTranscriptionData.length > 0) {
    console.log('First segment:', window.ucsdTranscriptionData[0]);
    console.log('Last segment:', window.ucsdTranscriptionData[window.ucsdTranscriptionData.length - 1]);
    console.log('Sample segments:', window.ucsdTranscriptionData.slice(0, 3));
  }
  
  console.log('=== End Debug Info ===');
};

// Manual SRT loading function
window.loadSRTManually = function() {
  console.log('UCSD AI Extension: Loading SRT manually...');
  
  // Use the SRT URL from your error message
  const srtUrl = 'https://cfvod.kaltura.com/api_v3/index.php/service/caption_captionAsset/action/serve/captionAssetId/1_gcln35ap/ks/djJ8MjMyMzExMXxk02wmEYhIMzxgdVXvc4Z0yRhrMcRdikoYpskBILnFIZPLP0hmCHY7oslUuq2g9Xscb7dFsYHrmYUafLyOC05CGsX26QM4SlubuF3Hav3wZmSzbs5djX9SPPGZz4iDiIGKMXmdv-sBh-gkdsDwOb4wkAdtc9Qhz2StVtur7GGd1hF3FPu7KCSIu9EHaFi-HLjxjZ9HGQ4KZwFLREYLXA-g/.srt';
  
  console.log('UCSD AI Extension: Fetching SRT from:', srtUrl);
  
  fetch(srtUrl)
    .then(response => {
      console.log('UCSD AI Extension: SRT response status:', response.status);
      if (response.ok) {
        return response.text();
      }
      throw new Error('Failed to fetch SRT: ' + response.status);
    })
    .then(srtContent => {
      console.log('UCSD AI Extension: SRT content received, length:', srtContent.length);
      console.log('UCSD AI Extension: First 500 chars:', srtContent.substring(0, 500));
      
      // Parse SRT content
      const subtitles = [];
      const blocks = srtContent.trim().split(/\n\s*\n/);
      
      blocks.forEach(block => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
          const index = lines[0];
          const timecode = lines[1];
          const text = lines.slice(2).join(' ').replace(/\n/g, ' ');
          
          const timeMatch = timecode.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
          if (timeMatch) {
            const startTime = timeMatch[1];
            const endTime = timeMatch[2];
            
            subtitles.push({
              index: parseInt(index),
              startTime: startTime,
              endTime: endTime,
              text: text.trim()
            });
          }
        }
      });
      
      console.log('UCSD AI Extension: Parsed', subtitles.length, 'subtitle segments');
      window.ucsdTranscriptionData = subtitles;
      
      // Update chat welcome message if sidebar exists
      const messagesContainer = document.getElementById('chat-messages');
      if (messagesContainer) {
        const welcomeMessage = messagesContainer.querySelector('.ai-message');
        if (welcomeMessage) {
          welcomeMessage.innerHTML = `
            <p>✅ <strong>Transcription loaded!</strong> I have access to ${subtitles.length} segments of the lecture.</p>
            <p>What would you like to know about this lecture?</p>
            <p><small>Try asking: "What did the professor say at 00:25:09?" or "Summarize the main points"</small></p>
          `;
        }
      }
      
      console.log('UCSD AI Extension: Transcription loaded successfully!');
      
      // Test the chat interface
      console.log('UCSD AI Extension: Testing chat interface...');
      testChatInterface();
    })
    .catch(err => {
      console.error('UCSD AI Extension: Error loading SRT:', err);
    });
};

// Test chat interface function
window.testChatInterface = function() {
  console.log('UCSD AI Extension: Testing chat interface...');
  
  if (!window.ucsdTranscriptionData || window.ucsdTranscriptionData.length === 0) {
    console.log('❌ No transcription data available');
    return;
  }
  
  console.log('✅ Transcription data available:', window.ucsdTranscriptionData.length, 'segments');
  
  // Test searching for a specific timestamp
  const testTimestamp = '00:25:09';
  const timeToSeconds = (timeStr) => {
    const parts = timeStr.replace(',', '.').split(':');
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  };
  
  const requestedSeconds = timeToSeconds(testTimestamp);
  const segment = window.ucsdTranscriptionData.find(seg => {
    const startSeconds = timeToSeconds(seg.startTime);
    const endSeconds = timeToSeconds(seg.endTime);
    return requestedSeconds >= startSeconds && requestedSeconds <= endSeconds;
  });
  
  if (segment) {
    console.log('✅ Found segment at', testTimestamp, ':', segment.text);
  } else {
    console.log('❌ No segment found at', testTimestamp);
    console.log('Available time range:', window.ucsdTranscriptionData[0].startTime, 'to', window.ucsdTranscriptionData[window.ucsdTranscriptionData.length-1].endTime);
  }
  
  // Test searching for keywords
  const testKeywords = ['optimization', 'gradient', 'function'];
  testKeywords.forEach(keyword => {
    const matches = window.ucsdTranscriptionData.filter(seg => 
      seg.text.toLowerCase().includes(keyword.toLowerCase())
    );
    console.log(`✅ Found ${matches.length} segments containing "${keyword}"`);
    if (matches.length > 0) {
      console.log(`   Example: "${matches[0].text}" (at ${matches[0].startTime})`);
    }
  });
};

console.log('UCSD AI Extension: Functions are now available globally');
console.log('UCSD AI Extension: simpleTest function:', typeof window.simpleTest);

(function() {
  'use strict';

  let floatingButton = null;
  let sidebar = null;
  let isSidebarOpen = false;
  let currentVideo = null;
  let transcriptionData = null;
  let fetchedSRTUrls = new Set(); // Track which URLs we've already fetched

  // Make transcription data globally accessible
  window.ucsdTranscriptionData = null;

  // Create floating button
  function createFloatingButton() {
    if (floatingButton) return;

    console.log('UCSD AI Extension: Creating floating button');

    floatingButton = document.createElement('div');
    floatingButton.id = 'ucsd-ai-button';
    floatingButton.innerHTML = 'Ask AI';
    floatingButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 16px 24px;
      border-radius: 30px;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
      z-index: 10000;
      transition: all 0.3s ease;
      display: block;
    `;

    floatingButton.addEventListener('click', toggleSidebar);
    floatingButton.addEventListener('mouseenter', () => {
      floatingButton.style.transform = 'scale(1.05)';
      floatingButton.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)';
    });
    floatingButton.addEventListener('mouseleave', () => {
      floatingButton.style.transform = 'scale(1)';
      floatingButton.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
    });

    document.body.appendChild(floatingButton);
    console.log('UCSD AI Extension: Floating button created and added to DOM');
  }

  // Create sidebar
  function createSidebar() {
    if (sidebar) return;

    sidebar = document.createElement('div');
    sidebar.id = 'ucsd-ai-sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>AI Assistant</h3>
        <button id="close-sidebar">×</button>
      </div>
      <div class="sidebar-content">
        <div class="chat-messages" id="chat-messages">
          <div class="message ai-message">
            <p>Hi! I'm here to help with your video content. What would you like to know?</p>
          </div>
        </div>
        <div class="chat-input-container">
          <input type="text" id="chat-input" placeholder="Ask me anything about this video...">
          <button id="send-message">Send</button>
        </div>
      </div>
    `;

    sidebar.style.cssText = `
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 10001;
      transition: right 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    document.body.appendChild(sidebar);

    // Add event listeners
    document.getElementById('close-sidebar').addEventListener('click', toggleSidebar);
    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Toggle sidebar
  function toggleSidebar() {
    if (!sidebar) {
      createSidebar();
      // Update welcome message to show buttons if transcription isn't loaded
      console.log('UCSD AI Extension: Calling updateChatWelcomeMessage after sidebar creation');
      setTimeout(() => {
        updateChatWelcomeMessage();
      }, 50);
    }

    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) {
      sidebar.style.right = '0';
      document.body.style.marginRight = '400px';
    } else {
      sidebar.style.right = '-400px';
      document.body.style.marginRight = '0';
    }
  }

  // Parse SRT content into readable text
  function parseSRT(srtContent) {
    console.log('UCSD AI Extension: Parsing SRT content...');
    
    const subtitles = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);
    
    blocks.forEach(block => {
      const lines = block.trim().split('\n');
      if (lines.length >= 3) {
        const index = lines[0];
        const timecode = lines[1];
        const text = lines.slice(2).join(' ').replace(/\n/g, ' ');
        
        // Parse timecode (format: 00:00:00,000 --> 00:00:05,000)
        const timeMatch = timecode.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
        if (timeMatch) {
          const startTime = timeMatch[1];
          const endTime = timeMatch[2];
          
          subtitles.push({
            index: parseInt(index),
            startTime: startTime,
            endTime: endTime,
            text: text.trim()
          });
        }
      }
    });
    
    console.log('UCSD AI Extension: Parsed', subtitles.length, 'subtitle segments');
    return subtitles;
  }

  // Fetch SRT file from network requests
  function fetchSRTFromNetwork() {
    console.log('UCSD AI Extension: Looking for SRT file in network requests...');

    // Strategy 1: Intercept XMLHttpRequest (Kaltura uses this!)
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (typeof url === 'string' && url.includes('.srt')) {
        console.log('UCSD AI Extension: Found SRT XHR request:', url);

        this.addEventListener('load', function() {
          if (this.status === 200) {
            console.log('UCSD AI Extension: SRT content received via XHR');
            transcriptionData = parseSRT(this.responseText);
            window.ucsdTranscriptionData = transcriptionData;
            updateChatWelcomeMessage();
          }
        });
      }
      return originalXHROpen.apply(this, [method, url, ...args]);
    };

    // Strategy 2: Check ALL network requests that already happened
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      console.log('UCSD AI Extension: Checking', resources.length, 'network requests...');

      resources.forEach(resource => {
        if (resource.name.includes('.srt')) {
          console.log('UCSD AI Extension: Found SRT in performance entries:', resource.name);
          fetchSRTFromURL(resource.name);
        }
      });
    }

    // Strategy 3: Listen for future fetch requests to find SRT files
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('.srt')) {
        console.log('UCSD AI Extension: Found SRT fetch request:', url);

        return originalFetch.apply(this, args).then(response => {
          if (response.ok) {
            response.clone().text().then(srtContent => {
              console.log('UCSD AI Extension: SRT content received via fetch');
              transcriptionData = parseSRT(srtContent);
              window.ucsdTranscriptionData = transcriptionData;
              updateChatWelcomeMessage();
            }).catch(err => {
              console.log('UCSD AI Extension: Error reading SRT content:', err);
            });
          }
          return response;
        });
      }
      return originalFetch.apply(this, args);
    };

    // Strategy 4: Aggressively search for captionAssetId and construct SRT URL
    // This runs immediately - no delay
    setTimeout(() => {
      console.log('UCSD AI Extension: Strategy 4 - Aggressive search for SRT...');

      // Get the entire page HTML including iframes
      let fullHTML = document.documentElement.outerHTML;

      // Also check iframe content if accessible
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          if (iframe.contentDocument) {
            fullHTML += iframe.contentDocument.documentElement.outerHTML;
          }
        } catch (e) {
          // Can't access cross-origin iframe, that's okay
        }
      });

      // Search for captionAssetId pattern
      const captionIdMatch = fullHTML.match(/captionAssetId[\/=]([a-zA-Z0-9_]+)/);
      if (captionIdMatch) {
        const captionAssetId = captionIdMatch[1];
        console.log('UCSD AI Extension: Found captionAssetId:', captionAssetId);

        // Also search for the KS (Kaltura Session) token
        const ksMatch = fullHTML.match(/\/ks\/([a-zA-Z0-9_\-]+)/);
        if (ksMatch) {
          const ks = ksMatch[1];
          const srtUrl = `https://cfvod.kaltura.com/api_v3/index.php/service/caption_captionAsset/action/serve/captionAssetId/${captionAssetId}/ks/${ks}/.srt`;
          console.log('UCSD AI Extension: Constructed SRT URL:', srtUrl);
          fetchSRTFromURL(srtUrl);
          return; // Found it!
        }
      }

      // Strategy 4b: Search for direct SRT URLs in HTML
      const srtMatches = fullHTML.match(/https?:\/\/[^\s"'<>]+\.srt[^\s"'<>]*/gi);
      if (srtMatches && srtMatches.length > 0) {
        console.log('UCSD AI Extension: Found', srtMatches.length, 'SRT URLs directly');
        srtMatches.forEach(url => {
          console.log('UCSD AI Extension: Direct SRT URL:', url);
          fetchSRTFromURL(url);
        });
        return;
      }

      // Strategy 4c: Check scripts for SRT URLs
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes('.srt')) {
          const srtMatch = script.textContent.match(/https?:\/\/[^"'\s]+\.srt[^"'\s]*/g);
          if (srtMatch) {
            console.log('UCSD AI Extension: Found SRT in script:', srtMatch[0]);
            fetchSRTFromURL(srtMatch[0]);
            return;
          }
        }
      }

      console.log('UCSD AI Extension: No SRT URLs found in aggressive search');
    }, 500); // Start after 500ms

    // Strategy 5: Final fallback after page fully loads
    setTimeout(() => {
      if (transcriptionData) {
        console.log('UCSD AI Extension: Transcription already loaded, skipping fallback');
        return;
      }

      console.log('UCSD AI Extension: Running fallback SRT detection...');
      tryManualSRTDetection();
    }, 4000); // Final attempt after 4 seconds
  }

  // Fetch SRT from a specific URL
  function fetchSRTFromURL(url, onError) {
    // Skip if already loaded or already fetching this URL
    if (transcriptionData || fetchedSRTUrls.has(url)) {
      console.log('UCSD AI Extension: Skipping duplicate SRT fetch:', url);
      return Promise.resolve(null);
    }

    fetchedSRTUrls.add(url);
    console.log('UCSD AI Extension: Fetching SRT from URL:', url);

    return fetch(url)
      .then(response => {
        if (response.ok) {
          return response.text();
        }
        throw new Error('Failed to fetch SRT: ' + response.status);
      })
      .then(srtContent => {
        console.log('UCSD AI Extension: SRT content fetched successfully, length:', srtContent.length);
        transcriptionData = parseSRT(srtContent);
        window.ucsdTranscriptionData = transcriptionData;
        updateChatWelcomeMessage();
        console.log('UCSD AI Extension: ✅ Transcription loaded with', transcriptionData.length, 'segments');
        return transcriptionData;
      })
      .catch(err => {
        console.log('UCSD AI Extension: ❌ Error fetching SRT:', err);
        fetchedSRTUrls.delete(url); // Allow retry on error
        if (onError) onError(err);
        throw err;
      });
  }

  // Try to manually detect SRT URL based on common patterns
  function tryManualSRTDetection() {
    console.log('UCSD AI Extension: Attempting manual SRT detection...');
    
    // Look for Kaltura caption asset IDs in the page
    const pageContent = document.documentElement.innerHTML;
    const captionMatch = pageContent.match(/captionAssetId[\/=]([^"'\s&]+)/);
    
    if (captionMatch) {
      const captionAssetId = captionMatch[1];
      console.log('UCSD AI Extension: Found caption asset ID:', captionAssetId);
      
      // Construct SRT URL based on Kaltura pattern
      const srtUrl = `https://cfvod.kaltura.com/api_v3/index.php/service/caption_captionAsset/action/serve/captionAssetId/${captionAssetId}/ks/djJ8MjMyMzExMXz3_3wlHrfWeKA9Oh0lRq6Er60pvO8lmXdQL5i_i-lMS17tLIXGCOlAxwrtUwKBRh18r1LU5l2xM1kWhz6Oproj30hSka42I6_UjWIgEgtnwu8JAdOSesJN9VanlmQL9UZ5Tbzle3DyzcvjJkKb2_2fQ1tb7sbaynHQtpji6ojY-mtSkkFYmNdi_Gp5Cef3xM32Et7coYSpoXHRn8o8HB0B/.srt`;
      
      console.log('UCSD AI Extension: Trying constructed SRT URL:', srtUrl);
      fetchSRTFromURL(srtUrl);
    }
  }

  // Update chat welcome message with transcription status
  function updateChatWelcomeMessage() {
    console.log('UCSD AI Extension: updateChatWelcomeMessage called, transcriptionData:', transcriptionData ? transcriptionData.length : 'null');
    const messagesContainer = document.getElementById('chat-messages');
    console.log('UCSD AI Extension: messagesContainer found:', !!messagesContainer);
    if (messagesContainer) {
      const welcomeMessage = messagesContainer.querySelector('.ai-message');
      console.log('UCSD AI Extension: welcomeMessage found:', !!welcomeMessage);
      if (welcomeMessage) {
        if (transcriptionData && transcriptionData.length > 0) {
          welcomeMessage.innerHTML = `
            <p>✅ <strong>Transcription loaded!</strong> I have access to ${transcriptionData.length} segments of the lecture.</p>
            <p>What would you like to know about this lecture?</p>
            <p><small>Try asking: "What did the professor say at 00:25:09?" or "Summarize the main points"</small></p>
          `;
        } else {
          welcomeMessage.innerHTML = `
            <p>⏳ <strong>Transcription not found automatically.</strong></p>
            <p>Click below to load the SRT file from the Network tab:</p>
            <div style="margin: 10px 0;">
              <button id="auto-load-srt" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 10px; width: 100%;">🔄 Auto-Load SRT from Page</button>
            </div>
            <p style="font-size: 12px; color: #666;">Or paste SRT URL manually:</p>
            <div style="margin: 10px 0;">
              <input type="text" id="manual-srt-url" placeholder="Paste SRT URL from Network tab..." style="width: 100%; padding: 8px; margin: 5px 0; font-size: 12px;">
              <button id="load-srt-manually" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Load SRT</button>
            </div>
          `;

          // Add event listeners
          setTimeout(() => {
            // Auto-load button
            const autoButton = document.getElementById('auto-load-srt');
            if (autoButton) {
              autoButton.addEventListener('click', async () => {
                console.log('UCSD AI Extension: Auto-load button clicked');
                autoButton.textContent = '🔄 Searching...';
                autoButton.disabled = true;

                // Search page HTML for SRT URL
                const pageHTML = document.documentElement.outerHTML;
                const srtMatch = pageHTML.match(/https?:\/\/cfvod\.kaltura\.com[^"'\s<>]+\.srt[^"'\s<>]*/i);

                if (srtMatch) {
                  console.log('UCSD AI Extension: Found SRT URL:', srtMatch[0]);
                  try {
                    await fetchSRTFromURL(srtMatch[0]);
                    // Success - updateChatWelcomeMessage() will replace this button with success message
                  } catch (err) {
                    autoButton.textContent = '❌ Failed to Load - Try Manual';
                    autoButton.style.background = '#dc3545';
                    autoButton.disabled = false;
                  }
                } else {
                  // Try to construct from captionAssetId
                  const captionMatch = pageHTML.match(/captionAssetId[\/=]([a-zA-Z0-9_]+)/);
                  const ksMatch = pageHTML.match(/\/ks\/([a-zA-Z0-9_\-]+)/);

                  if (captionMatch && ksMatch) {
                    const srtUrl = `https://cfvod.kaltura.com/api_v3/index.php/service/caption_captionAsset/action/serve/captionAssetId/${captionMatch[1]}/ks/${ksMatch[1]}/.srt`;
                    console.log('UCSD AI Extension: Constructed SRT URL:', srtUrl);
                    try {
                      await fetchSRTFromURL(srtUrl);
                      // Success - updateChatWelcomeMessage() will replace this button with success message
                    } catch (err) {
                      autoButton.textContent = '❌ Failed to Load - Try Manual';
                      autoButton.style.background = '#dc3545';
                      autoButton.disabled = false;
                    }
                  } else {
                    autoButton.textContent = '❌ SRT Not Found - Use Manual Method';
                    autoButton.style.background = '#dc3545';
                    autoButton.disabled = false;
                    console.log('UCSD AI Extension: Could not find SRT URL in page');
                  }
                }
              });
            }

            // Manual load button
            const manualButton = document.getElementById('load-srt-manually');
            const manualInput = document.getElementById('manual-srt-url');
            if (manualButton && manualInput) {
              manualButton.addEventListener('click', async () => {
                const url = manualInput.value.trim();
                if (url) {
                  console.log('UCSD AI Extension: Manual SRT URL provided:', url);
                  manualButton.textContent = 'Loading...';
                  manualButton.disabled = true;

                  try {
                    await fetchSRTFromURL(url);
                    // Success - updateChatWelcomeMessage() will update the UI
                  } catch (err) {
                    manualButton.textContent = '❌ Failed - Try Again';
                    manualButton.style.background = '#dc3545';
                    setTimeout(() => {
                      manualButton.textContent = 'Load SRT';
                      manualButton.style.background = '#007bff';
                      manualButton.disabled = false;
                    }, 2000);
                  }
                }
              });
            }
          }, 100);
        }
      }
    }
  }

  // Send message with transcription context using Claude API
  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    const messagesContainer = document.getElementById('chat-messages');

    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `<p>${message}</p>`;
    messagesContainer.appendChild(userMessage);

    // Clear input
    input.value = '';

    // Show loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message ai-message loading-message';
    loadingMessage.innerHTML = `<p>🤔 Thinking...</p>`;
    messagesContainer.appendChild(loadingMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Check if transcription is available
    if (!window.ucsdTranscriptionData || window.ucsdTranscriptionData.length === 0) {
      loadingMessage.classList.remove('loading-message');
      loadingMessage.innerHTML = `<p>❌ <strong>Transcription not loaded.</strong> Please check the console for errors or try manually loading the SRT file.</p>`;
      return;
    }

    // Check if config is available
    if (!window.UCSD_AI_CONFIG || !window.UCSD_AI_CONFIG.ANTHROPIC_API_KEY) {
      loadingMessage.classList.remove('loading-message');
      loadingMessage.innerHTML = `<p>❌ <strong>Configuration error.</strong> API key not found. Please check config.js.</p>`;
      return;
    }

    try {
      console.log('UCSD AI Extension: Calling Claude API...');

      // Build transcription context (limit to reasonable size to avoid token limits)
      // Claude Sonnet 4 has 200k context window, so we can include the full transcription
      // Each segment is roughly 50-100 tokens, so even 2000 segments (~100 mins) = ~150k tokens max
      const maxSegments = 2000; // Increased to support full-length lectures (up to ~2 hours)
      const transcriptionContext = window.ucsdTranscriptionData
        .slice(0, maxSegments)
        .map(seg => `[${seg.startTime}] ${seg.text}`)
        .join('\n');

      const systemPrompt = `You are an AI assistant helping students understand lecture content from UCSD. You have access to a complete lecture transcription with timestamps.

Your role is to:
- Answer questions about the lecture content accurately
- Reference specific timestamps when relevant
- Summarize topics clearly
- Help students find information quickly
- Be concise but thorough

When referencing the transcription, cite timestamps like [00:25:09] so students can jump to that part of the video.`;

      const userPrompt = `Here is the lecture transcription:\n\n${transcriptionContext}\n\n---\n\nStudent question: ${message}`;

      // Call Claude API via local proxy server to avoid CORS issues
      const proxyEndpoint = 'http://localhost:3000/api/chat';

      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: userPrompt
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('UCSD AI Extension: API error:', errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('UCSD AI Extension: Received response from Claude');

      // Extract the response text
      const aiResponse = data.content[0].text;

      // Remove loading message and add AI response
      loadingMessage.classList.remove('loading-message');
      loadingMessage.innerHTML = `<p>${aiResponse.replace(/\n/g, '</p><p>')}</p>`;

      messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (error) {
      console.error('UCSD AI Extension: Error calling Claude API:', error);

      loadingMessage.classList.remove('loading-message');
      loadingMessage.innerHTML = `
        <p>❌ <strong>Error communicating with AI:</strong> ${error.message}</p>
        <p><small>Check the console for more details.</small></p>
      `;
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Find segment by timestamp
  function findSegmentByTimestamp(timestamp) {
    if (!window.ucsdTranscriptionData) return null;
    
    // Convert timestamp to seconds for comparison
    const timeToSeconds = (timeStr) => {
      const parts = timeStr.replace(',', '.').split(':');
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    };
    
    const requestedSeconds = timeToSeconds(timestamp);
    
    // Find the segment that contains this timestamp
    return window.ucsdTranscriptionData.find(segment => {
      const startSeconds = timeToSeconds(segment.startTime);
      const endSeconds = timeToSeconds(segment.endTime);
      return requestedSeconds >= startSeconds && requestedSeconds <= endSeconds;
    });
  }

  // Find video elements specific to podcast.ucsd.edu
  function findVideoElements() {
    const videos = [];
    
    console.log('UCSD AI Extension: Looking for video elements...');
    
    // Look for the specific Kaltura player iframe used on podcast.ucsd.edu
    const kalturaPlayer = document.getElementById('kaltura_player_ifp');
    console.log('UCSD AI Extension: kaltura_player_ifp found:', !!kalturaPlayer);
    if (kalturaPlayer) {
      videos.push(kalturaPlayer);
    }

    // Also check for the Kaltura player container
    const kalturaContainer = document.getElementById('kaltura_player');
    console.log('UCSD AI Extension: kaltura_player found:', !!kalturaContainer);
    if (kalturaContainer) {
      videos.push(kalturaContainer);
    }

    // Look for any iframe in the mediaspace div (fallback)
    const mediaspace = document.getElementById('mediaspace');
    console.log('UCSD AI Extension: mediaspace found:', !!mediaspace);
    if (mediaspace) {
      const iframes = mediaspace.querySelectorAll('iframe');
      console.log('UCSD AI Extension: iframes in mediaspace:', iframes.length);
      iframes.forEach(iframe => videos.push(iframe));
    }

    console.log('UCSD AI Extension: Total videos found:', videos.length);
    return videos;
  }

  // Check if video is paused
  function isVideoPaused(video) {
    if (video.tagName === 'VIDEO') {
      return video.paused;
    } else if (video.tagName === 'IFRAME') {
      // For iframes, we can't directly check pause state
      // We'll show the button when iframe is present
      return true;
    }
    return false;
  }

  // Monitor video state
  function monitorVideo() {
    console.log('UCSD AI Extension: Monitoring video...');
    const videos = findVideoElements();
    
    // Since we're on podcast.ucsd.edu, always show the button
    // The button is already visible by default now
    console.log('UCSD AI Extension: On podcast.ucsd.edu - button should be visible');
    
    if (videos.length > 0) {
      currentVideo = videos[0];
      console.log('UCSD AI Extension: Video found:', currentVideo.tagName);
      
      // Try to listen for Kaltura events if available
      if (currentVideo.tagName === 'IFRAME') {
        try {
          if (window.kWidget && window.kWidget.addReadyCallback) {
            console.log('UCSD AI Extension: Setting up Kaltura event listeners');
            window.kWidget.addReadyCallback(function(playerId) {
              console.log('UCSD AI Extension: Kaltura player ready:', playerId);
              const player = document.getElementById(playerId);
              if (player && player.kBind) {
                player.kBind('onpause', () => {
                  console.log('UCSD AI Extension: Video paused');
                  // Button stays visible
                });
                player.kBind('onplay', () => {
                  console.log('UCSD AI Extension: Video playing');
                  // Button stays visible
                });
              }
            });
          }
        } catch (e) {
          console.log('UCSD AI Extension: Kaltura player not ready yet:', e);
        }
      }
    } else {
      console.log('UCSD AI Extension: No specific video elements found, but button remains visible');
    }
  }

  // Initialize
  function init() {
    console.log('UCSD AI Extension: Initializing...');
    createFloatingButton();
    // Don't create sidebar yet - wait until user clicks "Ask AI"
    // createSidebar();
    monitorVideo();
    fetchSRTFromNetwork();

    // Monitor for dynamically loaded content
    const observer = new MutationObserver(() => {
      console.log('UCSD AI Extension: DOM changed, rechecking videos');
      monitorVideo();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('UCSD AI Extension: Initialization complete');
  }


  // Start when DOM is ready
  if (document.readyState === 'loading') {
    console.log('UCSD AI Extension: DOM still loading, waiting...');
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log('UCSD AI Extension: DOM ready, initializing now');
    init();
  }

})();
