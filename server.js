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
  // 新しいユーザーが接続したときに、現在のユーザー位置を送信
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.command === 'update') {
      // ユーザーの位置情報を保存
      users[data.uid] = data.location;
      
      // 他のクライアントにユーザーの位置情報を送信
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

// サーバー起動
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
