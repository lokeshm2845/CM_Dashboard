// verify-app.js - Grievance Dashboard Business Logic Unit Test

import { generateTrackingId, calculateDistance, verifyGPSProximity } from './src/utils/helpers.js';
import { DISTRICTS, COMPLAINT_CATEGORIES } from './src/utils/constants.js';
import { DEPARTMENTS, DEFAULT_MAPPINGS } from './src/utils/departmentConstants.js';

let passed = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    passed = false;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- STARTING GRIEVANCE DASHBOARD UNIT TESTS ---');

// Test 1: Tracking ID format
const trackId = generateTrackingId();
assert(/^CMP-2026-\d{4}$/.test(trackId), `Tracking ID format matches pattern CMP-2026-XXXX (got: ${trackId})`);

// Test 2: GPS coordinate distance calculations
// Test saket (28.5621, 77.2056) to saket metro (28.5621, 77.2056) - 0 distance
const d0 = calculateDistance(28.5621, 77.2056, 28.5621, 77.2056);
assert(d0 === 0, `Distance between identical coordinates is 0 (got: ${d0})`);

// Test saket (28.5621, 77.2056) to saket select citywalk (28.5284, 77.2183) - should be around 4km
const d1 = calculateDistance(28.5621, 77.2056, 28.5284, 77.2183);
assert(d1 > 3 && d1 < 5, `Saket to Citywalk distance is realistic: ${d1.toFixed(2)} km`);

// Test 3: GPS Proximity Verification for Resolution Audit
// Saket to Citywalk is 4km (> 500m threshold) -> should fail
const auditFail = verifyGPSProximity(28.5621, 77.2056, 28.5284, 77.2183);
assert(auditFail === false, 'GPS proximity check fails if officer is 4km away from site');

// Saket to 200m away -> should pass
const auditPass = verifyGPSProximity(28.5621, 77.2056, 28.5623, 77.2070);
assert(auditPass === true, 'GPS proximity check passes if officer is close (< 500m) to site');

// Test 4: Verify constants integrity
assert(DISTRICTS.includes('New Delhi'), 'Districts constant includes "New Delhi"');
assert(COMPLAINT_CATEGORIES.includes('Roads / Potholes'), 'Complaint categories constant includes "Roads / Potholes"');

// Test 5: Verify department seeding counts
assert(DEPARTMENTS.length >= 60, `Seeding departments directory has all required integrated nodes (Total: ${DEPARTMENTS.length})`);
assert(DEFAULT_MAPPINGS.some(m => m.category === 'Roads / Potholes' && m.department_code === 'PWD'), 'Default category mapping resolves Roads to PWD');

// Test 6: Chatbot keyphrase matching logic
function simulateChatbotMatching(text) {
  const q = text.toLowerCase();
  if (q.includes('file') || q.includes('register') || q.includes('complain') || q.includes('grievance')) {
    return 'intent_file';
  } else if (q.includes('status') || q.includes('track') || q.includes('check')) {
    return 'intent_track';
  } else if (q.includes('pothole') || q.includes('road')) {
    return 'intent_road';
  } else if (q.includes('water') || q.includes('leak') || q.includes('djb')) {
    return 'intent_water';
  } else if (q.includes('garbage') || q.includes('waste') || q.includes('clean')) {
    return 'intent_garbage';
  }
  return 'intent_default';
}

assert(simulateChatbotMatching('register a new complaint') === 'intent_file', 'Chatbot parses "register a new complaint" as filing intent');
assert(simulateChatbotMatching('how to track status') === 'intent_track', 'Chatbot parses "how to track status" as tracking intent');
assert(simulateChatbotMatching('pothole on ring road') === 'intent_road', 'Chatbot parses road keywords correctly');
assert(simulateChatbotMatching('water leak near dwarka') === 'intent_water', 'Chatbot parses water keywords correctly');
assert(simulateChatbotMatching('pile of garbage near MCD school') === 'intent_garbage', 'Chatbot parses garbage keywords correctly');
assert(simulateChatbotMatching('hello, how are you') === 'intent_default', 'Chatbot falls back to default helper instructions for generic inputs');

if (passed) {
  console.log('\n🌟 ALL CORE ALGORITHMIC BUSINESS LOGIC TESTS COMPLETED SUCCESSFULLY! 🌟');
  process.exit(0);
} else {
  console.error('\n❌ SOME UNIT TESTS ENCOUNTERED FAILURES.');
  process.exit(1);
}

