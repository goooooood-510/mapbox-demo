// === ユーザー識別用の一意IDを生成 ===
const uid = crypto.randomUUID(); // ユーザーごとに固有のID
const otherMarkers = {};         // 他ユーザーのマーカーを保持

// === Mapbox初期化 ===
mapboxgl.accessToken = 'pk.eyJ1IjoidGhhbmt5b3V1dSIsImEiOiJjbWNpZXcyaHowNWZnMmlzODN6YTFtb205In0.rQez5M7e3tP8E-V6Tnu3yA';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [139.7670, 35.6814], // 初期表示座標（東京駅など）
  zoom: 14
});

// 自分の位置マーカー（青）
const marker = new mapboxgl.Marker({ color: 'blue' }).addTo(map);

// === WebSocket接続 ===
const socket = new WebSocket('wss://mapbox-demo.onrender.com');
let pendingData = [];   // 保留データの配列
let watchId = null;     // watchPosition ID

// WebSocket接続完了
socket.onopen = () => {
  console.log('✅ WebSocket接続完了');

  // 保留データがあれば送信
  pendingData.forEach(data => socket.send(JSON.stringify(data)));
  pendingData = [];

  // 位置情報取得開始
  startGeolocation();
};

// 安全に送信する関数
function sendData(data) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  } else {
    pendingData.push(data);
  }
}

// 位置情報取得開始
function startGeolocation() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const data = {
        command: 'update',
        uid: uid,
        location: [pos.coords.latitude, pos.coords.longitude, pos.coords.speed]
      };
      sendData(data);

      // 自分のピン更新
      marker.setLngLat([pos.coords.longitude, pos.coords.latitude]);
    },
    (err) => console.error('位置情報取得エラー:', err),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
  );
}

// サーバーから他ユーザーの位置情報を受信
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // 自分以外のユーザー
  if (data.uid !== uid) {
    const lat = data.location[0];
    const lng = data.location[1];

    if (!otherMarkers[data.uid]) {
      // 新しいユーザー → 赤ピン作成
      otherMarkers[data.uid] = new mapboxgl.Marker({ color: 'red' })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      // 既存マーカー → 更新
      otherMarkers[data.uid].setLngLat([lng, lat]);
    }
  }
};

// 接続が切れたときのログ
socket.onclose = () => {
  console.warn('⚠️ WebSocket接続が切断されました');
};

// エラー発生時
socket.onerror = (err) => {
  console.error('WebSocketエラー:', err);
};
