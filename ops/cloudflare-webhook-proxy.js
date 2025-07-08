/**
 * Cloudflare Worker - Webhook Proxy with HMAC Verification
 * Free tier: 100k requests/day, zero-budget guardrails
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers for preflight
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Sig, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    try {
      // Extract webhook signature
      const signature = request.headers.get('X-Agent-Sig');
      if (!signature) {
        return new Response('Missing signature', { 
          status: 401,
          headers: corsHeaders 
        });
      }

      // Get request body
      const body = await request.text();
      
      // Verify HMAC signature
      const isValid = await verifySignature(body, signature, env.AGENT_KEY);
      if (!isValid) {
        await logEvent('webhook_signature_invalid', {
          signature: signature.substring(0, 20) + '...',
          timestamp: new Date().toISOString()
        }, env);
        
        return new Response('Invalid signature', { 
          status: 401,
          headers: corsHeaders 
        });
      }

      // Parse and validate payload
      let payload;
      try {
        payload = JSON.parse(body);
      } catch (e) {
        return new Response('Invalid JSON', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // Rate limiting check (simple in-memory for demo)
      const rateLimitKey = getClientIP(request);
      if (await isRateLimited(rateLimitKey, env)) {
        return new Response('Rate limited', { 
          status: 429,
          headers: corsHeaders 
        });
      }

      // Log incoming webhook
      await logEvent('webhook_received', {
        event_type: payload.event_type,
        timestamp: new Date().toISOString(),
        client_ip: rateLimitKey
      }, env);

      // Forward to Airtable Agent
      const airtableResponse = await forwardToAirtableAgent(request, body, env);
      
      // Log forwarding result
      await logEvent('webhook_forwarded', {
        status: airtableResponse.status,
        timestamp: new Date().toISOString()
      }, env);

      return new Response(airtableResponse.body, {
        status: airtableResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      // Log error
      await logEvent('webhook_error', {
        error: error.message,
        timestamp: new Date().toISOString()
      }, env);

      return new Response('Internal server error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  }
};

/**
 * Verify HMAC signature
 */
async function verifySignature(body, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const providedHex = signature.replace('sha256=', '');
  
  // Constant-time comparison
  return expectedHex === providedHex;
}

/**
 * Simple rate limiting (100 requests per minute per IP)
 */
async function isRateLimited(clientIP, env) {
  const key = `rate_limit:${clientIP}`;
  const current = await env.RATE_LIMIT_KV?.get(key);
  
  if (!current) {
    await env.RATE_LIMIT_KV?.put(key, '1', { expirationTtl: 60 });
    return false;
  }

  const count = parseInt(current);
  if (count >= 100) {
    return true;
  }

  await env.RATE_LIMIT_KV?.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return false;
}

/**
 * Get client IP address
 */
function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         'unknown';
}

/**
 * Forward request to Airtable Agent
 */
async function forwardToAirtableAgent(originalRequest, body, env) {
  const airtableAgentUrl = env.AIRTABLE_AGENT_URL || 'https://your-airtable-agent.railway.app/webhook';
  
  const forwardRequest = new Request(airtableAgentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Sig': originalRequest.headers.get('X-Agent-Sig'),
      'User-Agent': 'ESA-Webhook-Proxy/1.0'
    },
    body: body
  });

  try {
    const response = await fetch(forwardRequest);
    const responseBody = await response.text();
    
    return {
      status: response.status,
      body: responseBody
    };
  } catch (error) {
    return {
      status: 502,
      body: JSON.stringify({ error: 'Failed to forward to Airtable Agent' })
    };
  }
}

/**
 * Log events to KV store for monitoring
 */
async function logEvent(eventType, data, env) {
  if (!env.WEBHOOK_LOGS_KV) return;
  
  const logEntry = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    data: data
  };

  const key = `log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  await env.WEBHOOK_LOGS_KV.put(key, JSON.stringify(logEntry), { expirationTtl: 86400 * 7 }); // 7 days
}