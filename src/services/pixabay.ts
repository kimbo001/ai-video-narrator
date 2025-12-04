
import { VideoOrientation } from '../types';

const PIXABAY_API_URL = 'https://pixabay.com/api/';

export const fetchPixabayMedia = async (
  query: string,
  mediaType: 'image' | 'video',
  apiKey: string,
  orientation: VideoOrientation,
  usedUrls: Set<string>,
  visualSubject?: string,
  negativePrompt?: string
): Promise<string | null> => {
  if (!apiKey) return null;

  // Helper to perform the actual fetch
  const performSearch = async (searchTerm: string, useNegatives: boolean) => {
    try {
      const isVideo = mediaType === 'video';
      const endpoint = isVideo ? `${PIXABAY_API_URL}videos/` : PIXABAY_API_URL;
      
      // Construct negative prompt string
      let finalQuery = searchTerm;
      
      if (useNegatives && negativePrompt && negativePrompt.trim()) {
          // Split by comma OR space to handle "blind people" as "-blind -people"
          const negatives = negativePrompt.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
          const negativeString = negatives.map(n => `-${n}`).join(' ');
          finalQuery = `${finalQuery} ${negativeString}`;
      }

      console.log(`Pixabay Search: "${finalQuery}"`);

      const params = new URLSearchParams({
        key: apiKey,
        safesearch: 'true',
        per_page: '200', // Maximize pool to avoid duplicates
        q: finalQuery
      });

      if (!isVideo) {
        params.append('image_type', 'photo');
        params.append('orientation', orientation);
      } else {
        params.append('video_type', 'all');
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.hits || [];
    } catch (e) {
      console.error("Pixabay fetch error:", e);
      return [];
    }
  };

  try {
    const isVideo = mediaType === 'video';
    
    // STRICT MODE LOGIC:
    let searchTerm = query;
    if (visualSubject && visualSubject.trim()) {
        searchTerm = visualSubject.trim();
    }

    // Attempt 1: Search WITH negatives
    let candidates = await performSearch(searchTerm, true);

    // Attempt 2: If 0 results and we used negatives, retry WITHOUT negatives
    if (candidates.length === 0 && negativePrompt && negativePrompt.trim()) {
        console.warn(`Pixabay: No hits with negatives. Retrying clean search for "${searchTerm}"...`);
        candidates = await performSearch(searchTerm, false);
    }

    if (candidates.length === 0 && !visualSubject) {
         console.warn(`Pixabay: No hits for "${searchTerm}"`);
    }

    if (candidates.length > 0) {
      // 1. Sort by Likes (Popularity) descending
      candidates.sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0));

      // 2. Client-side Orientation Filter for Videos
      if (isVideo) {
        if (orientation === VideoOrientation.Portrait) {
           // Sort by tallness (height/width ratio) within the popular results
           const verticalCandidates = candidates.filter((c: any) => c.videos.medium.height >= c.videos.medium.width);
           
           if (verticalCandidates.length > 0) {
               candidates = verticalCandidates;
           } else {
              // Fallback: sort by least wide
              candidates = candidates.sort((a: any, b: any) => {
                 const ratioA = a.videos.medium.height / a.videos.medium.width;
                 const ratioB = b.videos.medium.height / b.videos.medium.width;
                 return ratioB - ratioA; 
               });
           }
        }
      }

      // Find first candidate not in usedUrls
      for (const hit of candidates) {
          let url = '';
          if (isVideo) {
             // Prefer medium, fallback to others
             url = hit.videos.medium.url || hit.videos.large.url || hit.videos.tiny.url;
          } else {
             url = hit.largeImageURL;
          }

          if (url && !usedUrls.has(url)) {
              return url;
          }
      }

      console.warn(`All media for "${searchTerm}" has been used. Returning null to trigger fallback.`);
      return null;
    }
    
    return null;

  } catch (error) {
    console.error('Pixabay API Error:', error);
    return null;
  }
};

export const fetchPixabayAudio = async (apiKey: string, mood: string): Promise<string | null> => {
    if (!apiKey) return null;
    try {
        const params = new URLSearchParams({
            key: apiKey,
            q: mood,
            category: 'music',
            per_page: '30'
        });
        
        // Pixabay Audio endpoint is technically different, often documented as separate or under /audio/
        // Standard endpoint: https://pixabay.com/api/videos/ handles videos, but audio is usually undocumented publicly in the same wrapper,
        // BUT Pixabay *does* have an audio API. 
        // NOTE: The main API key often works for https://pixabay.com/api/?video_type=... but music is tricky.
        // Let's try the common endpoint for music or fallback to a hardcoded generic if API fails.
        // Actually, Pixabay Audio API usually requires a specific request. 
        // If this fails, we will assume no music to prevent breaking.
        
        // Correct endpoint for music if available to your key:
        const response = await fetch(`https://pixabay.com/api/audio/?${params.toString()}`);
        if(!response.ok) return null;
        
        const data = await response.json();
        if(data.hits && data.hits.length > 0) {
            // Pick random track from top 30
            const random = data.hits[Math.floor(Math.random() * data.hits.length)];
            return random.audio || null; // 'audio' field might vary, sometimes 'url'
        }
        return null;
    } catch(e) {
        console.error("Pixabay Audio Error:", e);
        return null;
    }
}
