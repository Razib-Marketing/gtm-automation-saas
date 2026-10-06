var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/auth/google/callback.ts
async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("No authorization code provided", { status: 400 });
  }
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange token: ${JSON.stringify(tokenData)}`);
    }
    const { access_token, refresh_token, expires_in } = tokenData;
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const profileData = await profileResponse.json();
    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch profile: ${JSON.stringify(profileData)}`);
    }
    const clerkUserId = url.searchParams.get("state") || "unknown";
    const connectionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expires_in * 1e3).toISOString();
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO users (id, email, name, subscription_tier) 
        VALUES (?, ?, ?, 'free')
        ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name
      `).bind(clerkUserId, profileData.email, profileData.name),
      env.DB.prepare(`
        INSERT INTO gtm_connections (id, user_id, account_id, container_id, encrypted_refresh_token, token_expires_at)
        VALUES (?, ?, 'pending', 'pending', ?, ?)
      `).bind(connectionId, clerkUserId, refresh_token || "no_refresh_token_provided", expiresAt)
    ]);
    return Response.redirect(`${url.origin}/dashboard?auth=success`, 302);
  } catch (error) {
    return new Response(`Authentication Error: ${error.message}`, { status: 500 });
  }
}
__name(onRequest, "onRequest");

// api/auth/google/login.ts
async function onRequest2(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const scope = "https://www.googleapis.com/auth/tagmanager.edit.containers https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
  const clerkUserId = url.searchParams.get("clerkUserId") || "unknown";
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", clerkUserId);
  return Response.redirect(authUrl.toString(), 302);
}
__name(onRequest2, "onRequest");

// api/gtm/_utils.ts
async function getGoogleAccessToken(env, request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing Clerk Authorization header");
  }
  const token = authHeader.split(" ")[1];
  let clerkUserId = null;
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadString = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadString);
    clerkUserId = payload.sub;
  } catch (e) {
    throw new Error("Invalid Clerk token");
  }
  if (!clerkUserId) {
    throw new Error("Could not extract user ID from token");
  }
  const dbResult = await env.DB.prepare(`
    SELECT encrypted_refresh_token 
    FROM gtm_connections 
    WHERE user_id = ? 
    ORDER BY id DESC LIMIT 1
  `).bind(clerkUserId).first();
  if (!dbResult || !dbResult.encrypted_refresh_token) {
    throw new Error("Google OAuth connection not found for user");
  }
  const refreshToken = dbResult.encrypted_refresh_token;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(`Failed to refresh Google token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}
__name(getGoogleAccessToken, "getGoogleAccessToken");

