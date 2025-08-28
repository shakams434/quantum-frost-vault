import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate unique verification ID
function generateVerificationId(): string {
  return crypto.randomUUID();
}

// Calculate SHA-256 hash
async function calculateHash(data: any): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(data)));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const requestTimestamp = new Date().toISOString();
    const verificationId = generateVerificationId();
    
    console.log('Fetching quantum random data from ANU...');
    
    const response = await fetch('https://qrng.anu.edu.au/API/jsonI.php?length=32&type=uint8', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;

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

    // Calculate hash of the ANU response
    const responseHash = await calculateHash(data);

    // Add verification metadata
    const enhancedResponse = {
      ...data,
      metadata: {
        verificationId,
        timestamp: requestTimestamp,
        responseTime,
        responseHash,
        source: 'ANU Quantum Random Number Generator',
        endpoint: 'https://qrng.anu.edu.au/API/jsonI.php',
        parameters: { length: 32, type: 'uint8' },
        generationType: 'QRNG'
      }
    };

    return new Response(JSON.stringify(enhancedResponse), {
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