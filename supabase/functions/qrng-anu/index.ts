import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching quantum random data from ANU...');
    
    const response = await fetch('https://qrng.anu.edu.au/API/jsonI.php?length=32&type=uint8', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`ANU API error: ${response.status} ${response.statusText}`);
      throw new Error(`ANU API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully fetched quantum data from ANU');

    // Validate the response structure
    if (!data.data || !Array.isArray(data.data) || data.data.length !== 32) {
      console.error('Invalid data structure from ANU API:', data);
      throw new Error('Invalid response format from ANU API');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in qrng-anu function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch quantum random data',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});