// api/gtm/accounts.ts
async function onRequest3(context) {
  const { env, request } = context;
  try {
    const accessToken = await getGoogleAccessToken(env, request);
    const response = await fetch("https://tagmanager.googleapis.com/tagmanager/v2/accounts", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(onRequest3, "onRequest");

// api/gtm/audit.ts
async function onRequest4(context) {
  const { env, request } = context;
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  try {
    const url = new URL(request.url);
    const containerPath = url.searchParams.get("containerPath");
    if (!containerPath) {
      return new Response(JSON.stringify({ error: "Missing containerPath" }), { status: 400 });
    }
    const accessToken = await getGoogleAccessToken(env, request);
    const tagsRes = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/tags`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const triggersRes = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/triggers`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const tagsData = await tagsRes.json();
    const triggersData = await triggersRes.json();
    if (!tagsRes.ok) {
      return new Response(JSON.stringify({ error: tagsData.error?.message || "Failed to fetch tags" }), { status: 500 });
    }
    return new Response(JSON.stringify({
      tags: tagsData.tag || [],
      triggers: triggersData.trigger || []
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
__name(onRequest4, "onRequest");

// api/gtm/containers.ts
async function onRequest5(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId");
  if (!accountId) {
    return new Response(JSON.stringify({ error: "accountId is required" }), { status: 400 });
  }
  try {
    const accessToken = await getGoogleAccessToken(env, request);
    const response = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(onRequest5, "onRequest");

// api/gtm/deploy-item.ts
async function onRequest6(context) {
  const { env, request } = context;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  try {
    const { type, containerPath, payload } = await request.json();
    if (!type || !containerPath || !payload) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const accessToken = await getGoogleAccessToken(env, request);
    const apiHeaders = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" };
    let url = "";
    if (type === "variable") url = `https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/variables`;
    else if (type === "trigger") url = `https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/triggers`;
    else if (type === "tag") url = `https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/tags`;
    else return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });
    const res = await fetch(url, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.error?.message?.includes("already exists")) {
        return new Response(JSON.stringify({ success: true, message: "Already exists", data }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: data.error?.message || "Deploy failed", details: data }), { status: res.status, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Internal Server Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(onRequest6, "onRequest");

// api/gtm/templates/safara.ts
var template = {
  "variables": [
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "8",
      "name": "Safara - GA4 Measurement ID - G-LNJ4X33X5P",
      "type": "c",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "value",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1750952823766",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "9",
      "name": "Safara - DLV - rate_name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "rate_name"
        }
      ],
      "fingerprint": "1750952802157",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "11",
      "name": "Safara - DLV - payment_type",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "payment_type"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "12",
      "name": "Safara - DLV - room_name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "room_name"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "13",
      "name": "Safara - DLV - transactionId",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "transactionId"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "14",
      "name": "Safara - DLV - display_type",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "display_type"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "15",
      "name": "Safara - DLV - transactionTax",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "transactionTax"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "16",
      "name": "Safara - DLV - hotelId",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "hotelId"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "17",
      "name": "Safara - DLV - transactionProducts",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "transactionProducts"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "18",
      "name": "Safara - DLV - subtotal",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "subtotal"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "19",
      "name": "Safara - DLV - lead_time",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "lead_time"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "20",
      "name": "Safara - DLV - transaction_date",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "created_at"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "21",
      "name": "Safara - DLV - checkout_date",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "checkout_date"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "22",
      "name": "Safara - DLV - room_nights",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "transactionProducts.0.quantity"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "23",
      "name": "Safara - DLV - checkin_date",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "checkin_date"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "24",
      "name": "Safara - DLV - guest_count",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "guest_count"
        }
      ],
      "fingerprint": "1750952802158",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "27",
      "name": "Safara - DLV - price",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "price"
        }
      ],
      "fingerprint": "1750952802159",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "28",
      "name": "Safara - DLV - room_id",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "room_id"
        }
      ],
      "fingerprint": "1750952802159",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "29",
      "name": "Safara - DLV - room_count",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "room_count"
        }
      ],
      "fingerprint": "1750952802232",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "30",
      "name": "Safara - DLV - gtm.elementId",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "gtm.elementId"
        }
      ],
      "fingerprint": "1750952802232",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "32",
      "name": "Safara - DLV - coupon_code",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "coupon_code"
        }
      ],
      "fingerprint": "1750952802232",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "37",
      "name": "Safara - DLV - booking_engine",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "booking_engine"
        }
      ],
      "fingerprint": "1750952802233",
      "parentFolderId": "7",
      "formatValue": {}
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "variableId": "39",
      "name": "Safara - DLV - items",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "items"
        }
      ],
      "fingerprint": "1750952802233",
      "parentFolderId": "7",
      "formatValue": {}
    }
  ],
  "triggers": [
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "triggerId": "10",
      "name": "Safara - Reservation Completed",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "Reservation Completed"
            }
          ]
        }
      ],
      "fingerprint": "1750952802157",
      "parentFolderId": "7"
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "triggerId": "26",
      "name": "Safara Events",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "Open Booking Engine|Select Check In Date|Select Check Out Date|Submit Search Form|Select Room Details|Select Room Rate|Book Room|Reservation Completed"
            }
          ]
        }
      ],
      "fingerprint": "1750952995227",
      "parentFolderId": "7"
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "triggerId": "31",
      "name": "Safara - Guest Detail Start Click",
      "type": "CLICK",
      "filter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Safara - DLV - gtm.elementId}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "firstname-"
            },
            {
              "type": "BOOLEAN",
              "key": "ignore_case",
              "value": "true"
            }
          ]
        }
      ],
      "fingerprint": "1750952802232",
      "parentFolderId": "7"
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "triggerId": "38",
      "name": "Safara - Add to Cart",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "add_to_cart"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Safara - DLV - booking_engine}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "safara"
            },
            {
              "type": "BOOLEAN",
              "key": "ignore_case",
              "value": "true"
            }
          ]
        }
      ],
      "fingerprint": "1750952802233",
      "parentFolderId": "7"
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "triggerId": "41",
      "name": "Safara - Submit Guest Details",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "Submit Guest Details"
            }
          ]
        }
      ],
      "fingerprint": "1750952802233",
      "parentFolderId": "7"
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "triggerId": "44",
      "name": "Safara - Book Room",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "Book Room"
            }
          ]
        }
      ],
      "fingerprint": "1750952802233",
      "parentFolderId": "7"
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "triggerId": "52",
      "name": "Safara - Open Booking Engine",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "Open Booking Engine"
            }
          ]
        }
      ],
      "fingerprint": "1750952802234",
      "parentFolderId": "7"
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "triggerId": "53",
      "name": "Safara - Begin Checkout",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "begin_checkout"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Safara - DLV - booking_engine}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "safara"
            },
            {
              "type": "BOOLEAN",
              "key": "ignore_case",
              "value": "true"
            }
          ]
        }
      ],
      "fingerprint": "1750952802234",
      "parentFolderId": "7"
    }
  ],
  "tags": [
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "tagId": "25",
      "name": "GA4 - Event - Safara - Purchase",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - transactionProducts}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "transaction_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - transactionId}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "USD"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - subtotal}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "tax"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - transactionTax}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "checkin_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - checkin_date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "checkout_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - checkout_date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "transaction_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - transaction_date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "lead_time"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - lead_time}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "booking_engine"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "safara"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "from_safara"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "true"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "room_nights"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - room_nights}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "display_type"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - display_type}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "room_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - room_name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "rate_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - rate_name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - hotelId}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_count"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - guest_count}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "payment_type"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - payment_type}}"
                }
              ]
            }
          ]
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "purchase"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1779451845233",
      "firingTriggerId": [
        "10"
      ],
      "parentFolderId": "7",
      "tagFiringOption": "ONCE_PER_EVENT",
      "paused": true,
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "tagId": "33",
      "name": "cHTML - dL Push Event - Safara - Start Add. Guest Details",
      "type": "html",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "html",
          "value": "<script>\nwindow.dataLayer = window.dataLayer || [];\nwindow.dataLayer.push({\n  event: 'Start Add. Guest Details',\n  booking_engine: 'Safara',\n  currency: 'USD',\n  value: {{Safara - DLV - price}},\n  coupon: '{{Safara - DLV - coupon_code}}',\n  hotel_id: '{{Safara - DLV - hotelId}}',\n  items: [\n      {\n        item_id: '{{Safara - DLV - room_id}}', \n        item_name: '{{Safara - DLV - room_name}}',\n        item_category: '{{Safara - DLV - rate_name}}',\n        quantity: {{Safara - DLV - room_count}},\n        price: {{Safara - DLV - price}}\n      }\n    ]\n});\n<\/script>"
        },
        {
          "type": "BOOLEAN",
          "key": "supportDocumentWrite",
          "value": "false"
        }
      ],
      "fingerprint": "1779451845286",
      "firingTriggerId": [
        "31"
      ],
      "parentFolderId": "7",
      "tagFiringOption": "ONCE_PER_LOAD",
      "paused": true,
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "tagId": "40",
      "name": "GA4 - Event - Safara - Add to Cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - price}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "USD"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "booking_engine"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "safara"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - hotelId}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "display_type"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - display_type}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "from_safara"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "true"
                }
              ]
            }
          ]
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "add_to_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1779451845236",
      "firingTriggerId": [
        "38"
      ],
      "parentFolderId": "7",
      "tagFiringOption": "ONCE_PER_EVENT",
      "paused": true,
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "tagId": "42",
      "name": "cHTML - dL Push Event - Safara - Begin Checkout",
      "type": "html",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "html",
          "value": "<script>\nwindow.dataLayer = window.dataLayer || [];\nwindow.dataLayer.push({\n  event: 'begin_checkout',\n  booking_engine: 'Safara',\n  currency: 'USD',\n  value: {{Safara - DLV - price}},\n  coupon: '{{Safara - DLV - coupon_code}}',\n  hotel_id: '{{Safara - DLV - hotelId}}',\n  items: [\n      {\n        item_id: '{{Safara - DLV - room_id}}', \n        item_name: '{{Safara - DLV - room_name}}',\n        item_category: '{{Safara - DLV - rate_name}}',\n        quantity: {{Safara - DLV - room_count}},\n        price: {{Safara - DLV - price}}\n      }\n    ]\n});\n<\/script>"
        },
        {
          "type": "BOOLEAN",
          "key": "supportDocumentWrite",
          "value": "false"
        }
      ],
      "fingerprint": "1779451845287",
      "firingTriggerId": [
        "41"
      ],
      "parentFolderId": "7",
      "tagFiringOption": "ONCE_PER_EVENT",
      "paused": true,
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "tagId": "43",
      "name": "GA4 - Event - Safara - BE Events",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "booking_engine"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "safara"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "display_type"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - display_type}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "event_action"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Event}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "from_safara"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "true"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - hotelId}}"
                }
              ]
            }
          ]
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "be_event"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1779451845235",
      "firingTriggerId": [
        "26"
      ],
      "parentFolderId": "7",
      "tagFiringOption": "ONCE_PER_EVENT",
      "paused": true,
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "tagId": "47",
      "name": "cHTML - dL Push Event - Safara - Add to Cart",
      "type": "html",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "html",
          "value": "<script>\nwindow.dataLayer = window.dataLayer || [];\nwindow.dataLayer.push({\n  event: 'add_to_cart',\n  booking_engine: 'Safara',\n  currency: 'USD',\n  value: {{Safara - DLV - price}},\n  coupon: '{{Safara - DLV - coupon_code}}',\n  hotel_id: '{{Safara - DLV - hotelId}}',\n  items: [\n      {\n        item_id: '{{Safara - DLV - room_id}}', \n        item_name: '{{Safara - DLV - room_name}}',\n        item_category: '{{Safara - DLV - rate_name}}',\n        quantity: {{Safara - DLV - room_count}},\n        price: {{Safara - DLV - price}}\n      }\n    ]\n});\n<\/script>"
        },
        {
          "type": "BOOLEAN",
          "key": "supportDocumentWrite",
          "value": "false"
        }
      ],
      "fingerprint": "1779451845287",
      "firingTriggerId": [
        "44"
      ],
      "parentFolderId": "7",
      "tagFiringOption": "ONCE_PER_EVENT",
      "paused": true,
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "tagId": "55",
      "name": "GA4 - Event - Safara - Booking Entrance",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "booking_engine"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "safara"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "from_safara"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "true"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "display_type"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - display_type}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - hotelId}}"
                }
              ]
            }
          ]
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "booking_entrance"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1779451845234",
      "firingTriggerId": [
        "52"
      ],
      "parentFolderId": "7",
      "tagFiringOption": "ONCE_PER_EVENT",
      "paused": true,
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6301140598",
      "containerId": "223375028",
      "tagId": "58",
      "name": "GA4 - Event - Safara - Begin Checkout",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - price}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "USD"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "booking_engine"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "safara"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - hotelId}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "display_type"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Safara - DLV - display_type}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "from_safara"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "true"
                }
              ]
            }
          ]
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "begin_checkout"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1779451845234",
      "firingTriggerId": [
        "53"
      ],
      "parentFolderId": "7",
      "tagFiringOption": "ONCE_PER_EVENT",
      "paused": true,
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    }
  ]
};

