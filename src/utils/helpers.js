/**
 * Generates a unique tracking reference in the format CMP-2026-XXXX.
 */
export function generateTrackingId() {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `CMP-2026-${randNum}`;
}

/**
 * Calculates distance in kilometers between two GPS coordinate points.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Simulates GPS capture and compares the officer's verification coordinates 
 * with the reported complaint coordinate location (validates within 500 meters).
 */
export function verifyGPSProximity(officerLat, officerLng, complaintLat, complaintLng) {
  const distance = calculateDistance(officerLat, officerLng, complaintLat, complaintLng);
  console.log(`[Anti-Corruption Audit] GPS verification: Distance of officer from grievance is ${distance.toFixed(3)} km.`);
  // Allow resolve if within 500m (0.5 km)
  return distance <= 0.5;
}

/**
 * Mocks dispatching an SMS.
 */
export function sendMockSMS(phone, message) {
  console.log(`%c[SMS Notification Sent to ${phone}] %c"${message}"`, 'color: #FF9933; font-weight: bold', 'color: inherit');
  return true;
}

/**
 * Mocks dispatching an Email.
 */
export function sendMockEmail(email, subject, message) {
  console.log(`%c[Email Sent to ${email}] %cSubject: ${subject}\nBody: "${message}"`, 'color: #138808; font-weight: bold', 'color: inherit');
  return true;
}
