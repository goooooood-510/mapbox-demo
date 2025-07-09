// ✅ Mapboxトークンを設定
mapboxgl.accessToken = 'pk.eyJ1IjoidGhhbmt5b3V1dSIsImEiOiJjbWNpZXcyaHowNWZnMmlzODN6YTFtb205In0.rQez5M7e3tP8E-V6Tnu3yA';

// ✅ 地図を表示
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [139.6917, 35.6895], // 初期位置（東京）
  zoom: 12
});

// ✅ WebSocket接続
const socket = new WebSocket('ws://localhost:8080');  // サーバーのWebSocket URL

let marker = new mapboxgl.Marker().setLngLat([139.6917, 35.6895]).addTo(map);  // 初期マーカー

// ユーザーの位置情報をリアルタイムで取得して送信
navigator.geolocation.watchPosition((position) => {
  const data = {
    command: 'update',
    uid: 'user1',  // ユーザーID
    password: 'pass1',  // パスワード（認証用）
    location: [
      position.coords.latitude,
      position.coords.longitude,
      position.coords.speed
    ]
  };
  
  // サーバーに位置情報を送信
  socket.send(JSON.stringify(data));

  // マーカー位置を更新
  marker.setLngLat([position.coords.longitude, position.coords.latitude]);
});

// サーバーから位置情報を受信したとき
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // 他のユーザーのマーカーを更新
  if (data.uid !== 'user1') {  // 自分以外のユーザー情報
    // 他のユーザーのマーカーを更新するための処理
    const otherMarker = new mapboxgl.Marker().setLngLat(data.location.slice(0, 2)).addTo(map);
  }
};