// api/gtm/templates/synxis.ts
var template2 = {
  "variables": [
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "2",
      "name": "Synxis View Name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ViewName"
        }
      ],
      "fingerprint": "1686773406758",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "3",
      "name": "Synxis Hotel ID",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "HOTEL_ID"
        }
      ],
      "fingerprint": "1686773406760",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "4",
      "name": "Booking Engine Step",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": `function(){
var hotel = {{Synxis Hotel ID}}
if(hotel==''){
  hotel = {{Synxis Chain ID}}
}
if ({{Synxis View Name}}){
  var viewName = {{Synxis View Name}}.toLowerCase()
}
else var viewName = "rooms"
var e = "sbe/"+hotel+"/booking-engine/"+viewName
if (viewName == "rates") {
  e = "sbe/"+hotel+"/booking-engine/rooms"
}
return e}`
        }
      ],
      "fingerprint": "1686773406770",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "5",
      "name": "url",
      "type": "u",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "component",
          "value": "URL"
        }
      ],
      "fingerprint": "1686773406768"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "9",
      "name": "AdultQty",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "AdultQty"
        }
      ],
      "fingerprint": "1686773406764",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "13",
      "name": "ArrivalDt",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ArrivalDt"
        }
      ],
      "fingerprint": "1686773406766",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "21",
      "name": "ChildQty",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ChildQty"
        }
      ],
      "fingerprint": "1686773406765",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "25",
      "name": "CurrCode",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "CurrCode"
        }
      ],
      "fingerprint": "1686773406775",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "30",
      "name": "DepartDt",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "DepartDt"
        }
      ],
      "fingerprint": "1686773406766",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "41",
      "name": "GuestQty",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "GuestQty"
        }
      ],
      "fingerprint": "1686773406767",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "46",
      "name": "ItineraryNo",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ItineraryNo"
        }
      ],
      "fingerprint": "1686773406759",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "51",
      "name": "NightsQty",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "NightsQty"
        }
      ],
      "fingerprint": "1686773406765",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "55",
      "name": "PromoCode",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "PromoCode"
        }
      ],
      "fingerprint": "1686773406764",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "74",
      "name": "Synxis - Chain Name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ChainNm"
        }
      ],
      "fingerprint": "1686773406765",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "76",
      "name": "Synxis Chain ID",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "CHAIN_ID"
        }
      ],
      "fingerprint": "1686773406762",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "79",
      "name": "Synxis Hotel Name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "HName"
        }
      ],
      "fingerprint": "1686773406767",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "144",
      "name": "GA4 Measurement ID",
      "type": "c",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "value",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773424588",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "148",
      "name": "Coupon Code",
      "type": "u",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "component",
          "value": "QUERY"
        },
        {
          "type": "TEMPLATE",
          "key": "queryKey",
          "value": "coupon"
        }
      ],
      "fingerprint": "1686773406591",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "149",
      "name": "Retail Product Attribute Filter Groups",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "retailFilterAttributeGroups"
        }
      ],
      "fingerprint": "1686773406591",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "150",
      "name": "Retail Product Attribute Filter Names",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "retailFilterAttributeNames"
        }
      ],
      "fingerprint": "1686773406591",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "152",
      "name": "Retail Product Attribute Filter Codes",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "retailFilterAttributeCodes"
        }
      ],
      "fingerprint": "1686773406592",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "153",
      "name": "SBE Config Code",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ConfigCode"
        }
      ],
      "fingerprint": "1686773406592",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "154",
      "name": "SBE Theme Code",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ThemeCode"
        }
      ],
      "fingerprint": "1686773406592",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "155",
      "name": "GA4 - items",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.items"
        }
      ],
      "fingerprint": "1686773406592",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "162",
      "name": "GA4 - items array - boolean test",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n    var items = {{GA4 - items}};\n    return items.length ? true : false;\n}"
        }
      ],
      "fingerprint": "1686773406690",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "172",
      "name": "DLV Event",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "Event"
        }
      ],
      "fingerprint": "1686773406597",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "174",
      "name": "GA4 purchase adult qty",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "rpAdultQty"
        }
      ],
      "fingerprint": "1686773406597",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "175",
      "name": "GA4 promo code",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "rpPromoCode"
        }
      ],
      "fingerprint": "1686773406598",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "176",
      "name": "GA4 purchase guest qty",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "rpGuestQty"
        }
      ],
      "fingerprint": "1686773406598",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "177",
      "name": "GA4 purchase child qty",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "rpChildQty"
        }
      ],
      "fingerprint": "1686773406598",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "178",
      "name": "GA4 transaction currency",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.currency"
        }
      ],
      "fingerprint": "1686773406599",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "179",
      "name": "SBE - Hotel City",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "Hotel.City"
        }
      ],
      "fingerprint": "1686773406599",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "180",
      "name": "GA4 transaction tax",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.tax"
        }
      ],
      "fingerprint": "1686773406599",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "181",
      "name": "GA4 purchase depart date",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "rpDepartDt"
        }
      ],
      "fingerprint": "1686773406599",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "182",
      "name": "GA4 purchase rate code",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.items.item_category_2"
        }
      ],
      "fingerprint": "1686773406600",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "183",
      "name": "GA4 purchase book date",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "rpBookDt"
        }
      ],
      "fingerprint": "1686773406600",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "184",
      "name": "GA4 transaction value",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.value"
        }
      ],
      "fingerprint": "1686773406600",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "185",
      "name": "SBE - Hotel Region",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "Hotel.Region"
        }
      ],
      "fingerprint": "1686773406601",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "186",
      "name": "GA4 purchase room code",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.items.item_id"
        }
      ],
      "fingerprint": "1686773406601",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "188",
      "name": "GA4 purchase arrival date",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "rpArrivalDt"
        }
      ],
      "fingerprint": "1686773406602",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "189",
      "name": "SBE - Hotel Country",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "Hotel.Country"
        }
      ],
      "fingerprint": "1686773406602",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "190",
      "name": "GA4 purchase room name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.items.item_name"
        }
      ],
      "fingerprint": "1686773406602",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "191",
      "name": "GA4 purchase group code",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "rpGroupCode"
        }
      ],
      "fingerprint": "1686773406602",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "192",
      "name": "GA4 purchase rate name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.items.item_category"
        }
      ],
      "fingerprint": "1686773406603",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "193",
      "name": "GA4 purchase confirmation number",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.transaction_id"
        }
      ],
      "fingerprint": "1686773406680",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "195",
      "name": "Retail Product Filter Category",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "OfferCategory"
        }
      ],
      "fingerprint": "1686773406681",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "207",
      "name": "Retail Product Filter Search",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "FilterSearchUsed"
        }
      ],
      "fingerprint": "1686773406684",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "219",
      "name": "Available Rooms",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "AvailRooms"
        }
      ],
      "fingerprint": "1686773406688",
      "parentFolderId": "140",
      "formatValue": {}
    }
  ],
  "triggers": [
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "141",
      "name": "GA4 - Retail Offers - view_item_list",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "view_item_list"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Synxis View Name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "Offers"
            }
          ]
        }
      ],
      "fingerprint": "1686773406589",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "151",
      "name": "GA4 - Retail Offers - attribute filter",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "retailproduct_attribute_filter"
            }
          ]
        }
      ],
      "fingerprint": "1686773406591",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "158",
      "name": "GA4 - Retail Offers - select_item",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "select_item"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Page Path}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "addons"
            }
          ]
        }
      ],
      "fingerprint": "1686773406593",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "163",
      "name": "GA4 remove_from_cart",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "remove_from_cart"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "true"
            }
          ]
        }
      ],
      "fingerprint": "1686773406594",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "166",
      "name": "GA4 - Retail Offers - category filter",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "retailproducts.filterevent.category"
            }
          ]
        }
      ],
      "fingerprint": "1686773406595",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "167",
      "name": "GA4 - Retail Offers - view_item",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "view_item"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Page Path}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "addons"
            }
          ]
        }
      ],
      "fingerprint": "1686773406595",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "170",
      "name": "GA4 Rooms add_to_cart",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "add_to_cart"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Booking Engine Step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "rooms"
            }
          ]
        }
      ],
      "fingerprint": "1686773406596",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "173",
      "name": "GA4 - Retail Offers - add_to_cart",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "add_to_cart"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{DLV Event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "retailProducts"
            }
          ]
        }
      ],
      "fingerprint": "1686773406597",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "187",
      "name": "GA4 purchase",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "roomPurchase"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "true"
            }
          ]
        }
      ],
      "fingerprint": "1686773406601",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "197",
      "name": "GA4 View Item Rooms",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "view_item"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Booking Engine Step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "rooms"
            }
          ]
        },
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^true$"
            }
          ]
        }
      ],
      "fingerprint": "1686773406682",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "199",
      "name": "GA4 - Addons view_item_list",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "view_item_list"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Synxis View Name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": ".*Add\\-ons.*"
            }
          ]
        },
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^true$"
            }
          ]
        }
      ],
      "fingerprint": "1686773406682",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "202",
      "name": "GA4 Addons add_to_cart",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "add_to_cart"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Synxis View Name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": ".*Add\\-ons.*"
            }
          ]
        },
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^true$"
            }
          ]
        }
      ],
      "fingerprint": "1686773406683",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "204",
      "name": "GA4 begin_checkout",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "begin_checkout"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "true"
            }
          ]
        }
      ],
      "fingerprint": "1686773406684",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "208",
      "name": "GA4 - Retail Offers - search filter",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "retailproducts.filterevent.search"
            }
          ]
        }
      ],
      "fingerprint": "1686773406685",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "220",
      "name": "GA4 - Rooms view_item_list",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "view_item_list"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Booking Engine Step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "rooms"
            }
          ]
        },
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^true$"
            }
          ]
        }
      ],
      "fingerprint": "1686773406688",
      "parentFolderId": "140"
    }
  ],
  "tags": [
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "156",
      "name": "GA4 Retail Products attribute filter",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_attribute_groups"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Attribute Filter Groups}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_attribute_names"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Attribute Filter Names}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_attribute_codes"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Attribute Filter Codes}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "retail_product_filter_attribute"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406593",
      "firingTriggerId": [
        "151"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "159",
      "name": "GA4 Retail Products select_item",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "select_item"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406593",
      "firingTriggerId": [
        "158"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "168",
      "name": "GA4 Retail Products view_item",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406596",
      "firingTriggerId": [
        "167"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "171",
      "name": "GA4 Rooms add_to_cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "add_to_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406596",
      "firingTriggerId": [
        "170"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "194",
      "name": "GA4 Purchase",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "transaction_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase confirmation number}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "affiliation"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "Synxis Booking Engine"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 transaction value}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "tax"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 transaction tax}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 transaction currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 promo code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "group_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase group code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase guest qty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase adult qty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase child qty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "room_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase room name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "room_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase room code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "rate_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase rate name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "rate_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase rate code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase arrival date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase depart date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "book_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase book date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "itinerary_number"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ItineraryNo}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_city"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE - Hotel City}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_region"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE - Hotel Region}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_country"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE - Hotel Country}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "purchase_full_url"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{url}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "purchase"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406681",
      "firingTriggerId": [
        "187"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "196",
      "name": "GA4 Retail Products category filter",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_search"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Filter Category}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "retail_product_filter_category"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406681",
      "firingTriggerId": [
        "166"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "198",
      "name": "GA4 Rooms view_item",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406682",
      "firingTriggerId": [
        "197"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "203",
      "name": "GA4 Addons add_to_cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "add_to_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406683",
      "firingTriggerId": [
        "202"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "205",
      "name": "GA4 remove_from_cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "remove_from_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406684",
      "firingTriggerId": [
        "163"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "209",
      "name": "GA4 Retail Products search filter",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_search"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Filter Search}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "retail_product_filter_search"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406685",
      "firingTriggerId": [
        "208"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "213",
      "name": "GA4 begin_checkout",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "begin_checkout"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406686",
      "firingTriggerId": [
        "204"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "215",
      "name": "GA4 Addons view_item_list",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "available_addons"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "place holder"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item_list"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406687",
      "firingTriggerId": [
        "199"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "217",
      "name": "GA4 Retail Products add_to_cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "add_to_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406687",
      "firingTriggerId": [
        "173"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "222",
      "name": "GA4 Rooms view_item_list",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "available_rooms"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Available Rooms}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item_list"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406688",
      "firingTriggerId": [
        "220"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "224",
      "name": "GA4 Retail Products view_item_list",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "available_rooms"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Available Rooms}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item_list"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406689",
      "firingTriggerId": [
        "141"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    }
  ]
};

// api/gtm/templates/ihotelier.ts
var template3 = {
  "variables": [
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "17",
      "name": "content-name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "content-name"
        }
      ],
      "fingerprint": "1553703890149",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "21",
      "name": "ihAmount",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihAmount"
        }
      ],
      "fingerprint": "1553703890152",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "22",
      "name": "ihTaxes",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihTaxes"
        }
      ],
      "fingerprint": "1553703890153",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "23",
      "name": "ihAmountAfterTax",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\nreturn parseFloat({{ihAmount}}) + parseFloat({{ihTaxes}});\n}\n"
        }
      ],
      "fingerprint": "1553703890154",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "24",
      "name": "ihAmountBeforeTax",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihAmountBeforeTax"
        }
      ],
      "fingerprint": "1553703890155",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "27",
      "name": "ihConfirmID",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihConfirmID"
        }
      ],
      "fingerprint": "1553703890157",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "28",
      "name": "ihCurrency",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihCurrency"
        }
      ],
      "fingerprint": "1553703890158",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "29",
      "name": "ihDate",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihDate"
        }
      ],
      "fingerprint": "1553703890159",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "30",
      "name": "ihDateOut",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihDateOut"
        }
      ],
      "fingerprint": "1553703890160",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "36",
      "name": "ihHotelID",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihHotelID"
        }
      ],
      "fingerprint": "1553703890168",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "37",
      "name": "ihHotelName",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihHotelName"
        }
      ],
      "fingerprint": "1553703890169",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "39",
      "name": "ihNights",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihNights"
        }
      ],
      "fingerprint": "1553703890170",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "41",
      "name": "ihRatePlanID",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihRatePlanID"
        }
      ],
      "fingerprint": "1553703890172",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "42",
      "name": "ihRatePlanName",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihRatePlanName"
        }
      ],
      "fingerprint": "1553703890173",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "44",
      "name": "ihRoomType",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihRoomType"
        }
      ],
      "fingerprint": "1553703890174",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "87",
      "name": "tc - dl - ecommerce.items",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.items"
        }
      ],
      "fingerprint": "1745008400699",
      "parentFolderId": "65",
      "formatValue": {}
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "93",
      "name": "GA4 - Code",
      "type": "c",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "value",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1745008400738",
      "formatValue": {}
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "114",
      "name": "view_item_room_type",
      "type": "d",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "elementSelector",
          "value": "h1.RoomDetail-title"
        },
        {
          "type": "TEMPLATE",
          "key": "attributeName",
          "value": "room_type"
        },
        {
          "type": "TEMPLATE",
          "key": "selectorType",
          "value": "CSS"
        }
      ],
      "fingerprint": "1745009670083",
      "formatValue": {
        "caseConversionType": "LOWERCASE"
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "115",
      "name": "item_view_price",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n  var el = document.querySelector(\n    'div.PricingBox-option-text-subTotal > b.rates.subtotal-rates > div'\n  );\n  if (el && el.textContent) {\n    var txt = el.textContent.replace(/\\s+/g, '');\n    return parseFloat(txt.replace('$', ''));\n  }\n  return null;\n}"
        }
      ],
      "fingerprint": "1745010612613",
      "formatValue": {}
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "117",
      "name": "item_variable",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n  try {\n    var gtmRatePlanIdVar = {{ihRatePlanID}};\n    var gtmRatePlanNameVar = {{ihRatePlanName}};\n    var gtmRoomTypeVar = {{ihRoomType}};\n    var gtmNightsVar = {{ihNights}};\n    var gtmAmountBeforeTaxVar = {{ihAmountBeforeTax}};\n    var itemId = gtmRatePlanIdVar || 'N/A';\n    var itemName = gtmRatePlanNameVar || 'N/A';\n    var itemCategory = gtmRoomTypeVar || 'N/A';\n\n    var quantity = parseInt(gtmNightsVar, 10);\n    if (isNaN(quantity) || quantity < 1) {\n      quantity = 1;\n    }\n    var totalValue = parseFloat(gtmAmountBeforeTaxVar);\n    if (isNaN(totalValue)) {\n      totalValue = 0;\n    }\n    var price = 0;\n    if (quantity > 0) {\n      price = parseFloat((totalValue / quantity).toFixed(2));\n    } else {\n      price = totalValue;\n    }\n     if (isNaN(price)) {\n        price = 0;\n     }\n    var item = {\n      item_id: String(itemId),\n      item_name: String(itemName),\n      item_category: String(itemCategory),\n      quantity: quantity\n    };\n\n    return [item];\n\n  } catch (e) {\n    return [];\n  }\n}"
        }
      ],
      "fingerprint": "1745011510962",
      "formatValue": {}
    }
  ],
  "triggers": [
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "12",
      "name": "Page View Event",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "content-view"
            }
          ]
        }
      ],
      "fingerprint": "1553703890135",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "69",
      "name": "Shopping Cart Total",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "content-view"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{content-name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "total|checkout"
            },
            {
              "type": "BOOLEAN",
              "key": "ignore_case",
              "value": "true"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{ihHotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "109342"
            }
          ]
        }
      ],
      "fingerprint": "1729112721888",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "94",
      "name": "GA4 - Rooms - Trigger",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Page Path}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "/rooms/"
            }
          ]
        }
      ],
      "fingerprint": "1745008400738"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "106",
      "name": "tc - trigger - ga4 event - purchase",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "ga4_purchase"
            }
          ]
        }
      ],
      "fingerprint": "1745008400739",
      "parentFolderId": "65"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "116",
      "name": "View Item V2",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "content-view"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{content-name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "accommodation/room"
            }
          ]
        }
      ],
      "fingerprint": "1745010787646"
    }
  ],
  "tags": [
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "1",
      "name": "Push eCommerce Data",
      "type": "html",
      "priority": {
        "type": "INTEGER",
        "value": "100"
      },
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "html",
          "value": "<script>\nif(window.multiRoomReservation != undefined){\n	dataLayer.push(function(){\n    var transactionProduct = [];\n    for(var i = 0; i < this.get('ihReservations').length; i ++){\n      var price = this.get('ihReservations')[i].ihAmount / this.get('ihReservations')[i].ihNights;\n      	transactionProduct.push({\n 		'sku': this.get('ihReservations')[i].ihConfirmID,\n 		'name': this.get('ihReservations')[i].ihRoomType,\n 		'category': this.get('ihReservations')[i].ihRatePlanName,\n 		'price': price,\n 		'quantity': this.get('ihReservations')[i].ihNights,\n 		})\n    }\n   \n  dataLayer.push({\n 	'transactionId':'{{ihHotelName}}'+' '+'{{ihConfirmID}}',\n   	'transactionTotal': {{ihAmount}},\n   	'transactionTax': {{ihTaxes}},\n 	'transactionProducts': transactionProduct\n	})\n  });\n}else{\ndataLayer.push({\n   'transactionId':'{{ihHotelName}}'+' '+'{{ihConfirmID}}',\n   'transactionTotal': {{ihAmount}},\n   'transactionTax': {{ihTaxes}},\n   'transactionProducts': [{\n       'sku': '{{ihConfirmID}}',\n       'name': '{{ihRoomType}}',\n       'category': '{{ihRatePlanName}}',\n       'price': {{ihAmount}}/{{ihNights}},\n       'quantity': {{ihNights}}\n   }]\n});\n\n}\n\n<\/script>"
        },
        {
          "type": "BOOLEAN",
          "key": "supportDocumentWrite",
          "value": "true"
        }
      ],
      "fingerprint": "1745012026068",
      "firingTriggerId": [
        "12"
      ],
      "parentFolderId": "5",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NEEDED",
        "consentType": {
          "type": "LIST",
          "list": [
            {
              "type": "TEMPLATE",
              "value": "security_storage"
            }
          ]
        }
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "95",
      "name": "GA4 - Rooms - Tag",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "rooms_click"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GA4 - Code}}"
        }
      ],
      "fingerprint": "1745011827837",
      "firingTriggerId": [
        "94"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_NEEDED"
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "107",
      "name": "BE- Purchase Tag",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "transaction_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihConfirmID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihAmountAfterTax}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihCurrency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "tax"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihTaxes}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{tc - dl - ecommerce.items}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "purchase"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GA4 - Code}}"
        }
      ],
      "fingerprint": "1745011802342",
      "firingTriggerId": [
        "106"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_NEEDED"
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "109",
      "name": "View Item",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{view_item_room_type}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "check_in_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihDate}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "check_out_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihDateOut}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "price"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{item_view_price}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GA4 - Code}}"
        }
      ],
      "fingerprint": "1745011863275",
      "firingTriggerId": [
        "116"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_NEEDED"
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "112",
      "name": "Begin Checkout",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihCurrency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihAmountBeforeTax}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{item_variable}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "check_in_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihDate}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "check_out_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihDateOut}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "begin_checkout"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GA4 - Code}}"
        }
      ],
      "fingerprint": "1745011815641",
      "firingTriggerId": [
        "69"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_NEEDED"
      }
    }
  ]
};

// api/gtm/templates/windsurfer.ts
var template4 = {
  "variables": [
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "46",
      "name": "WsVars.HotelID",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.HotelID"
        }
      ],
      "fingerprint": "1758303991058",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "49",
      "name": "be-step",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.Step"
        }
      ],
      "fingerprint": "1758303991058",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "52",
      "name": "ecommerce-taxes",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.Taxes"
        }
      ],
      "fingerprint": "1758303991058",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "54",
      "name": "be-view-class-on-body",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n  return document.body.className;\n}"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "59",
      "name": "js.WsVars",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "61",
      "name": "ecommerce-value",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.Amount"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "62",
      "name": "ecommerce-cart-items",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n  // Reference the main WsVars object\n  var wsVars = {{js.WsVars}};\n\n  // Check if CartItems exists and has items\n  if (!wsVars || !wsVars.CartItems || !wsVars.CartItems.length) {\n    return []; // Return an empty array if no items are found\n  }\n\n  // Use .map() to transform EACH item in the CartItems array\n  var items = wsVars.CartItems.map(function(item) {\n    // Calculate the price per night. Handle case where Nights might be 0.\n    var pricePerNight = (item.Nights > 0) ? (item.Amt / item.Nights) : 0;\n\n    return {\n      item_id: item.RmID,\n      item_name: item.RoomType,\n      item_category: item.RateType,\n      affiliation: wsVars.HotelName,\n      price: pricePerNight,\n      quantity: item.Nights,\n      coupon: item.Promo,          // ADDED: The promo code used for the item\n      discount: Math.abs(item.Disc) // ADDED: The discount amount as a positive number\n    };\n  });\n\n  return items;\n}"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "63",
      "name": "ecommerce-currency",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.Currency"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "64",
      "name": "check-out-date",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.YYYYMMDD2"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "65",
      "name": "Measurement ID",
      "type": "c",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "value",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304306815",
      "parentFolderId": "50",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "66",
      "name": "check-in-date",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.YYYYMMDD1"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "76",
      "name": "ecommerce-reservation-id",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.ResID"
        }
      ],
      "fingerprint": "1758303991060",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "77",
      "name": "ecommerce-coupon",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.CartItems[0].Promo"
        }
      ],
      "fingerprint": "1758303991060",
      "parentFolderId": "44",
      "formatValue": {}
    }
  ],
  "triggers": [
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "triggerId": "51",
      "name": "begin-checkout",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "4"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{WsVars.HotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "17099"
            }
          ]
        }
      ],
      "fingerprint": "1758304065899",
      "parentFolderId": "50"
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "triggerId": "60",
      "name": "add-to-cart",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "3"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{WsVars.HotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "17099"
            }
          ]
        }
      ],
      "fingerprint": "1758304042766",
      "parentFolderId": "50"
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "triggerId": "70",
      "name": "purchase",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{WsVars.HotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "17099"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "5"
            }
          ]
        }
      ],
      "fingerprint": "1758304159683",
      "parentFolderId": "50"
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "triggerId": "73",
      "name": "view-item",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "2"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-view-class-on-body}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "WsRoomView"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{WsVars.HotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "17099"
            }
          ]
        }
      ],
      "fingerprint": "1758304200790",
      "parentFolderId": "50"
    }
  ],
  "tags": [
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "tagId": "67",
      "name": "add-to-cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-value}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-cart-items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-in-date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category2"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-out-date}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "add_to_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304046130",
      "firingTriggerId": [
        "60"
      ],
      "parentFolderId": "50",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "tagId": "78",
      "name": "purchase",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-value}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "transaction_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-reservation-id}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-coupon}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "tax"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-taxes}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-cart-items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-in-date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category2"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-out-date}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "purchase"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304163453",
      "firingTriggerId": [
        "70"
      ],
      "parentFolderId": "50",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "tagId": "89",
      "name": "begin-checkout",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-value}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-coupon}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-cart-items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-in-date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category2"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-out-date}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "begin_checkout"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304071178",
      "firingTriggerId": [
        "51"
      ],
      "parentFolderId": "50",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "tagId": "96",
      "name": "view-item",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-value}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-cart-items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-in-date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category2"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-out-date}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304205256",
      "firingTriggerId": [
        "73"
      ],
      "parentFolderId": "50",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    }
  ]
};

// api/gtm/templates/mews.ts
var template5 = {
  "variables": [
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "variableId": "4",
      "name": "GA4 Pageview title",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "page_title"
        }
      ],
      "fingerprint": "1703134567603",
      "formatValue": {}
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "variableId": "5",
      "name": "GA4 Pageview location",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "page_location"
        }
      ],
      "fingerprint": "1703134621321",
      "formatValue": {}
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "variableId": "9",
      "name": "GA4 Event Name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "eventName"
        }
      ],
      "fingerprint": "1704312282233",
      "formatValue": {}
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "variableId": "16",
      "name": "Ecommerce Object",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce"
        }
      ],
      "fingerprint": "1705618177394",
      "formatValue": {}
    }
  ],
  "triggers": [
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "3",
      "name": "All Mews GA4 Events",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^ga4"
            }
          ]
        }
      ],
      "fingerprint": "1713301576639"
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "10",
      "name": "All Mews GA4 E-Commerce Events",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^view_item|^view_item_list|^select_promotion|^add_to_cart|^remove_from_cart|^begin_checkout|^add_payment_info|^purchase"
            }
          ]
        }
      ],
      "fingerprint": "1713301612123"
    }
  ],
  "tags": [
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "6",
      "name": "Mews GA4",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "userProperties",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "name",
                  "value": "page_title"
                },
                {
                  "type": "TEMPLATE",
                  "key": "value",
                  "value": "{{GA4 Pageview title}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "name",
                  "value": "page_location"
                },
                {
                  "type": "TEMPLATE",
                  "key": "value",
                  "value": "{{GA4 Pageview location}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "{{GA4 Event Name}}"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1713301558101",
      "firingTriggerId": [
        "3"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "11",
      "name": "Mews GA4 E-Commerce",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "ecommerceMacroData",
          "value": "{{Ecommerce Object}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "customObject"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "{{Event}}"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1713301545910",
      "firingTriggerId": [
        "10"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    }
  ]
};

// api/gtm/templates/basic.ts
var template6 = {
  "variables": [
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "variableId": "3",
      "name": "GTAG",
      "type": "c",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "value",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1745071430584",
      "formatValue": {}
    }
  ],
  "triggers": [
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "triggerId": "4",
      "name": "facebook_click",
      "type": "LINK_CLICK",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Click URL}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "facebook.com"
            }
          ]
        }
      ],
      "waitForTags": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "checkValidation": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "waitForTagsTimeout": {
        "type": "TEMPLATE",
        "value": "2000"
      },
      "uniqueTriggerId": {
        "type": "TEMPLATE"
      },
      "fingerprint": "1745071376620"
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "triggerId": "10",
      "name": "phone_click",
      "type": "LINK_CLICK",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Click URL}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "tel:"
            }
          ]
        }
      ],
      "waitForTags": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "checkValidation": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "waitForTagsTimeout": {
        "type": "TEMPLATE",
        "value": "2000"
      },
      "uniqueTriggerId": {
        "type": "TEMPLATE"
      },
      "fingerprint": "1745071376621"
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "triggerId": "11",
      "name": "instagram_click",
      "type": "LINK_CLICK",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Click URL}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "instagram.com"
            }
          ]
        }
      ],
      "waitForTags": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "checkValidation": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "waitForTagsTimeout": {
        "type": "TEMPLATE",
        "value": "2000"
      },
      "uniqueTriggerId": {
        "type": "TEMPLATE"
      },
      "fingerprint": "1745071376621"
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "triggerId": "15",
      "name": "direction_click",
      "type": "LINK_CLICK",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Click URL}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "maps"
            }
          ]
        }
      ],
      "waitForTags": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "checkValidation": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "waitForTagsTimeout": {
        "type": "TEMPLATE",
        "value": "2000"
      },
      "uniqueTriggerId": {
        "type": "TEMPLATE"
      },
      "fingerprint": "1745072013829"
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "triggerId": "17",
      "name": "gmb_click",
      "type": "LINK_CLICK",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Click URL}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "https://g.co/kgs/"
            }
          ]
        }
      ],
      "waitForTags": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "checkValidation": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "waitForTagsTimeout": {
        "type": "TEMPLATE",
        "value": "2000"
      },
      "uniqueTriggerId": {
        "type": "TEMPLATE"
      },
      "fingerprint": "1745071831813"
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "triggerId": "19",
      "name": "email_click",
      "type": "LINK_CLICK",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Click URL}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "mailto:"
            }
          ]
        }
      ],
      "waitForTags": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "checkValidation": {
        "type": "BOOLEAN",
        "value": "false"
      },
      "waitForTagsTimeout": {
        "type": "TEMPLATE",
        "value": "2000"
      },
      "uniqueTriggerId": {
        "type": "TEMPLATE"
      },
      "fingerprint": "1745072503232"
    }
  ],
  "tags": [
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "tagId": "5",
      "name": "facebook_click",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_text"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click Text}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_url"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click URL}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "facebook_click"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GTAG}}"
        }
      ],
      "fingerprint": "1745071376620",
      "firingTriggerId": [
        "4"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "tagId": "12",
      "name": "instagram_click",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_text"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click Text}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_url"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click URL}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "instagram_click"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GTAG}}"
        }
      ],
      "fingerprint": "1745071376621",
      "firingTriggerId": [
        "11"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "tagId": "13",
      "name": "phone_click",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_text"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click Text}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_url"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click URL}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "phone_click"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GTAG}}"
        }
      ],
      "fingerprint": "1745071376621",
      "firingTriggerId": [
        "10"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "tagId": "16",
      "name": "direction_click",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_text"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click Text}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_url"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click URL}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "direction_click"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GTAG}}"
        }
      ],
      "fingerprint": "1745071881396",
      "firingTriggerId": [
        "15"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "tagId": "18",
      "name": "gmb_click",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_text"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click Text}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_url"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click URL}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "gmb_click"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GTAG}}"
        }
      ],
      "fingerprint": "1745071910447",
      "firingTriggerId": [
        "17"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6291655960",
      "containerId": "218102451",
      "tagId": "20",
      "name": "email_click",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_url"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click URL}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "click_text"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Click Text}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "email_click"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GTAG}}"
        }
      ],
      "fingerprint": "1745072539503",
      "firingTriggerId": [
        "19"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    }
  ]
};

// api/gtm/generate.ts
function getModulePayloads(moduleId, measurementId) {
  let template7 = { variables: [], triggers: [], tags: [] };
  let baseTemplate = null;
  if (moduleId === "hotel_safara") baseTemplate = template;
  else if (moduleId === "hotel_synxis") baseTemplate = template2;
  else if (moduleId === "hotel_ihotelier") baseTemplate = template3;
  else if (moduleId === "hotel_windsurfers") baseTemplate = template4;
  else if (moduleId === "hotel_mews") baseTemplate = template5;
  else if (moduleId === "basic_tracking") baseTemplate = template6;
  if (baseTemplate) {
    template7 = JSON.parse(JSON.stringify(baseTemplate));
  } else {
    let triggerPayload;
    let eventName = "custom_event";
    if (moduleId === "social_media") {
      triggerPayload = { name: `[Auto] Social & Contact Clicks`, type: "linkClick", filter: [{ type: "matchRegex", parameter: [{ type: "template", key: "arg0", value: "{{Click URL}}" }, { type: "template", key: "arg1", value: "mailto:|tel:|facebook\\\\.com|linkedin\\\\.com|instagram\\\\.com|twitter\\\\.com|x\\\\.com" }] }] };
      eventName = "social_contact_click";
    } else if (moduleId === "scroll_depth") {
      triggerPayload = { name: `[Auto] Advanced Scroll Depth`, type: "scrollDepth", parameter: [{ type: "template", key: "verticalThresholds", value: "25,50,75,90" }, { type: "boolean", key: "verticalThresholdsUnits", value: "PERCENT" }] };
      eventName = "scroll";
    } else if (moduleId === "video_engagement") {
      triggerPayload = { name: `[Auto] YouTube Video Engagement`, type: "youTubeVideo", parameter: [{ type: "boolean", key: "captureStart", value: "true" }, { type: "boolean", key: "captureComplete", value: "true" }, { type: "boolean", key: "capturePause", value: "true" }, { type: "boolean", key: "captureProgress", value: "true" }, { type: "template", key: "progressThresholds", value: "25,50,75" }] };
      eventName = "video_engagement";
    } else if (moduleId.endsWith("_entrance")) {
      let urlContains = "bookingengine.com";
      if (moduleId === "hotel_safara_entrance") urlContains = "safara.com";
      else if (moduleId === "hotel_synxis_entrance") urlContains = "synxis.com";
      else if (moduleId === "hotel_stayntouch_entrance") urlContains = "stayntouch.com";
      else if (moduleId === "hotel_windsurfers_entrance") urlContains = "windsurfercrs.com";
      else if (moduleId === "hotel_mews_entrance") urlContains = "mews.li";
      else if (moduleId === "hotel_ihotelier_entrance") urlContains = "ihotelier.com";
      triggerPayload = { name: `[Auto] Booking Entrance (${urlContains})`, type: "linkClick", filter: [{ type: "contains", parameter: [{ type: "template", key: "arg0", value: "{{Click URL}}" }, { type: "template", key: "arg1", value: urlContains }] }] };
      eventName = "booking_entrance";
    } else if (moduleId === "form_elementor") {
      triggerPayload = { name: `[Auto] Elementor Form Submit`, type: "formSubmission", filter: [{ type: "contains", parameter: [{ type: "template", key: "arg0", value: "{{Form Classes}}" }, { type: "template", key: "arg1", value: "elementor" }] }] };
      eventName = "generate_lead_elementor";
    } else if (moduleId === "form_gravity") {
      triggerPayload = { name: `[Auto] Gravity Form Submit`, type: "formSubmission", filter: [{ type: "contains", parameter: [{ type: "template", key: "arg0", value: "{{Form ID}}" }, { type: "template", key: "arg1", value: "gform" }] }] };
      eventName = "generate_lead_gravity";
    } else if (moduleId === "form_hubspot") {
      triggerPayload = { name: `[Auto] HubSpot Form Submit`, type: "formSubmission", filter: [{ type: "contains", parameter: [{ type: "template", key: "arg0", value: "{{Form Classes}}" }, { type: "template", key: "arg1", value: "hs-form" }] }] };
      eventName = "generate_lead_hubspot";
    } else if (moduleId === "form_salesforce") {
      triggerPayload = { name: `[Auto] Salesforce Form Submit`, type: "formSubmission", filter: [{ type: "contains", parameter: [{ type: "template", key: "arg0", value: "{{Form Element}}" }, { type: "template", key: "arg1", value: "salesforce" }] }] };
      eventName = "generate_lead_salesforce";
    } else if (moduleId === "form_revinate") {
      triggerPayload = { name: `[Auto] Revinate Form Submit`, type: "formSubmission", filter: [{ type: "contains", parameter: [{ type: "template", key: "arg0", value: "{{Form Element}}" }, { type: "template", key: "arg1", value: "revinate" }] }] };
      eventName = "generate_lead_revinate";
    } else if (moduleId === "form_generic") {
      triggerPayload = { name: `[Auto] Generic Form Submit`, type: "formSubmission" };
      eventName = "generate_lead";
    } else {
      return null;
    }
    triggerPayload.triggerId = "dummy_trigger_1";
    template7.triggers.push(triggerPayload);
    template7.tags.push({
      name: `[Auto Tag] GA4 - ${eventName}`,
      type: "gaawe",
      parameter: [
        { type: "template", key: "measurementIdOverride", value: "{{MEASUREMENT_ID_OVERRIDE}}" },
        { type: "template", key: "eventName", value: eventName }
      ],
      firingTriggerId: ["dummy_trigger_1"]
    });
  }
  let str = JSON.stringify(template7);
  str = str.replace(/\{\{MEASUREMENT_ID_OVERRIDE\}\}/g, measurementId);
  return JSON.parse(str);
}
__name(getModulePayloads, "getModulePayloads");
function sanitizeGtmObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeGtmObject);
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      if (key === "type" && typeof obj[key] === "string" && obj[key] === obj[key].toUpperCase() && obj[key].length > 1) {
        newObj[key] = obj[key].toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      } else {
        newObj[key] = sanitizeGtmObject(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}
__name(sanitizeGtmObject, "sanitizeGtmObject");
async function onRequest7(context) {
  const { env, request } = context;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  try {
    const { containerPath, moduleIds, measurementId } = await request.json();
    if (!containerPath || !moduleIds || !Array.isArray(moduleIds) || !measurementId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const templates = [];
    for (const moduleId of moduleIds) {
      const template7 = getModulePayloads(moduleId, measurementId);
      if (!template7) {
        return new Response(JSON.stringify({ error: `Invalid module ID: ${moduleId}` }), { status: 400 });
      }
      const sanitizedVariables = (template7.variables || []).map((v) => sanitizeGtmObject({ name: v.name, type: v.type, parameter: v.parameter }));
      const sanitizedTriggers = (template7.triggers || []).map((t) => sanitizeGtmObject({ name: t.name, type: t.type, filter: t.filter, customEventFilter: t.customEventFilter, triggerId: t.triggerId }));
      const sanitizedTags = (template7.tags || []).map((t) => sanitizeGtmObject({ name: t.name, type: t.type, parameter: t.parameter, firingTriggerId: t.firingTriggerId }));
      templates.push({
        moduleId,
        variables: sanitizedVariables,
        triggers: sanitizedTriggers,
        tags: sanitizedTags
      });
    }
    return new Response(JSON.stringify({ templates }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Internal Server Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(onRequest7, "onRequest");

// api/gtm/workspaces.ts
async function onRequest8(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const containerPath = url.searchParams.get("containerPath");
  if (!containerPath) {
    return new Response(JSON.stringify({ error: "containerPath is required" }), { status: 400 });
  }
  try {
    const accessToken = await getGoogleAccessToken(env, request);
    const response = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/workspaces`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(onRequest8, "onRequest");

