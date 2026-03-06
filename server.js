const http = require('http');
const { searchDocuments } = require('../agent/service/api');
const counter = require('../agent/service/counter');
const { runAgent } = require('./agent');

const PORT = 3001;
const DATE_FROM = '02.03.2026';
const DATE_TO = '06.03.2026';
const CACHE_TTL = 10_000;

const CYAN = '\x1b[0;36m';
const NC = '\x1b[0m';

let cache = { data: null, ts: 0 };

// ============ REST API ============

async function getState() {
    if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
        cache.data.botActivityRate = counter.get();
        return cache.data;
    }

    const [unsigned, signed] = await Promise.all([
        searchDocuments(DATE_FROM, DATE_TO),
        searchDocuments(DATE_FROM, DATE_TO, { status: 1 }),
    ]);

    const unsignedCount = unsigned?.data?.length || 0;
    const signedCount = signed?.data?.length || 0;
    const docsTotal = unsignedCount + signedCount;
    const successRate = docsTotal > 0 ? Math.round((signedCount / docsTotal) * 100) : 0;

    cache = {
        data: {
            docsTotal,
            signedCount,
            unsignedCount,
            botActivityRate: counter.get(),
            successRate,
        },
        ts: Date.now(),
    };
    return cache.data;
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/api/state' && req.method === 'GET') {
        try {
            const state = await getState();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(state));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

// ============ СТАРТ ============

server.listen(PORT, () => {
    console.log(`${CYAN}[API]${NC} http://localhost:${PORT}/api/state`);
    console.log(`${CYAN}[API]${NC} Период: ${DATE_FROM} — ${DATE_TO}\n`);

    runAgent(DATE_FROM, DATE_TO);
});
