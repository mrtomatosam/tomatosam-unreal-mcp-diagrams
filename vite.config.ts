
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

let lastGraph = null;

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'blueprint-sync-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/sync') {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body);
                  if (parsed && Array.isArray(parsed.nodes)) {
                    lastGraph = {
                      nodes: parsed.nodes || [],
                      edges: parsed.edges || []
                    };
                    res.statusCode = 200;
                    res.end(JSON.stringify({ status: 'ok' }));
                  } else {
                    res.statusCode = 400;
                    res.end('Invalid Blueprint Structure');
                  }
                } catch (e) {
                  res.statusCode = 400;
                  res.end('Invalid JSON');
                }
              });
              return;
            }
            if (req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(lastGraph));
              return;
            }
          }
          next();
        });
      }
    }
  ],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});
