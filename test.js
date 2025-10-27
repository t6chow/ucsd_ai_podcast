// Minimal test script
console.log('MINIMAL TEST: Script is executing');

// Define function immediately (not inside any scope)
window.minimalTest = function() {
  console.log('MINIMAL TEST: Function is working!');
};

console.log('MINIMAL TEST: Function defined:', typeof window.minimalTest);
console.log('MINIMAL TEST: Function available:', window.minimalTest);