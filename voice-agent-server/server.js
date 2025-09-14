/**
 * Express.js + Socket.io 音声エージェントサーバー
 * シンプルで高速な専用サーバー
 */

require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const RealtimeProxy = require("./src/realtime-proxy");

const app = express();
const port = process.env.PORT || 3002;

// 環境別オリジン設定
const getAllowedOrigins = () => {
  const baseOrigins = [
    "http://localhost:3000", // Next.js フロントエンド
    "http://localhost:3001", // Rails API
    "http://127.0.0.1:3000", // ローカルホストのIPアドレス版
    "http://127.0.0.1:3001", // ローカルホストのIPアドレス版
  ];

  // 本番環境では環境変数から取得
  if (process.env.NODE_ENV === "production") {
    const prodOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    return [...baseOrigins, ...prodOrigins];
  }

  return baseOrigins;
};

// CORS設定
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // originが未定義（同一オリジン）またはリストに含まれる場合は許可
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
  ],
  credentials: true, // Cookie・認証情報を許可
  optionsSuccessStatus: 200, // レガシーブラウザ対応
  maxAge: 86400, // プリフライトリクエストのキャッシュ時間(24時間)
};

// ミドルウェア設定
app.use(cors(corsOptions));
app.use(express.json());

// 基本的なHTTPエンドポイント
app.get("/", (req, res) => {
  res.json({
    message: "Voice Agent Server Running",
    endpoints: {
      health: "/health",
      socketio: "ws://localhost:3002",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    openai_configured: !!process.env.OPENAI_API_KEY,
  });
});

// HTTPサーバー作成
const httpServer = createServer(app);

// Socket.ioサーバー設定
const io = new Server(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  // Socket.io追加設定
  transports: ["websocket", "polling"],
  allowEIO3: true, // Engine.IO v3との互換性
});

// Socket.io接続処理
io.on("connection", (socket) => {
  console.log(
    `🔗 [SocketIO] Client connected: ${socket.id} from ${socket.handshake.address}`
  );
  console.log(`📊 [SocketIO] Active connections: ${io.engine.clientsCount}`);

  // OpenAI Realtime APIプロキシを作成
  const realtimeProxy = new RealtimeProxy(socket);
  realtimeProxy.connect();

  // 音声データ受信の監視（デバッグ用）
  socket.on("audio_data", () => {
    // RealtimeProxyで詳細ログが出力されるので、ここでは接続確認のみ
    if (!socket._audioDataReceived) {
      console.log(
        `🎤 [SocketIO] Audio data flow started from client: ${socket.id}`
      );
      socket._audioDataReceived = true;
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `❌ [SocketIO] Client disconnected: ${socket.id}, reason: ${reason}`
    );
    console.log(
      `📊 [SocketIO] Remaining connections: ${io.engine.clientsCount - 1}`
    );
    realtimeProxy.cleanup();
  });

  socket.on("error", (error) => {
    console.error(`🚨 [SocketIO] Socket error: ${socket.id}`, error);
  });
});

// サーバー起動
httpServer.listen(port, () => {
  console.log(`🚀 Voice Agent Server running on http://localhost:${port}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🤖 OpenAI API configured: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`🔒 CORS allowed origins:`, getAllowedOrigins());
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// グレースフルシャットダウン
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  httpServer.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  httpServer.close(() => {
    console.log("Process terminated");
  });
});
