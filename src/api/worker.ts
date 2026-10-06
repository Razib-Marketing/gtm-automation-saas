import { createTag, createVariable, createTrigger } from './gtm';

export interface Env {
  DB: any;
  SESSION_KV: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/deploy-recipe') {
      try {
        const body = await request.json() as { userId: string, moduleId: string, containerPath: string, accessToken: string };
        const { userId, moduleId, containerPath, accessToken } = body;

        // Sequence Control
        // 1. Create Variable
        const varResponse = await createVariable(accessToken, containerPath, 'eventAction');
        const varData = await varResponse.json() as any;
        const variableId = varData.variableId;

        // 2. Create Trigger
        const triggerResponse = await createTrigger(accessToken, containerPath, '(facebook\\.com|instagram\\.com)');
        const triggerData = await triggerResponse.json() as any;
        const triggerId = triggerData.triggerId;

        // 3. Create Tag linking the trigger
        const tagResponse = await createTag(accessToken, containerPath, triggerId, 'G-XXXXXXXXXX', 'outbound_social_click');
        const tagData = await tagResponse.json() as any;

        // Log to D1
        await env.DB.prepare('INSERT INTO deployed_recipes (id, connection_id, module_type, status, deployment_log) VALUES (?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), userId, moduleId, 'success', JSON.stringify({ tags: [tagData.tagId], triggers: [triggerId], variables: [variableId] }))
          .run();

        return new Response(JSON.stringify({ success: true, message: 'Recipe Deployed' }), { status: 200 });

      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
