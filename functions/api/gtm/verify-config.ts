import { getGoogleAccessToken } from './_utils';
import { isValidGtmWorkspacePath } from '../_security';

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { containerPath, measurementId } = await request.json();

    if (!isValidGtmWorkspacePath(containerPath) || !measurementId) {
      return new Response(JSON.stringify({ error: 'Missing or invalid required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accessToken = await getGoogleAccessToken(env, request);
    const authHeader = `Bearer ${accessToken}`;
    
    // Fetch existing variables and tags from the container
    const [varsRes, tagsRes] = await Promise.all([
      fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/variables`, { headers: { 'Authorization': authHeader } }),
      fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/tags`, { headers: { 'Authorization': authHeader } })
    ]);
    
    let isConfigured = false;
    const cleanMeasurementId = measurementId.trim().toLowerCase();
    
    if (varsRes.ok) {
      const varsData: any = await varsRes.json();
      const existingVars = varsData.variable || [];
      for (const v of existingVars) {
        if (v.parameter) {
          // Check if ANY parameter in ANY variable equals the measurement ID
          const hasId = v.parameter.some((p: any) => p.value && p.value.trim().toLowerCase() === cleanMeasurementId);
          if (hasId) {
            isConfigured = true;
            break;
          }
        }
      }
    }

    if (!isConfigured && tagsRes.ok) {
      const tagsData: any = await tagsRes.json();
      const existingTags = tagsData.tag || [];
      
      for (const t of existingTags) {
        // Broaden the check to gaawc (Google Tag) and gaawe (Event tags that might have overridden it)
        if (t.type === 'gaawc' || t.type === 'gaawe') {
          if (t.parameter) {
            // Check if ANY parameter in the tag equals the measurement ID
            const hasId = t.parameter.some((p: any) => p.value && p.value.trim().toLowerCase() === cleanMeasurementId);
            if (hasId) {
              isConfigured = true;
              break;
            }
          }
        }
      }
    }

    const responsePayload: any = { isConfigured };
    if (!isConfigured) {
      responsePayload.debugApiStatus = {
        varsStatus: varsRes.status,
        tagsStatus: tagsRes.status,
        varsOk: varsRes.ok,
        tagsOk: tagsRes.ok,
      };
    }

    return new Response(JSON.stringify(responsePayload), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error("Internal Server Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
