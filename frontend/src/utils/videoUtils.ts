/**
 * Format a YouTube URL to ensure it uses the embed format
 * @param url The YouTube URL to format
 * @returns Formatted YouTube embed URL or original URL if not recognized
 */
export const formatYouTubeUrl = (url: string): string => {
  if (!url) return '';
  
  // Check if it's already an embed URL
  if (url.includes('youtube.com/embed/')) {
    return ensureHttps(url);
  }
  
  // Convert youtu.be links
  if (url.includes('youtu.be/')) {
    try {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (error) {
      console.error('Error formatting youtu.be URL:', error);
      return ensureHttps(url);
    }
  }
  
  // Convert youtube.com/watch?v= links
  if (url.includes('youtube.com/watch')) {
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (error) {
      console.error('Error formatting youtube.com URL:', error);
      return ensureHttps(url);
    }
  }
  
  // If it's not a recognized YouTube URL, return as is but ensure HTTPS
  return ensureHttps(url);
};

/**
 * Extract YouTube video ID from a URL
 * @param url The YouTube URL
 * @returns The YouTube video ID or null if not found
 */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    // youtu.be format
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0];
    }
    
    // youtube.com/watch format
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v');
    }
    
    // youtube.com/embed format
    if (url.includes('youtube.com/embed/')) {
      return url.split('youtube.com/embed/')[1].split('?')[0];
    }
  } catch (error) {
    console.error('Error extracting YouTube video ID:', error);
  }
  
  return null;
};

/**
 * Get YouTube thumbnail URL from a video URL
 * @param url The YouTube URL
 * @returns URL to the video thumbnail or empty string if not a valid YouTube URL
 */
export const getYouTubeThumbnail = (url: string): string => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return '';
  
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

/**
 * Ensure a URL uses HTTPS protocol
 * @param url The URL to check
 * @returns The URL with HTTPS protocol
 */
const ensureHttps = (url: string): string => {
  if (!url) return '';
  
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  if (!url.startsWith('https://') && !url.startsWith('//')) {
    return `https://${url}`;
  }
  
  return url;
}; 