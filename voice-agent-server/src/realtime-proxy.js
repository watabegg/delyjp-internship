/**
 * OpenAI Realtime API プロキシ
 * Express.js専用版
 */

const WebSocket = require("ws");
const ToolsService = require("./tools-service");

class RealtimeProxy {
  constructor(clientSocket) {
    this.clientSocket = clientSocket;
    this.openaiWs = null;
    this.isConnected = false;
  }

  /**
   * OpenAI Realtime APIに接続
   */
  async connect() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is required");
      }

      const url =
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

      this.openaiWs = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "realtime=v1",
        },
      });

      this.setupOpenAIHandlers();
      this.setupClientHandlers();
    } catch (error) {
      console.error("[RealtimeProxy] Connection failed:", error);
      this.clientSocket.emit("error", {
        message: "Failed to connect to OpenAI Realtime API",
        error: error.message,
      });
    }
  }

  /**
   * OpenAI WebSocketイベントハンドラー設定
   */
  setupOpenAIHandlers() {
    this.openaiWs.on("open", () => {
      console.log("✅ [RealtimeProxy] Connected to OpenAI Realtime API");
      this.isConnected = true;
      this.initializeSession();
      this.clientSocket.emit("openai_connected");
    });

    this.openaiWs.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        // 重要なメッセージのみログ出力
        const importantTypes = [
          "session.created",
          "session.updated",
          "input_audio_buffer.speech_started",
          "input_audio_buffer.speech_stopped",
          "conversation.item.input_audio_transcription.delta",
          "conversation.item.input_audio_transcription.completed",
          "response.created",
          "response.text.done",
          "response.done",
          "error",
        ];
        if (importantTypes.includes(message.type)) {
          console.log(`📨 [RealtimeProxy] ${message.type}`);
        }
        this.handleOpenAIMessage(message);
      } catch (error) {
        console.error(
          "❌ [RealtimeProxy] Failed to parse OpenAI message:",
          error
        );
      }
    });

    this.openaiWs.on("error", (error) => {
      console.error("🚨 [RealtimeProxy] OpenAI WebSocket error:", error);
      this.clientSocket.emit("openai_error", { error: error.message });
    });

    this.openaiWs.on("close", (code, reason) => {
      console.log(
        `🔌 [RealtimeProxy] OpenAI connection closed: ${code} ${reason}`
      );
      this.isConnected = false;
      this.clientSocket.emit("openai_disconnected", { code, reason });
    });
  }

  /**
   * クライアントSocketイベントハンドラー設定
   */
  setupClientHandlers() {
    let audioChunkCount = 0;
    let droppedChunks = 0;

    // 音声データの転送
    this.clientSocket.on("audio_data", (data) => {
      audioChunkCount++;

      // 最初の音声データのみログ出力
      if (audioChunkCount === 1) {
        console.log("🎤 [RealtimeProxy] 音声入力開始");
      }

      if (this.isConnected && this.openaiWs.readyState === WebSocket.OPEN) {
        this.openaiWs.send(JSON.stringify(data));
        if (audioChunkCount === 1) {
          console.log("✅ [RealtimeProxy] 音声データ送信開始");
        }
      } else {
        droppedChunks++;
        if (audioChunkCount === 1) {
          console.warn("⚠️ [RealtimeProxy] OpenAI未接続 - 音声データを破棄中");
        }
        if (droppedChunks % 100 === 0) {
          console.warn(
            `⚠️ [RealtimeProxy] 破棄されたチャンク数: ${droppedChunks}`
          );
        }
      }
    });

    // その他のメッセージ転送
    this.clientSocket.on("realtime_message", (message) => {
      if (this.isConnected && this.openaiWs.readyState === WebSocket.OPEN) {
        this.openaiWs.send(JSON.stringify(message));
      }
    });

    this.clientSocket.on("disconnect", () => {
      console.log("👋 [RealtimeProxy] Client disconnected");
    });
  }

  /**
   * セッション初期化
   */
  initializeSession() {
    if (!this.openaiWs || this.openaiWs.readyState !== WebSocket.OPEN) return;

    console.log("⚙️ [RealtimeProxy] Initializing OpenAI session...");
    const sessionConfig = {
      type: "session.update",
      session: {
        modalities: ["text"], // テキストのみ有効化
        input_audio_transcription: {
          model: "whisper-1",
          // 固有名詞・専門用語の認識精度向上
          prompt:
            "これは料理アプリ「クラシル」の音声アシスタントです。ユーザーは「クラシル」「KURASHIRU」「kurashiru」という名前で呼びかけます。料理、レシピ、調理に関する会話です。",
        },
        instructions: this.buildInstructions(),
        // tools: ToolsService.getToolDefinitions(), // 一時的にツールを無効化
        turn_detection: {
          type: "server_vad", // サーバー側での音声検出（自動応答有効）
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    };

    this.openaiWs.send(JSON.stringify(sessionConfig));
    console.log(`🛠️ [RealtimeProxy] Session config sent (tools disabled)`);
    // console.log(
    //   `🛠️ [RealtimeProxy] Session config sent (${
    //     ToolsService.getToolDefinitions().length
    //   } tools)`
    // );
  }

  /**
   * OpenAIからのメッセージ処理
   */
  async handleOpenAIMessage(message) {
    switch (message.type) {
      case "session.created":
        console.log("✅ [RealtimeProxy] Session created successfully");
        console.log(
          "🎙️ [RealtimeProxy] 音声入力の準備完了 - 録音を開始してください"
        );
        this.clientSocket.emit("session_ready");
        break;

      case "input_audio_buffer.speech_started":
        console.log("🔊 [RealtimeProxy] 音声検出開始");
        this.clientSocket.emit("speech_started");
        break;

      case "input_audio_buffer.speech_stopped":
        console.log("⏸️ [RealtimeProxy] 音声検出停止");
        this.clientSocket.emit("speech_stopped");
        break;

      case "conversation.item.input_audio_transcription.delta":
        console.log(`📝 [RealtimeProxy] 音声認識中: "${message.delta}"`);
        break;

      case "conversation.item.input_audio_transcription.completed":
        const transcript = message.transcript;
        console.log(`🎤 [RealtimeProxy] 「${transcript}」`);

        this.clientSocket.emit("transcription", {
          transcript: transcript,
        });

        // OpenAI自身に司令塔役をやってもらう（自動応答有効）
        // 会話の切れ目判定もOpenAIが自動で行う
        console.log(`🧠 [RealtimeProxy] OpenAI司令塔に完全委任（自動応答）`);
        break;

      // case "response.function_call_arguments.done":
      //   // Function Callingをサーバーサイドで処理
      //   await this.handleFunctionCall(message);
      //   return; // クライアントには転送しない

      case "response.audio.delta":
        // 音声レスポンスをクライアントに転送（ログなし）
        this.clientSocket.emit("audio_response", { delta: message.delta });
        break;

      case "response.text.delta":
        // テキストレスポンスの断片を送信（ログは出さない）
        this.clientSocket.emit("text_response", { delta: message.delta });
        break;

      case "response.text.done":
        // テキストレスポンス完了
        const responseText = message.text;
        console.log(`✅ [RealtimeProxy] AI応答完了: 「${responseText}」`);

        // 「クラシル」だけの応答は無応答として扱う
        if (this.shouldSuppressResponse(responseText)) {
          console.log(
            `🔇 [RealtimeProxy] 応答抑制: ウェイクワード案内のため無応答`
          );
          return; // クライアントに送信しない
        }

        this.clientSocket.emit("text_done", { text: responseText });
        break;

      case "response.created":
        console.log("🎬 [RealtimeProxy] AI応答生成開始（自動応答有効）");
        // 自動応答を許可（キャンセルしない）
        break;

      case "response.done":
        console.log("🏁 [RealtimeProxy] AI応答完了");

        // デバッグ: 応答の詳細を確認
        if (message.response) {
          const { status, output } = message.response;
          console.log(`  📊 Status: ${status}`);
          if (output && output.length > 0) {
            console.log(`  📝 Output items: ${output.length}`);
            output.forEach((item, index) => {
              if (item.type === "message") {
                console.log(
                  `    ${index + 1}. Type: ${item.type}, Role: ${item.role}`
                );
                if (item.content) {
                  item.content.forEach((content, contentIndex) => {
                    console.log(
                      `       Content ${contentIndex + 1}: ${content.type}`
                    );
                    if (content.type === "text" && content.text) {
                      console.log(`       📄 Text: "${content.text}"`);
                    }
                  });
                }
              } else {
                console.log(`    ${index + 1}. Type: ${item.type}`);
              }
            });
          } else {
            console.log("  ⚠️ 応答内容が空です");
          }
        }

        this.clientSocket.emit("response_done");
        break;

      case "error":
        // キャンセルエラーは無視
        if (message.error?.code === "response_cancel_not_active") {
          console.log(
            "⚠️ [RealtimeProxy] 応答キャンセル不要（応答が開始されていません）"
          );
        } else {
          console.error(
            "🚨 [RealtimeProxy] OpenAI Error Details:",
            JSON.stringify(message, null, 2)
          );
          this.clientSocket.emit("openai_error", message);
        }
        break;

      default:
        // その他のメッセージをクライアントに転送
        this.clientSocket.emit("openai_message", message);
    }
  }

  /**
   * Function Call処理
   */
  async handleFunctionCall(message) {
    try {
      const { name, arguments: args, call_id } = message;
      const parsedArgs = JSON.parse(args);

      console.log(`🛠️ [RealtimeProxy] ツール実行: ${name}`);

      // ツールを実行
      const result = await ToolsService.executeFunction(name, parsedArgs);
      console.log(`✅ [RealtimeProxy] ツール完了: ${name}`);

      // 実行結果をクライアントに通知
      this.clientSocket.emit("tool_result", { name, result });

      // 結果をOpenAIに送信
      if (this.openaiWs && this.openaiWs.readyState === WebSocket.OPEN) {
        this.openaiWs.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: call_id,
              output: JSON.stringify(result),
            },
          })
        );
        // 結果送信完了（ログなし）
      } else {
        console.error(
          "❌ [RealtimeProxy] Cannot send function result - OpenAI not connected"
        );

        // レスポンス生成を要求
        this.openaiWs.send(
          JSON.stringify({
            type: "response.create",
          })
        );
      }
    } catch (error) {
      console.error("[RealtimeProxy] Function call error:", error);

      // エラーレスポンスを送信
      if (this.openaiWs && this.openaiWs.readyState === WebSocket.OPEN) {
        this.openaiWs.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: message.call_id,
              output: JSON.stringify({
                error: "Function execution failed",
                message:
                  error instanceof Error ? error.message : "Unknown error",
              }),
            },
          })
        );
      }
    }
  }

  /**
   * 応答抑制判定
   */
  shouldSuppressResponse(responseText) {
    if (!responseText || typeof responseText !== "string") {
      return true; // 空の応答は抑制
    }

    const normalized = responseText.trim();

    // ウェイクワード案内の応答パターン（これらは無応答として扱う）
    const suppressPatterns = [
      /^クラシル$/, // 「クラシル」だけ
      /^kurashiru$/i, // 「kurashiru」だけ
      /^くらしる$/, // 「くらしる」だけ
      /^クラシル。?$/, // 「クラシル。」
      /^クラシル、?はい。?$/, // 「クラシル、はい。」などの短い応答
    ];

    // パターンマッチング
    for (const pattern of suppressPatterns) {
      if (pattern.test(normalized)) {
        return true; // 抑制する
      }
    }

    // 短すぎる応答（5文字以下）も抑制対象
    if (normalized.length <= 5) {
      return true;
    }

    return false; // 抑制しない（正常な応答として送信）
  }

  /**
   * ウェイクワード検出
   */
  hasWakeWord(transcript) {
    if (!transcript || typeof transcript !== "string") {
      return false;
    }

    const normalized = transcript.trim().toLowerCase();
    const wakeWords = [
      "クラシル",
      "くらしる",
      "倉敷る",
      "クラシル",
      "KURASHIRU",
      "kurashiru",
      "へいクラシル",
      "ヘイクラシル",
      "オッケークラシル",
      "オーケークラシル",
      "レシピ教えて",
      "料理教えて",
      "作り方教えて",
      "料理アプリ",
      "レシピアプリ",
    ];

    return wakeWords.some((word) => normalized.includes(word.toLowerCase()));
  }

  /**
   * 応答キャンセル処理
   */
  cancelAnyPendingResponse() {
    try {
      this.openaiWs.send(
        JSON.stringify({
          type: "response.cancel",
        })
      );
      console.log("❌ [RealtimeProxy] 応答キャンセル送信");
    } catch (error) {
      // キャンセル失敗は正常（応答がまだ開始されていない）
    }
  }

  /**
   * ウェイクワード案内送信
   */
  sendWakeWordGuidance() {
    const guidance = "「クラシル」または「レシピ教えて」で始めてください。";
    this.clientSocket.emit("text_done", {
      text: guidance,
      filtered: true,
    });
    console.log(`📤 [RealtimeProxy] ウェイクワード案内: 「${guidance}」`);
  }

  /**
   * 音声認識結果をフィルタリング（Hey Siri方式）
   */
  shouldIgnoreTranscript(transcript) {
    if (!transcript || typeof transcript !== "string") {
      return true;
    }

    // 文字列を正規化（空白除去、小文字化）
    const normalized = transcript.trim().toLowerCase();

    // 基本的な長さチェック
    if (normalized.length === 0) {
      return true;
    }

    // ウェイクワードで始まる発話のみ受け付ける
    const wakeWords = [
      "クラシル", // 「クラシル、カレーの作り方を教えて」
      "へいクラシル", // 「へいクラシル、タイマーをセット」
      "ヘイクラシル", // 「ヘイクラシル、レシピを見せて」
      "オッケークラシル", // 「オッケークラシル、材料は何？」
      "レシピ教えて", // 「レシピ教えて、ハンバーグの作り方」
    ];

    // ウェイクワードで始まっているかチェック
    const startsWithWakeWord = wakeWords.some((wakeWord) =>
      normalized.startsWith(wakeWord.toLowerCase())
    );

    if (!startsWithWakeWord) {
      return true; // ウェイクワードなしはフィルタリング
    }

    // ウェイクワードの後に実際の質問があるかチェック
    const afterWakeWord = wakeWords.find((wakeWord) =>
      normalized.startsWith(wakeWord.toLowerCase())
    );

    if (afterWakeWord) {
      const command = normalized.substring(afterWakeWord.length).trim();
      // ウェイクワードの後が短すぎる場合はフィルタリング
      if (command.length < 3) {
        return true;
      }
    }

    // フィラー音声パターン
    const fillerPatterns = [
      /^あ+$/, // あ、ああ、あああ
      /^え+$/, // え、ええ、えええ
      /^お+$/, // お、おお、おおお
      /^う+ん*$/, // う、うん、うーん
      /^ん+$/, // ん、んん、んーん
      /^は+$/, // は、はは、ははは
      /^へ+$/, // へ、へえ、へええ
      /^ほ+$/, // ほ、ほお、ほほほ
      /^そ+$/, // そ、そう、そそそ
      /^ま+$/, // ま、まあ、まーま
      /^な+$/, // な、なあ、なーな
      /^い+$/, // い、いい、いーい
      /^あーっと$/, // あーっと
      /^えーっと$/, // えーっと
      /^うーん+と$/, // うーんと
      /^そのー+$/, // そのー、そのーー
      /^なんか$/, // なんか
      /^なんて$/, // なんて
      /^まあ$/, // まあ
      /^うーん$/, // うーん
      /^あのー+$/, // あのー、あのーー
      /^どうだろう$/, // どうだろう（独り言）
    ];

    // パターンマッチング
    for (const pattern of fillerPatterns) {
      if (pattern.test(normalized)) {
        return true;
      }
    }

    // 意味のないことばの組み合わせ
    const meaninglessWords = ["あ", "え", "お", "う", "ん", "は", "へ", "ほ"];
    const words = normalized.split(/\s+/);
    if (words.every((word) => meaninglessWords.includes(word))) {
      return true;
    }

    return false; // フィルタリングしない
  }

  /**
   * 指示文を構築
   */
  buildInstructions() {
    return `
あなたはクラシルの音声料理アシスタントです。司令塔として以下の役割を果たしてください。

## 重要な司令塔ルール:

### 1. ウェイクワード判定（最優先）

**ウェイクワードがない場合**:
- 必ず「クラシル」とだけ返してください
- 他の説明は一切不要です

**ウェイクワードがある場合**:
- 料理に関する詳しい説明をしてください
- 親しみやすく丁寧に答えてください

ウェイクワード一覧:
- クラシル、くらしる、倉敷る
- KURASHIRU、kurashiru
- へいクラシル、ヘイクラシル
- オッケークラシル、オーケークラシル
- レシピ教えて、料理教えて、作り方教えて
- 料理アプリ、レシピアプリ

### 2. 応答例

**ウェイクワードなし**:
- 「こんにちは」→ 「」
- 「おはよう」→ 「」  
- 「あー」→ 「」

**ウェイクワードあり**:
- 「クラシル、カレーの作り方教えて」→ 「カレーは玉ねぎを炒めて、牛肉と野菜を煮込み、ルーを入れて仕上げます。じゃがいもとにんじんも忘れずに入れてくださいね。」
- 「レシピ教えて、ハンバーグ」→ 「ハンバーグは牛ひき肉300gに玉ねぎのみじん切り、パン粉、卵を混ぜて成形し、フライパンで両面焼いてから蒸し焼きにします。」

簡潔で実用的な料理情報を提供してください。
    `.trim();
  }

  /**
   * フィルタリング理由を分析
   */
  getFilterReason(transcript) {
    const normalized = transcript.trim().toLowerCase();

    if (normalized.length === 0) {
      return "empty";
    }

    // ウェイクワードチェック
    const wakeWords = [
      "クラシル",
      "へいクラシル",
      "ヘイクラシル",
      "オッケークラシル",
      "レシピ教えて",
    ];
    const hasWakeWord = wakeWords.some((word) =>
      normalized.startsWith(word.toLowerCase())
    );

    if (!hasWakeWord) {
      return "no_wakeword";
    }

    return "other";
  }

  /**
   * フィルタリングされた発話に対する応答を送信
   */
  sendFilteredResponse(transcript, reason) {
    let responseText = "";

    switch (reason) {
      case "empty":
        responseText = "";
        console.log("🔇 [RealtimeProxy] 無音のため応答なし");
        break;

      case "no_wakeword":
        responseText =
          "ウェイクワードが必要です。「クラシル」または「レシピ教えて」で始めてください。";
        console.log("💬 [RealtimeProxy] ウェイクワード不足の案内を送信");
        break;

      default:
        responseText =
          "申し訳ございませんが、理解できませんでした。もう一度お試しください。";
        console.log("💬 [RealtimeProxy] 一般的なエラー応答を送信");
        break;
    }

    if (responseText) {
      // クライアントに直接テキスト応答を送信
      this.clientSocket.emit("text_done", {
        text: responseText,
        filtered: true,
      });
      console.log(`📤 [RealtimeProxy] フィルタ応答: 「${responseText}」`);
    }
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    if (this.openaiWs) {
      this.openaiWs.close();
      this.openaiWs = null;
    }
    this.isConnected = false;
  }
}

module.exports = RealtimeProxy;
