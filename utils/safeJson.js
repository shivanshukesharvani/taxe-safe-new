/**
 * Safe JSON parsing utilities
 * CRASH-SAFE: Never throws, returns null on error
 */

/**
 * Safely parses JSON string, handling markdown code blocks
 * Returns parsed object or null on error
 */
function safeJsonParse(jsonString) {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return null;
    }

    // Try to extract JSON if wrapped in markdown code blocks
    let cleanJson = jsonString.trim();
    
    // Remove markdown code blocks
    const jsonMatch = cleanJson.match(/```json\s*([\s\S]*?)\s*```/) || 
                      cleanJson.match(/```\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
      cleanJson = jsonMatch[1].trim();
    }

    // Parse JSON
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error parsing JSON:', error.message);
    return null;
  }
}

module.exports = {
  safeJsonParse
};

