import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://proxy.momoapi.mtn.com';
const TARGET_ENVIRONMENT = 'mtnsouthafrica';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, payerMsisdn, externalId } = await req.json();

    const subscriptionKey = Deno.env.get('MOMO_COLLECTION_SUBSCRIPTION_KEY')!;
    const apiUser = Deno.env.get('MOMO_API_USER')!;
    const apiKey = Deno.env.get('MOMO_API_KEY')!;

    const basicAuth = btoa(`${apiUser}:${apiKey}`);

    // Step 1: Get access token
    const tokenRes = await fetch(`${BASE_URL}/collection/token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'X-Target-Environment': TARGET_ENVIRONMENT,
      },
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return new Response(
        JSON.stringify({ error: `Token error (${tokenRes.status}): ${errText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token } = await tokenRes.json();

    // Step 2: Request to Pay
    const referenceId = crypto.randomUUID();

    const payRes = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/json',
      
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: 'ZAR',
        externalId: externalId || crypto.randomUUID(),
        payer: {
          partyIdType: 'MSISDN',
          partyId: payerMsisdn,
        },
        payerMessage: 'Payment for Sebenza job',
        payeeNote: 'Sebenza job payment',
      }),
    });

    if (payRes.status !== 202) {
      const errText = await payRes.text();
      return new Response(
        JSON.stringify({
          error: `Request to pay failed with status ${payRes.status}: ${errText || '(empty response body)'}`,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, referenceId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});