import fs from 'fs';
import path from 'path';

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const files = getFiles('functions/api');
let imports = '';
let routes = 'const routes = {\n';

let counter = 0;
for (const file of files) {
  if (file.endsWith('_utils.ts') || file.includes('index.ts')) continue;
  
  const routePath = '/' + file.replace('functions/', '').replace(/\.ts$/, '').replace(/\.js$/, '');
  const importName = `route_${counter++}`;
  
  imports += `import * as ${importName} from '../${file}';\n`;
  routes += `  '${routePath}': ${importName},\n`;
}

routes += '};\n';

const workerCode = `
import { Hono } from 'hono';

${imports}
${routes}

const app = new Hono();

for (const [route, module] of Object.entries(routes)) {
  const handler = async (c) => {
    const context = {
      request: c.req.raw,
      env: c.env,
      params: c.req.param(),
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx)
    };
    
    if (c.req.method === 'GET' && module.onRequestGet) {
      return module.onRequestGet(context);
    }
    if (c.req.method === 'POST' && module.onRequestPost) {
      return module.onRequestPost(context);
    }
    if (module.onRequest) {
      return module.onRequest(context);
    }
    return c.json({ error: 'Method not allowed' }, 405);
  };
  
  app.all(route, handler);
}

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    // Migrate the CRON trigger logic here
    const cronModule = routes['/api/ga4/cron'];
    if (cronModule && cronModule.onRequestGet) {
        // Mock a request just to satisfy the function signature
        const request = new Request('https://gtm-automation-saas.pages.dev/api/ga4/cron?token=' + (env.CRON_SECRET || ''));
        const context = {
            request,
            env,
            params: {},
            waitUntil: ctx.waitUntil.bind(ctx)
        };
        await cronModule.onRequestGet(context);
    }
  }
};
`;

fs.writeFileSync('src/worker.ts', workerCode);
console.log('src/worker.ts generated successfully');
