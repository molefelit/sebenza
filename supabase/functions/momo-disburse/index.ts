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
    const { amount, payeeMsisdn, externalId } = await req.json();

    const collectionKey = Deno.env.get('MOMO_COLLECTION_SUBSCRIPTION_KEY')!;
    const disbursementKey = Deno.env.get('MOMO_DISBURSEMENT_SUBSCRIPTION_KEY')!;
    const apiUser = Deno.env.get('MOMO_API_USER')!;
    const apiKey = Deno.env.get('MOMO_API_KEY')!;

    const basicAuth = btoa(`${apiUser}:${apiKey}`);

    const tokenRes = await fetch(`${BASE_URL}/collection/token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Ocp-Apim-Subscription-Key': collectionKey,
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

    const referenceId = crypto.randomUUID();

    const transferRes = await fetch(`${BASE_URL}/disbursement/v1_0/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': disbursementKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: 'ZAR',
        externalId: externalId || crypto.randomUUID(),
        payee: {
          partyIdType: 'MSISDN',
          partyId: payeeMsisdn,
        },
        payerMessage: 'Sebenza job payout',
        payeeNote: 'Payment for completed job',
      }),
    });

    if (transferRes.status !== 202) {
      const errText = await transferRes.text();
      return new Response(
        JSON.stringify({
          error: `Transfer failed with status ${transferRes.status}: ${errText || '(empty response body)'}`,
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