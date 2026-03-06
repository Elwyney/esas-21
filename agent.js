const { searchDocuments } = require('../agent/service/api');
const { sign, counter } = require('../agent/index');

const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const CYAN = '\x1b[0;36m';
const NC = '\x1b[0m';

let agentRunning = false;

async function runAgent(dateFrom, dateTo) {
    if (agentRunning) {
        console.log(`${CYAN}[Агент]${NC} Уже запущен, пропускаю...`);
        return;
    }
    agentRunning = true;

    console.log(`${CYAN}[Агент]${NC} Поиск документов за ${dateFrom} — ${dateTo}...`);

    try {
        const result = await searchDocuments(dateFrom, dateTo);
        const docs = result?.data || [];
        console.log(`${CYAN}[Агент]${NC} Найдено: ${GREEN}${docs.length}${NC} документов\n`);

        for (const doc of docs) {
            try {
                await sign(doc.EMDRegistry_ObjectID, doc.EMDRegistry_ObjectName);
            } catch (err) {
                console.error(`[${doc.EMDRegistry_ObjectID}] ${RED}Ошибка${NC}`, err.message || err);
            }
        }

        console.log(`\n${CYAN}[Агент]${NC} Завершён. Подписано: ${GREEN}${counter.get()}${NC}`);
    } catch (err) {
        console.error(`${RED}[Агент] Ошибка поиска:${NC}`, err.message);
    }

    agentRunning = false;
}

function isRunning() {
    return agentRunning;
}

module.exports = { runAgent, isRunning };
