const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = {}; // 全ユーザーの位置情報

wss.on('connection', ws => {
  console.log('🔗 クライアント接続');

  // 新しいクライアントに既存ユーザー情報を送る
  Object.entries(users).forEach(([uid, location]) => {
    ws.send(JSON.stringify({ uid, location }));
  });

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.command === 'update') {
      users[data.uid] = data.location;

      // 全員に送信（自分も含む）
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            uid: data.uid,
            location: data.location
          }));
        }
      });
    }
  });

  ws.on('close', () => console.log('❌ クライアント切断'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
