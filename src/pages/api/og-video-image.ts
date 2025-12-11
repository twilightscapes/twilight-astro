import type { APIRoute } from 'astro';
import sharp from 'sharp';

// Ensure this is not prerendered
export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
  // Try to get the parameter from the request URL instead
  const requestUrl = new URL(request.url);
  const thumbnailUrl = requestUrl.searchParams.get('thumbnail') || url.searchParams.get('thumbnail');
  
  if (!thumbnailUrl) {
    return new Response(`Missing thumbnail parameter.`, { 
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  try {
    // Fetch the original thumbnail with fallback support
    let thumbnailResponse = await fetch(thumbnailUrl);
    
    // If maxresdefault fails, try fallback sizes
    if (!thumbnailResponse.ok && thumbnailUrl.includes('img.youtube.com')) {
      const videoIdMatch = thumbnailUrl.match(/\/vi\/([^\/]+)\//);      
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        const fallbackSizes = ['sddefault.jpg', 'hqdefault.jpg', 'mqdefault.jpg', 'default.jpg'];
        
        for (const size of fallbackSizes) {
          const fallbackUrl = `https://img.youtube.com/vi/${videoId}/${size}`;
          thumbnailResponse = await fetch(fallbackUrl);
          if (thumbnailResponse.ok) {
            console.log(`✅ Using fallback thumbnail: ${size}`);
            break;
          }
        }
      }
    }
    
    if (!thumbnailResponse.ok) {
      return new Response('Failed to fetch thumbnail', { status: 500 });
    }

    const imageBuffer = Buffer.from(await thumbnailResponse.arrayBuffer());

    // Create play button SVG with white/transparent circle and dark blue arrow
    const playButtonSvg = Buffer.from(`
      <svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.5"/>
          </filter>
        </defs>
        <!-- White/transparent circle background -->
        <circle cx="50" cy="50" r="30" fill="rgba(255, 255, 255, 0.8)" filter="url(#shadow)"/>
        <!-- Bluesky dark blue play triangle -->
        <polygon points="42,35 42,65 65,50" fill="#161F28" fill-opacity="0.95"/>
      </svg>
    `);

    // Resize thumbnail to OG image size and composite with play button
    const compositedImage = await sharp(imageBuffer)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .composite([
        {
          input: playButtonSvg,
          gravity: 'center'
        }
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    return new Response(new Uint8Array(compositedImage), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response(`Failed to generate image: ${error}`, { status: 500 });
  }
};
