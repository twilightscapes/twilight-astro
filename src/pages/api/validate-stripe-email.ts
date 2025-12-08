// API route to proxy Netlify function for local development
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body || {};

    // Always treat the email as having a valid membership — site-wide free mode
    return new Response(JSON.stringify({
      valid: true,
      success: true,
      message: 'Membership disabled: site is free',
      tier: 'premium',
      email: email || null,
      plan: 'premium',
      sessionId: 'free-session',
      tokenData: { code: 'FREE_MODE', accessLevel: 'premium' }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error in validate-stripe-email proxy (forced mode):', error);
    return new Response(JSON.stringify({ success: true, message: 'Membership forced to valid (fallback)' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
