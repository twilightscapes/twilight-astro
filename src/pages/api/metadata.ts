import type { APIRoute } from 'astro';

export const prerender = false;

interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle?: string;
}

export const GET: APIRoute = async ({ url }) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return new Response(JSON.stringify({ 
        error: 'No video ID provided' 
      }), {
        status: 400,
        headers
      });
    }

    // Fetch metadata from YouTube oEmbed API
    const metadata = await fetchYouTubeMetadata(videoId);
    return new Response(JSON.stringify(metadata), {
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

async function fetchYouTubeMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    // Use YouTube's oEmbed API (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error(`YouTube API responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    // Get the best available thumbnail
    const thumbnail = data.thumbnail_url || await getBestThumbnail(videoId);
    
    return {
      videoId,
      title: data.title || 'YouTube Video',
      description: `Watch ${data.title} by ${data.author_name}`,
      thumbnail,
      channelTitle: data.author_name
    };
  } catch (error) {
    console.error('Error fetching YouTube oEmbed:', error);
    
    // Fallback: Use best available thumbnail and generic title
    return {
      videoId,
      title: 'YouTube Video',
      description: 'Watch this video with privacy',
      thumbnail: await getBestThumbnail(videoId)
    };
  }
}

async function getBestThumbnail(videoId: string): Promise<string> {
  // Try thumbnails in order of quality
  const thumbnailFormats = [
    'maxresdefault.jpg',  // 1280x720
    'sddefault.jpg',      // 640x480
    'hqdefault.jpg',      // 480x360
    'mqdefault.jpg',      // 320x180
    'default.jpg'         // 120x90 (always available)
  ];
  
  for (const format of thumbnailFormats) {
    const url = `https://img.youtube.com/vi/${videoId}/${format}`;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        // Ensure it's not a placeholder (very small file)
        if (contentLength && parseInt(contentLength) > 1000) {
          return url;
        }
      }
    } catch (e) {
      // Continue to next format
    }
  }
  
  // Final fallback - hqdefault is almost always available
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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
