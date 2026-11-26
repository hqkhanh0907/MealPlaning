import { createServer, request } from 'node:http';

const paths = new Map([
  ['/health', ['GET']],
  ['/api/collections/users/records', ['POST']],
  ['/api/collections/users/auth-with-password', ['POST']],
  ['/api/mealplan/workspace', ['GET', 'POST']],
  ['/api/mealplan/workspace?metadata=1', ['GET']],
  ['/api/mealplan/session', ['POST']],
  ['/api/mealplan/session/refresh', ['POST']],
  ['/api/mealplan/sessions', ['GET']],
  ['/api/mealplan/sessions/revoke', ['POST']],
  ['/api/mealplan/profile', ['POST']],
  ['/api/mealplan/logout', ['POST']],
]);
const maxBody = 4_500_000;
const upstreamPort = Number(process.env.MEALPLAN_DB_PORT ?? 18089);
const publicPort = Number(process.env.MEALPLAN_API_PORT ?? 18090);
const authHits = new Map();

function reject(response, status, message) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify({ message }));
}

function limitAuth(path) {
  const limit = path.startsWith('/api/collections/users/') || path === '/api/mealplan/session' ? 36
    : path.startsWith('/api/mealplan/session') ? 120 : 0;
  if (!limit) return true;
  const now = Math.floor(Date.now() / 60_000);
  const previous = authHits.get(path);
  const count = previous?.minute === now ? previous.count + 1 : 1;
  authHits.set(path, { minute: now, count });
  return count <= limit;
}

const server = createServer(async (input, response) => {
  const methods = paths.get(input.url);
  const method = input.method;
  if (!methods || (method !== 'OPTIONS' && !methods.includes(method))) {
    reject(response, 404, 'Not found.');
    return;
  }
  if (input.headers.origin && input.headers.origin !== 'https://localhost') {
    reject(response, 403, 'Origin not allowed.');
    return;
  }
  if (method !== 'OPTIONS' && !limitAuth(input.url)) {
    reject(response, 429, 'Try again in a minute.');
    return;
  }
  const chunks = [];
  let bytes = 0;
  try {
    for await (const chunk of input.iterator({ destroyOnReturn: false })) {
      bytes += chunk.length;
      if (bytes > maxBody) {
        reject(response, 413, 'Request too large.');
        return;
      }
      chunks.push(chunk);
    }
  } catch {
    reject(response, 400, 'Incomplete request.');
    return;
  }
  const headers = { 'content-length': bytes, accept: 'application/json' };
  for (const name of ['authorization', 'origin', 'content-type',
    'access-control-request-method', 'access-control-request-headers']) {
    if (input.headers[name]) headers[name] = input.headers[name];
  }
  const outgoing = request({
    host: '127.0.0.1', port: upstreamPort, path: input.url, method, headers, timeout: 15_000,
  }, (received) => {
    response.writeHead(received.statusCode ?? 502, {
      ...received.headers, 'cache-control': 'no-store',
    });
    received.pipe(response);
  });
  outgoing.on('timeout', () => outgoing.destroy(new Error('Upstream timeout.')));
  outgoing.on('error', () => {
    if (!response.headersSent) reject(response, 502, 'Service unavailable.');
    else response.destroy();
  });
  outgoing.end(Buffer.concat(chunks));
});

server.requestTimeout = 20_000;
server.headersTimeout = 12_000;
server.listen(publicPort, '127.0.0.1');
