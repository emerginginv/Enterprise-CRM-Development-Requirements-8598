// This utility helps with loading screenshots or providing placeholders when needed

/**
 * Get the path to a screenshot image
 * @param {string} name - The name of the screenshot (without extension)
 * @returns {string} - The path to the screenshot or placeholder
 */
export const getScreenshotPath = (name) => {
  // You would replace these with actual screenshot paths from your project
  const screenshots = {
    dashboard: '/screenshots/dashboard.png',
    contacts: '/screenshots/contacts.png',
    deals: '/screenshots/deals.png',
    tasks: '/screenshots/tasks.png', 
    reports: '/screenshots/reports.png',
    companies: '/screenshots/companies.png',
    settings: '/screenshots/settings.png',
    users: '/screenshots/users.png',
  };
  
  // Return the path or a placeholder if not found
  return screenshots[name] || `https://via.placeholder.com/800x500?text=${name.charAt(0).toUpperCase() + name.slice(1)}`;
};

/**
 * Generate placeholder URL for a screenshot
 * @param {string} name - The name of the screenshot
 * @param {number} width - Width of the placeholder
 * @param {number} height - Height of the placeholder
 * @returns {string} - URL for the placeholder image
 */
export const getPlaceholder = (name, width = 800, height = 500) => {
  return `https://via.placeholder.com/${width}x${height}?text=${name.replace(/_/g, '+')}`;
};

/**
 * Handle image loading error by replacing with a placeholder
 * @param {Event} event - The error event
 * @param {string} name - The name to use in the placeholder
 */
export const handleImageError = (event, name) => {
  event.target.onerror = null; // Prevent infinite loop
  event.target.src = getPlaceholder(name);
};