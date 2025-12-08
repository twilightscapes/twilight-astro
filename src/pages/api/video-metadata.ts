import type { APIRoute } from 'astro';

interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle?: string;
}

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const videoUrl = url.searchParams.get('url');
    const videoId = url.searchParams.get('videoId');

    let extractedVideoId: string | null = null;

    // Extract video ID from URL or use provided ID
    if (videoId) {
      extractedVideoId = videoId;
    } else if (videoUrl) {
      extractedVideoId = extractVideoIdFromUrl(videoUrl);
    }

    if (!extractedVideoId) {
      return new Response(JSON.stringify({ 
        error: 'No valid video ID or URL provided' 
      }), {
        status: 400,
        headers
      });
    }

    // Detect platform
    const platform = detectPlatform(videoUrl || extractedVideoId);

    if (platform === 'youtube') {
      const metadata = await fetchYouTubeMetadata(extractedVideoId);
      return new Response(JSON.stringify(metadata), {
        status: 200,
        headers
      });
    }

    // For other platforms, return basic metadata
    return new Response(JSON.stringify({
      videoId: extractedVideoId,
      title: 'Video Player',
      description: 'Watch videos with privacy',
      thumbnail: '/socialCard.webp',
      platform
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch video metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers
    });
  }
};

function extractVideoIdFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Handle YouTube embed URLs
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];
  
  // Handle regular YouTube URLs
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];
  
  // Handle youtu.be URLs
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  
  // If it's already just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  
  return null;
}

function detectPlatform(input: string): string {
  if (!input) return 'unknown';
  
  if (input.includes('youtube.com') || input.includes('youtu.be')) {
    return 'youtube';
  }
  if (input.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (input.includes('twitch.tv')) {
    return 'twitch';
  }
  if (input.includes('facebook.com') || input.includes('fb.watch')) {
    return 'facebook';
  }
  if (input.includes('dailymotion.com')) {
    return 'dailymotion';
  }
  if (input.includes('tiktok.com')) {
    return 'tiktok';
  }
  
  return 'youtube'; // Default to YouTube for backward compatibility
}

async function fetchYouTubeMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    // Use YouTube's oEmbed API (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error(`YouTube API responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      videoId,
      title: data.title || 'YouTube Video',
      description: `Watch ${data.title} by ${data.author_name}`,
      thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: data.author_name
    };
  } catch (error) {
    console.error('Error fetching YouTube oEmbed:', error);
    
    // Fallback: Use direct thumbnail URL and generic title
    return {
      videoId,
      title: 'YouTube Video',
      description: 'Watch this video with privacy',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  }
}

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
