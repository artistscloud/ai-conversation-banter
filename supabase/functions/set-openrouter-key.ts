
import { corsHeaders } from '../_shared/cors.ts';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Get the API key from environment variable
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured on server' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Return the API key
    return new Response(
      JSON.stringify({ key: apiKey }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
