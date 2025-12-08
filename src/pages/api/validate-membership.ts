import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Always return valid: true to disable membership gating site-wide.
    return new Response(JSON.stringify({
      isValid: true,
      valid: true,
      accessLevel: 'premium',
      tier: 'premium',
      message: 'Membership disabled: site is free and visible to everyone'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('Membership validation error (forced mode):', error);
    return new Response(JSON.stringify({ isValid: true, message: 'Membership forced to valid (fallback)' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ message: 'Use POST method to validate membership' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
