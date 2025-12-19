/**
 * File Download Utilities
 * Helper functions to download files without exposing URLs in browser address bar
 */

/**
 * Download a file from URL without navigating to it
 * @param {string} url - File URL to download
 * @param {string} filename - Optional filename for download
 */
export const downloadFile = (url, filename = null) => {
  if (!url) {
    console.error('No URL provided for download');
    return;
  }

  try {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || ''; // Force download instead of navigation
    link.target = '_blank'; // Open in new tab if download fails
    link.rel = 'noopener noreferrer';
    
    // Append to body, click, then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download file:', error);
    // Fallback: open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Open file in new tab without changing current page URL
 * For images and PDFs that should be viewed, not downloaded
 * @param {string} url - File URL to open
 */
export const openFileInNewTab = (url) => {
  if (!url) {
    console.error('No URL provided');
    return;
  }

  try {
    // Open in new tab with noopener for security
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      // If popup blocked, fallback to download
      downloadFile(url);
    }
  } catch (error) {
    console.error('Failed to open file:', error);
  }
};

/**
 * Get filename from URL
 * @param {string} url - File URL
 * @returns {string} Filename extracted from URL
 */
export const getFilenameFromUrl = (url) => {
  if (!url) return 'download';
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'download';
    return decodeURIComponent(filename);
  } catch {
    // If URL parsing fails, try to extract from path
    const parts = url.split('/');
    return parts[parts.length - 1] || 'download';
  }
};

