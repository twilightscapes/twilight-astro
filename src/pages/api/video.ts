import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  try {
    const thumbnailUrl = url.searchParams.get('thumbnail');

    if (!thumbnailUrl) {
      return new Response('Missing thumbnail parameter', {
        status: 400,
        headers: { ...headers, 'Content-Type': 'text/plain' }
      });
    }

    // Fetch the original thumbnail
    const response = await fetch(thumbnailUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch thumbnail: ${response.status}`);
    }

    // For now, just proxy the image directly
    // In the future, you could add play icon overlay using a canvas or image processing library
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      }
    });

  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    
    // Return a 404 with CORS headers so the bot can fall back gracefully
    return new Response('Thumbnail not found', {
      status: 404,
      headers: { ...headers, 'Content-Type': 'text/plain' }
    });
  }
};

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
