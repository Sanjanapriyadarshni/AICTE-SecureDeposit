const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    'http://localhost:5173'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      const page = JSON.parse(data).find(p => p.type === 'page');
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      ws.onopen = async () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Page.navigate', params: { url: 'http://localhost:5173/?view=dashboard&role=AICTE_OFFICER' } }));
        await new Promise(r => setTimeout(r, 3000));
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Open Scrutiny'));
                if (b) {
                  b.click();
                  return 'FOUND AND CLICKED';
                }
                return 'NOT FOUND';
              })()
            `
          }
        }));
      };
      ws.onmessage = (msg) => {
        const parsed = JSON.parse(msg.data);
        if (parsed.id === 3) console.log('Eval 3 result:', parsed.result);
        if (parsed.method === 'Runtime.exceptionThrown') console.error('BROWSER EXCEPTION:', JSON.stringify(parsed.params.exceptionDetails));
        if (parsed.method === 'Runtime.consoleAPICalled') console.log('CONSOLE:', parsed.params.args.map(a => a.value || a.description).join(' '));
      };
      setTimeout(() => { ws.close(); chromeProc.kill(); }, 6000);
    });
  });
}
main();