// api/contact.ts
async function onRequest9(context) {
  const { request } = context;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  try {
    const { name, email, message } = await request.json();
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const payload = {
      personalizations: [
        {
          to: [{ email: "ovi.cse23@gmail.com", name: "Ovi" }]
        }
      ],
      from: {
        email: "hello@gtmauto.io",
        name: "GTM Auto Contact Form"
      },
      subject: `New Inquiry from ${name}`,
      content: [
        {
          type: "text/plain",
          value: `You have received a new message from your website contact form:

Name: ${name}
Email: ${email}

Message:
${message}`
        }
      ]
    };
    const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mailchannels Error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
__name(onRequest9, "onRequest");

// ../.wrangler/tmp/pages-S57kHU/functionsRoutes-0.25352896189002117.mjs
var routes = [
  {
    routePath: "/api/auth/google/callback",
    mountPath: "/api/auth/google",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/auth/google/login",
    mountPath: "/api/auth/google",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/gtm/accounts",
    mountPath: "/api/gtm",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/gtm/audit",
    mountPath: "/api/gtm",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/gtm/containers",
    mountPath: "/api/gtm",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/gtm/deploy-item",
    mountPath: "/api/gtm",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/gtm/generate",
    mountPath: "/api/gtm",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/gtm/workspaces",
    mountPath: "/api/gtm",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/api/contact",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
