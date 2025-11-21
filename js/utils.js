/**
 * Utility Functions for Task Board Application
 * Provides helper functions for ID generation, date formatting, validation, and sanitization
 */

/**
 * Generate a unique identifier using timestamp and random number
 * @returns {string} Unique identifier
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format a timestamp into a human-readable date string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string (e.g., "Jan 1, 2024")
 */
function formatDate(timestamp) {
  if (!timestamp) {
    return '';
  }
  
  const date = new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Validate task data to ensure it meets requirements
 * @param {Object} taskData - Task object to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateTask(taskData) {
  const errors = [];
  
  // Check if taskData exists
  if (!taskData) {
    errors.push('Task data is required');
    return { isValid: false, errors };
  }
  
  // Validate title
  if (!taskData.title || isEmptyOrWhitespace(taskData.title)) {
    errors.push('Task title cannot be empty or whitespace only');
  }
  
  // Validate status if provided
  if (taskData.status && !['todo', 'in-progress', 'complete'].includes(taskData.status)) {
    errors.push('Invalid task status. Must be: todo, in-progress, or complete');
  }
  
  // Validate priority if provided
  if (taskData.priority && !['high', 'medium', 'low'].includes(taskData.priority)) {
    errors.push('Invalid task priority. Must be: high, medium, or low');
  }
  
  // Validate dueDate if provided
  if (taskData.dueDate !== null && taskData.dueDate !== undefined && taskData.dueDate !== '') {
    const dueDate = new Date(taskData.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push('Invalid due date format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize HTML input to prevent XSS attacks
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string safe for HTML insertion
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Create a temporary div element to use browser's built-in HTML encoding
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Check if a string is empty or contains only whitespace characters
 * @param {string} str - String to check
 * @returns {boolean} True if string is empty or whitespace only
 */
function isEmptyOrWhitespace(str) {
  if (typeof str !== 'string') {
    return true;
  }
  
  return str.trim().length === 0;
}

/**
 * Calculate contrast ratio between two colors for accessibility
 * @param {string} color1 - First color in hex format
 * @param {string} color2 - Second color in hex format
 * @returns {number} Contrast ratio (1-21)
 */
function getContrastRatio(color1, color2) {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Calculate relative luminance
  const getLuminance = (rgb) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    return 0;
  }
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}
