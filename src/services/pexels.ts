import { VideoOrientation } from '../types';

const PEXELS_API_BASE = 'https://api.pexels.com';

export const fetchPexelsMedia = async (
  query: string,
  mediaType: 'image' | 'video',
  apiKey: string,
  orientation: VideoOrientation,
  usedUrls: Set<string>,
  visualSubject?: string,
  negativePrompt?: string
): Promise<string | null> => {
  if (!apiKey) return null;

  let baseTerm = query;
  // Strict Mode Logic (Consistent with Pixabay)
  if (visualSubject && visualSubject.trim()) {
    baseTerm = visualSubject.trim();
  }

  const performSearch = async (term: string, useNegatives: boolean) => {
    let searchTerm = term;
    
    // Apply Negative Prompt manually by appending exclusions
    if (useNegatives && negativePrompt && negativePrompt.trim()) {
        // Split by comma OR space
        const negatives = negativePrompt.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
        const negativeString = negatives.map(n => `-${n}`).join(' ');
        searchTerm = `${searchTerm} ${negativeString}`;
    }
    
    console.log(`Pexels Search: "${searchTerm}"`);

    const isVideo = mediaType === 'video';
    const endpoint = isVideo ? `${PEXELS_API_BASE}/videos/search` : `${PEXELS_API_BASE}/v1/search`;
    const pexelsOrientation = orientation === VideoOrientation.Landscape ? 'landscape' : 'portrait';

    const params = new URLSearchParams({
      query: searchTerm,
      per_page: '80',
      orientation: pexelsOrientation,
      size: 'medium'
    });

    try {
      const res = await fetch(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: apiKey }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return isVideo ? (data.videos || []) : (data.photos || []);
    } catch (e) {
      console.error("Pexels API Error", e);
      return [];
    }
  };

  try {
    // Attempt 1: With negatives
    let candidates = await performSearch(baseTerm, true);

    // Attempt 2: Without negatives if empty
    if (candidates.length === 0 && negativePrompt && negativePrompt.trim()) {
        console.warn(`Pexels: No hits with negatives. Retrying clean search for "${baseTerm}"...`);
        candidates = await performSearch(baseTerm, false);
    }

    if (candidates.length === 0 && !visualSubject) {
        console.warn(`Pexels: No hits for "${baseTerm}"`);
    }

    if (candidates.length > 0) {
      const isVideo = mediaType === 'video';
      
      for (const item of candidates) {
        let url = '';
        if (isVideo) {
          const files = item.video_files || [];
          files.sort((a: any, b: any) => b.width - a.width);
          
          const mp4Files = files.filter((f: any) => f.file_type === 'video/mp4' || !f.file_type); 
          const best = mp4Files.find((f: any) => f.height >= 720) || mp4Files[0];
          url = best?.link;
        } else {
          url = item.src.large2x || item.src.original || (orientation === VideoOrientation.Landscape ? item.src.landscape : item.src.portrait);
        }

        if (url && !usedUrls.has(url)) {
          return url;
        }
      }
    }
    return null;
  } catch (err) {
    console.error("Pexels Fetch Error", err);
    return null;
  }
};