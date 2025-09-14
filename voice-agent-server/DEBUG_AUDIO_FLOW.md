# 🎤 音声データフロー デバッグガイド

音声データがバックエンドに正常に届いているかを確認するためのデバッグ手順です。

## 📋 デバッグ手順

### 1. サーバーを起動してログを監視

```bash
# Express.js音声エージェントサーバーを起動
cd voice-agent-server
npm run dev

# 期待されるログ:
🚀 Voice Agent Server running on http://localhost:3002
📡 Socket.io server ready
🤖 OpenAI API configured: true
🔒 CORS allowed origins: [ 'http://localhost:3000', ... ]
```

### 2. フロントエンドを起動

```bash
# 別ターミナルでNext.jsフロントエンドを起動
cd web
npm run dev

# ブラウザで http://localhost:3000 にアクセス
```

### 3. 接続テスト

ブラウザで以下を確認：

#### 3.1 Socket.io 接続確認

**期待されるログ（Express.js 側）:**

```
🔗 [SocketIO] Client connected: <socket_id> from <ip_address>
📊 [SocketIO] Active connections: 1
✅ [RealtimeProxy] Connected to OpenAI Realtime API
⚙️ [RealtimeProxy] Initializing OpenAI session...
🛠️ [RealtimeProxy] Session config sent (4 tools)
✅ [RealtimeProxy] Session created successfully
```

**期待されるログ（ブラウザ側）:**

```
🔗 [Voice] Connected to voice-agent-server: http://localhost:3002
✅ [Voice] OpenAI Realtime session ready
```

### 4. 音声録音テスト

「接続する」→「話しかける」ボタンを押す

#### 4.1 マイクアクセス確認

**期待されるログ（ブラウザ側）:**

```
🎙️ [Voice] Requesting microphone access...
✅ [Voice] Microphone access granted
🎵 [Voice] AudioContext created (24kHz)
🔄 [Voice] Audio processing pipeline established
🎤 [Voice] Recording started successfully
```

#### 4.2 音声データ送信確認

**期待されるログ（ブラウザ側）:**

```
📡 [Voice] Audio chunks sent: 50 (4096 samples, 10922 base64 chars)
📡 [Voice] Audio chunks sent: 100 (4096 samples, 10922 base64 chars)
...
```

#### 4.3 バックエンド音声データ受信確認

**期待されるログ（Express.js 側）:**

```
🎤 [SocketIO] Audio data flow started from client: <socket_id>
🎤 [RealtimeProxy] First audio data received from client:
  - Type: input_audio_buffer.append
  - Audio data length: 10922 characters
  - Audio data sample (first 50 chars): /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwY...
✅ [RealtimeProxy] First audio chunk forwarded to OpenAI
📡 [RealtimeProxy] Audio chunks received from client: 50
📡 [RealtimeProxy] Audio chunks received from client: 100
```

## 🔍 トラブルシューティング

### ❌ 音声データが届かない場合

1. **Socket.io 接続の確認**

   - 「接続する」ボタンを押したときに接続ログが出るか？
   - ブラウザの Developer Tools でネットワークエラーがないか？

2. **マイクアクセスの確認**

   - ブラウザがマイクアクセスを許可しているか？
   - HTTPS または localhost でアクセスしているか？

3. **音声処理の確認**
   - AudioContext 作成のログが出ているか？
   - PCM16 変換が正常に動作しているか？

### ⚠️ 部分的にデータが届く場合

1. **データフォーマットの確認**

   - Base64 データの長さが適切か？（通常 10000 文字程度）
   - 音声データが正しく変換されているか？

2. **OpenAI 接続の確認**
   - OpenAI Realtime API との接続が維持されているか？
   - API キーが正しく設定されているか？

## 📊 正常な音声フロー

```
1. ユーザーマイク → AudioContext (24kHz, モノラル)
2. Float32 → PCM16変換 → Base64エンコード
3. Socket.io送信 → Express.jsサーバー受信
4. OpenAI Realtime API転送
5. 音声認識 → Function Calling → 音声応答
```

## 🎯 確認ポイント

- [ ] Socket.io 接続が成功している
- [ ] OpenAI Realtime API 接続が成功している
- [ ] マイクアクセスが許可されている
- [ ] AudioContext(24kHz)が作成されている
- [ ] 音声チャンクがバックエンドに届いている
- [ ] Base64 データが適切な長さ（10000 文字程度）
- [ ] OpenAI にデータが転送されている

これらすべてが正常に動作していれば、音声データは正しくバックエンドに届いています！
