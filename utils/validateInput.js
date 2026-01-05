/**
 * Input validation utilities
 * CRASH-SAFE: Never throws, returns validation result object
 */

/**
 * Validates that answers field is present and is a valid object
 * Returns { valid: boolean, error: string }
 */
function validateAnswers(answers) {
  try {
    // Check if answers exists
    if (!answers) {
      return {
        valid: false,
        error: 'Answers field is required'
      };
    }

    // If it's already an object, it's valid
    if (typeof answers === 'object' && answers !== null && !Array.isArray(answers)) {
      return { valid: true };
    }

    // If it's a string, try to parse it
    if (typeof answers === 'string') {
      try {
        const parsed = JSON.parse(answers);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return { valid: true };
        }
      } catch (e) {
        return {
          valid: false,
          error: 'Answers must be a valid JSON object'
        };
      }
    }

    return {
      valid: false,
      error: 'Answers must be a valid JSON object'
    };
  } catch (error) {
    console.error('Error in validateAnswers:', error.message);
    return {
      valid: false,
      error: 'Invalid input format'
    };
  }
}

/**
 * Parses answers field from request
 * Handles both JSON string and object formats
 * CRASH-SAFE: Returns null on error instead of throwing
 */
function parseAnswers(answers) {
  try {
    if (typeof answers === 'string') {
      return JSON.parse(answers);
    }
    if (typeof answers === 'object' && answers !== null) {
      return answers;
    }
    return null;
  } catch (error) {
    console.error('Error parsing answers:', error.message);
    return null;
  }
}

module.exports = {
  validateAnswers,
  parseAnswers
};

