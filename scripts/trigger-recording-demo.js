const net = require('net');
const crypto = require('crypto');

const wsPath = process.argv[2];
const expression = process.argv[3] || 'window.__startOpportunityPetRecordingDemo && window.__startOpportunityPetRecordingDemo()';
const port = Number(process.argv[4] || process.env.OPPORTUNITY_PET_DEBUG_PORT || 9333);
if (!wsPath) {
  console.error('Usage: node scripts/trigger-recording-demo.js /devtools/page/<id>');
  process.exit(1);
}

const host = '127.0.0.1';
const key = crypto.randomBytes(16).toString('base64');
const socket = net.createConnection({ host, port });
let handshake = '';
let connected = false;
let buffer = Buffer.alloc(0);
let id = 0;
const pending = new Map();

function makeFrame(text) {
  const payload = Buffer.from(text);
  const header = payload.length < 126 ? Buffer.alloc(2) : Buffer.alloc(4);
  header[0] = 0x81;
  if (payload.length < 126) {
    header[1] = 0x80 | payload.length;
  } else {
    header[1] = 0x80 | 126;
    header.writeUInt16BE(payload.length, 2);
  }
  const mask = crypto.randomBytes(4);
  for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
  return Buffer.concat([header, mask, payload]);
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    socket.write(makeFrame(JSON.stringify({ id: messageId, method, params })));
    setTimeout(() => {
      if (pending.has(messageId)) {
        pending.delete(messageId);
        reject(new Error(`Timed out: ${method}`));
      }
    }, 5000);
  });
}

function parseFrames() {
  while (buffer.length >= 2) {
    const opcode = buffer[0] & 0x0f;
    let length = buffer[1] & 0x7f;
    let offset = 2;
    if (length === 126) {
      if (buffer.length < 4) return;
      length = buffer.readUInt16BE(2);
      offset = 4;
    }
    if (buffer.length < offset + length) return;
    const payload = buffer.slice(offset, offset + length);
    buffer = buffer.slice(offset + length);
    if (opcode !== 1) continue;
    const message = JSON.parse(payload.toString());
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
      else entry.resolve(message.result);
    }
  }
}

socket.on('connect', () => {
  socket.write(
    `GET ${wsPath} HTTP/1.1\r\n` +
      `Host: ${host}:${port}\r\n` +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Key: ${key}\r\n` +
      'Sec-WebSocket-Version: 13\r\n\r\n'
  );
});

socket.on('data', async (chunk) => {
  if (!connected) {
    handshake += chunk.toString('binary');
    const index = handshake.indexOf('\r\n\r\n');
    if (index < 0) return;
    if (!handshake.slice(0, index).includes('101')) {
      console.error(handshake.slice(0, index));
      process.exit(1);
    }
    connected = true;
    buffer = Buffer.concat([buffer, Buffer.from(handshake.slice(index + 4), 'binary')]);
    parseFrames();
    await send('Runtime.enable');
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result && result.result && Object.prototype.hasOwnProperty.call(result.result, 'value')) {
      console.log(JSON.stringify(result.result.value));
    }
    socket.end();
    process.exit(0);
    return;
  }
  buffer = Buffer.concat([buffer, chunk]);
  parseFrames();
});

socket.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
