const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));

// WebSocketサーバーの設定
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = {};  // ユーザーの位置情報を保持するオブジェクト

wss.on('connection', ws => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.command === 'update') {
      users[data.uid] = data.location;
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            uid: data.uid,
            location: data.location
          }));
        }
      });
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
