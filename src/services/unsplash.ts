
import { VideoOrientation } from '../types';

const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

export const fetchUnsplashMedia = async (
  query: string,
  mediaType: 'image' | 'video', // Unsplash is images only
  apiKey: string,
  orientation: VideoOrientation,
  usedUrls: Set<string>,
  visualSubject?: string,
  negativePrompt?: string
): Promise<string | null> => {
  if (!apiKey) return null;
  if (mediaType === 'video') return null; // Unsplash does not support video

  const performSearch = async (term: string) => {
    try {
        // Construct search term with exclusions if supported, 
        // though Unsplash search is less strict about "-" syntax, it often works.
        let finalQuery = term;
        if (negativePrompt && negativePrompt.trim()) {
            // Unsplash doesn't officially document negative prompts like "-cat" heavily, 
            // but we try to stick to the main subject.
            // We'll trust the main term primarily.
        }

        console.log(`Unsplash Search: "${finalQuery}"`);

        const params = new URLSearchParams({
            query: finalQuery,
            per_page: '30',
            orientation: orientation === VideoOrientation.Landscape ? 'landscape' : 'portrait',
            content_filter: 'high'
        });

        const response = await fetch(`${UNSPLASH_API_URL}?${params.toString()}`, {
            headers: {
                'Authorization': `Client-ID ${apiKey}`
            }
        });

        if (!response.ok) return [];
        const data = await response.json();
        return data.results || [];
    } catch (e) {
        console.error("Unsplash API Error:", e);
        return [];
    }
  };

  try {
    let searchTerm = query;
    // Strict Mode: Use visual subject if available
    if (visualSubject && visualSubject.trim()) {
        searchTerm = visualSubject.trim();
    }

    let candidates = await performSearch(searchTerm);

    // Fallback: If no results for specific term, try strictly visual subject if we haven't already
    if (candidates.length === 0 && visualSubject && searchTerm !== visualSubject) {
        console.warn(`Unsplash: No hits for "${searchTerm}". Retrying subject "${visualSubject}"...`);
        candidates = await performSearch(visualSubject);
    }

    if (candidates.length > 0) {
        // Sort by likes implies quality usually
        candidates.sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0));

        for (const hit of candidates) {
            // Unsplash provides raw, full, regular, small, thumb
            // Regular is usually good for web (1080w), Full is better for video.
            const url = hit.urls.regular || hit.urls.full || hit.urls.small;
            
            if (url && !usedUrls.has(url)) {
                return url;
            }
        }
    }
    
    return null;
  } catch (error) {
    console.error('Unsplash Service Error:', error);
    return null;
  }
};
