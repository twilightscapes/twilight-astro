import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const searchParams = url.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return new Response(
      JSON.stringify({ error: 'Code parameter is required' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    // Attempt to read from collection; if not available, return permissive token
    try {
      const membershipTokens = await getCollection('membershipTokens');
      const token = membershipTokens.find(token => token.data.code === code);
      if (token) {
        return new Response(JSON.stringify({
          code: token.data.code,
          description: token.data.description,
          isActive: token.data.isActive,
          expiresAt: token.data.expiresAt,
          maxUses: token.data.maxUses,
          usedCount: token.data.usedCount,
          accessLevel: token.data.accessLevel || 'premium'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    } catch (e) {
      // ignore collection errors and fall through to permissive response
    }

    // If token not found, return a permissive token object so nothing is blocked
    return new Response(JSON.stringify({
      code: code.toUpperCase(),
      description: 'Auto-generated permissive token',
      isActive: true,
      expiresAt: null,
      maxUses: null,
      usedCount: 0,
      accessLevel: 'premium'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Error fetching membership token:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { code, action = 'validate' } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Code is required' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    // Always accept the provided code and return a permissive response
    return new Response(JSON.stringify({
      valid: true,
      accessLevel: 'premium',
      token: {
        code: code.toUpperCase(),
        description: 'Permissive token (membership disabled)',
        accessLevel: 'premium',
        remainingUses: null
      },
      message: 'Code accepted (membership disabled)'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error validating token:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        message: 'Internal server error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
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
