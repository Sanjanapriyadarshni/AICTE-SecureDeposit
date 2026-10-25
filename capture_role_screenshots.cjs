const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = "C:\\Users\\sanja\\.gemini\\antigravity\\brain\\ca1f7fe0-cf87-414e-86e6-ca3403bab413";

async function main() {
  console.log("Launching headless Chrome for screenshot capture...");
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1440,900',
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
          console.error('No page found');
          chromeProc.kill();
          return;
        }

        const ws = new WebSocket(page.webSocketDebuggerUrl);

        let id = 1;
        const pendingCallbacks = new Map();

        ws.onopen = async () => {
          console.log("Connected to Chrome CDP WebSocket.");
          
          function sendCommand(method, params = {}) {
            return new Promise((resolve, reject) => {
              const msgId = id++;
              pendingCallbacks.set(msgId, { resolve, reject });
              ws.send(JSON.stringify({ id: msgId, method, params }));
            });
          }

          ws.onmessage = (msg) => {
            const parsed = JSON.parse(msg.data);
            if (parsed.id && pendingCallbacks.has(parsed.id)) {
              const { resolve, reject } = pendingCallbacks.get(parsed.id);
              pendingCallbacks.delete(parsed.id);
              if (parsed.error) reject(parsed.error);
              else resolve(parsed.result);
            }
            if (parsed.method === 'Runtime.exceptionThrown') {
              console.error('BROWSER EXCEPTION:', JSON.stringify(parsed.params.exceptionDetails));
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

          // 1. Capture Login View
          console.log("Clearing auth for Login view capture...");
          await sendCommand('Page.navigate', { url: 'http://localhost:5173' });
          await new Promise(r => setTimeout(r, 1000));
          await sendCommand('Runtime.evaluate', {
            expression: `
              localStorage.removeItem('aicte_auth_token');
              localStorage.removeItem('aicte_auth_user');
              window.location.reload();
            `
          });
          await new Promise(r => setTimeout(r, 2500));

          console.log("Capturing LoginView...");
          let shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(ARTIFACT_DIR, 'login_view.png'), Buffer.from(shot.data, 'base64'));
          console.log("Saved login_view.png");

          // Demo user accounts to capture
          const roles = [
            {
              role: 'INSTITUTION',
              filename: 'role_institution_dashboard.png',
              token: 'demo_token_inst_1',
              user: {
                id: 1,
                email: 'institution@demo.aicte.local',
                name: 'Prof. Alok Kumar Singhal',
                role: 'INSTITUTION',
                institution_id: 1,
                designation: 'Registrar & Authorized Signatory'
              }
            },
            {
              role: 'AICTE_OFFICER',
              filename: 'role_officer_dashboard.png',
              token: 'demo_token_officer_2',
              user: {
                id: 2,
                email: 'officer@demo.aicte.local',
                name: 'Shri R. K. Sharma',
                role: 'AICTE_OFFICER',
                institution_id: null,
                designation: 'Deputy Director - Scrutiny & Verification Cell'
              }
            },
            {
              role: 'APPROVER',
              filename: 'role_approver_dashboard.png',
              token: 'demo_token_approver_3',
              user: {
                id: 3,
                email: 'approver@demo.aicte.local',
                name: 'Dr. M. S. Verma',
                role: 'APPROVER',
                institution_id: null,
                designation: 'Financial Adviser & Approving Authority'
              }
            }
          ];

          for (const item of roles) {
            console.log(`Setting auth and navigating to ${item.role} dashboard...`);
            await sendCommand('Runtime.evaluate', {
              expression: `
                localStorage.setItem('aicte_auth_token', ${JSON.stringify(item.token)});
                localStorage.setItem('aicte_auth_user', JSON.stringify(${JSON.stringify(item.user)}));
                window.location.href = 'http://localhost:5173/?view=dashboard&role=${item.role}';
              `
            });

            await new Promise(r => setTimeout(r, 3000));

            console.log(`Capturing screenshot for ${item.role}...`);
            shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
            const targetPath = path.join(ARTIFACT_DIR, item.filename);
            fs.writeFileSync(targetPath, Buffer.from(shot.data, 'base64'));
            console.log(`Saved screenshot to ${targetPath}`);
          }

          ws.close();
          chromeProc.kill();
          console.log("All screenshots successfully captured!");
        };

      } catch (err) {
        console.error("Error in capture flow:", err);
        chromeProc.kill();
      }
    });
  }).on('error', (e) => {
    console.error('CDP HTTP error:', e);
    chromeProc.kill();
  });
}

main();
