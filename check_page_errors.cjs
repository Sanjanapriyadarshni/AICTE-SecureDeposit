const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    'http://localhost:5173/?view=verification&role=AICTE_OFFICER'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      try {
        const list = JSON.parse(data);
        const page = list.find(p => p.type === 'page');
        if (!page) {
          console.log('No page found');
          chromeProc.kill();
          return;
        }
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
        };
        ws.onmessage = (msg) => {
          const parsed = JSON.parse(msg.data);
          if (parsed.method === 'Runtime.exceptionThrown') {
            console.error('EXCEPTION:', JSON.stringify(parsed.params.exceptionDetails, null, 2));
          } else if (parsed.method === 'Runtime.consoleAPICalled') {
            console.log('CONSOLE:', parsed.params.type, parsed.params.args.map(a => a.value || a.description).join(' '));
          }
        };

        setTimeout(() => {
          ws.close();
          chromeProc.kill();
        }, 3000);
      } catch (e) {
        console.error(e);
        chromeProc.kill();
      }
    });
  }).on('error', (e) => {
    console.error('HTTP error:', e);
    chromeProc.kill();
  });
}

main();
