// Simple test script to verify the proxy server works
const fetch = require('node-fetch');

async function testAPI() {
  console.log('Testing UCSD AI Proxy Server...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    console.log('   ✅ Health check:', healthData);

    // Test 2: Chat API with simple message
    console.log('\n2. Testing chat endpoint with Claude...');
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        system: 'You are a helpful assistant.',
        messages: [{
          role: 'user',
          content: 'Say hello in exactly 5 words.'
        }]
      })
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json();
      console.error('   ❌ Chat API error:', errorData);
      return;
    }

    const chatData = await chatResponse.json();
    const reply = chatData.content[0].text;
    console.log('   ✅ Claude replied:', reply);

    console.log('\n🎉 All tests passed! Your proxy server is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Reload your browser extension at chrome://extensions/');
    console.log('2. Visit https://podcast.ucsd.edu');
    console.log('3. Click "Ask AI" and try asking a question');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Make sure the server is running: npm start');
    console.log('- Check that .env file has ANTHROPIC_API_KEY');
    console.log('- Try visiting http://localhost:3000/health in your browser');
  }
}

testAPI();
