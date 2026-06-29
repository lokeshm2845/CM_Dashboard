/**
 * Validates the Grievance Submission Form data.
 */
export function validateComplaint(data) {
  const errors = {};

  if (!data.title || data.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long.';
  }
  if (!data.description || data.description.trim().length < 15) {
    errors.description = 'Description must be at least 15 characters long.';
  }
  if (!data.category) {
    errors.category = 'Complaint category is required.';
  }
  if (!data.district) {
    errors.district = 'Delhi district is required.';
  }
  if (data.latitude && isNaN(parseFloat(data.latitude))) {
    errors.latitude = 'Latitude must be a valid float number.';
  }
  if (data.longitude && isNaN(parseFloat(data.longitude))) {
    errors.longitude = 'Longitude must be a valid float number.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates the Admin Tour Schedule Visit Form.
 */
export function validateVisitLog(data) {
  const errors = {};

  if (!data.district) {
    errors.district = 'District is required.';
  }
  if (!data.visitDate) {
    errors.visitDate = 'Visit date is required.';
  } else {
    const selectedDate = new Date(data.visitDate);
    if (isNaN(selectedDate.getTime())) {
      errors.visitDate = 'Please select a valid date.';
    }
  }
  if (!data.purpose || data.purpose.trim().length < 5) {
    errors.purpose = 'Purpose must be at least 5 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates standard email structure.
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).toLowerCase());
}
