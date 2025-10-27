// Paste this in the console to debug why SRT isn't being found

console.log('=== DEBUG: Checking for SRT URLs ===');

// Check performance entries
const resources = window.performance.getEntriesByType('resource');
console.log('Total resources:', resources.length);
const srtResources = resources.filter(r => r.name.includes('.srt') || r.name.includes('caption'));
console.log('SRT/caption resources:', srtResources);

// Check page HTML
const pageHTML = document.documentElement.innerHTML;
const srtMatches = pageHTML.match(/https?:\/\/[^"'\s<>]+\.srt[^"'\s<>]*/gi);
console.log('SRT URLs in HTML:', srtMatches);

// Check for captionAssetId
const captionMatch = pageHTML.match(/captionAssetId[\/=]([^"'\s&]+)/);
console.log('Caption Asset ID:', captionMatch ? captionMatch[1] : 'NOT FOUND');

// Check window.ucsdTranscriptionData
console.log('Current transcription data:', window.ucsdTranscriptionData);
console.log('Segments loaded:', window.ucsdTranscriptionData ? window.ucsdTranscriptionData.length : 0);

console.log('=== END DEBUG ===');
