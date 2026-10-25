const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = "C:\\Users\\sanja\\.gemini\\antigravity\\brain\\ca1f7fe0-cf87-414e-86e6-ca3403bab413";

async function main() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1440,960',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      try {
        const list = JSON.parse(data);
        const page = list.find(p => p.type === 'page');
        if (!page) {
          chromeProc.kill();
          return;
        }

        const ws = new WebSocket(page.webSocketDebuggerUrl);
        let id = 1;
        const pendingCallbacks = new Map();

        function sendCommand(method, params = {}) {
          return new Promise((resolve, reject) => {
            const msgId = id++;
            pendingCallbacks.set(msgId, { resolve, reject });
            ws.send(JSON.stringify({ id: msgId, method, params }));
          });
        }

        ws.onopen = async () => {
          ws.onmessage = (msg) => {
            const parsed = JSON.parse(msg.data);
            if (parsed.id && pendingCallbacks.has(parsed.id)) {
              const { resolve, reject } = pendingCallbacks.get(parsed.id);
              pendingCallbacks.delete(parsed.id);
              if (parsed.error) reject(parsed.error);
              else resolve(parsed.result);
            }
          };

          await sendCommand('Runtime.enable');
          await sendCommand('Page.enable');
          await sendCommand('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 960,
            deviceScaleFactor: 1,
            mobile: false
          });

          console.log("Navigating via CDP to Officer Dashboard...");
          await sendCommand('Page.navigate', { url: 'http://localhost:5173/?view=dashboard&role=AICTE_OFFICER' });
          await new Promise(r => setTimeout(r, 3000));

          console.log("Clicking 'Open Scrutiny' button...");
          const clickRes = await sendCommand('Runtime.evaluate', {
            expression: `
              (() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Open Scrutiny'));
                if (btn) {
                  btn.click();
                  return 'CLICKED';
                }
                return 'NOT_FOUND';
              })()
            `
          });
          console.log("Click eval result:", clickRes);

          await new Promise(r => setTimeout(r, 2500));

          console.log("Capturing Officer Scrutiny modal...");
          const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(ARTIFACT_DIR, 'officer_scrutiny_modal.png'), Buffer.from(shot.data, 'base64'));
          console.log("Officer modal successfully saved.");

          ws.close();
          chromeProc.kill();
        };

      } catch (e) {
        console.error(e);
        chromeProc.kill();
      }
    });
  }).on('error', e => {
    console.error(e);
    chromeProc.kill();
  });
}

main();
