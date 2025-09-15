import {
  GoogleGenerativeAI,
  SchemaType,
  FunctionDeclaration,
} from "@google/generative-ai";
import { createRecipeSearchTool } from "./tools";

// Gemini Function Calling 対応 AI処理サービス
export class GeminiAIService {
  private static genAI: GoogleGenerativeAI | null = null;

  // Function Callingの定義
  private static functionDeclarations: FunctionDeclaration[] = [
    {
      name: "recipe_search",
      description:
        "レシピを検索して詳細な情報を取得する。料理名や食材名で検索できます。",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: "検索する料理名や食材名",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "method_video",
      description:
        "特定の調理法（切り方など）の動画を制御する。rectangles（短冊切り）、shavingCut（そぎ切り）、chop（ぶつ切り）、wedges（くし形切り）、mince（みじん切り）、dice（角切り）、shred（千切り）など",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          method: {
            type: SchemaType.STRING,
            format: "enum" as const,
            enum: ["START", "STOP", "CLOSE", "RESET"] as const,
            description: "動画の操作（開始、停止、閉じる、リセット）",
          },
          videoType: {
            type: SchemaType.STRING,
            format: "enum" as const,
            enum: [
              "rectangles",
              "shavingCut",
              "chop",
              "wedges",
              "mince",
              "dice",
              "shred",
            ] as const,
            description: "調理法の種類",
          },
        },
        required: ["method", "videoType"],
      },
    },
    {
      name: "video_control",
      description: "動画の再生制御を行う。再生、一時停止、早送り、巻き戻しなど",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          instruction: {
            type: SchemaType.STRING,
            format: "enum" as const,
            enum: ["PLAY", "PAUSE", "REWIND", "FORWARD"] as const,
            description: "実行する操作",
          },
          time: {
            type: SchemaType.NUMBER,
            description: "早送り/巻き戻しの秒数（省略可）",
          },
        },
        required: ["instruction"],
      },
    },
    {
      name: "timer_control",
      description:
        "料理タイマーを操作する。分や秒を指定してタイマーを開始できます。",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          method: {
            type: SchemaType.STRING,
            format: "enum" as const,
            enum: ["START", "STOP", "RESET", "CLOSE"] as const,
            description: "タイマーの操作",
          },
          minutes: {
            type: SchemaType.NUMBER,
            description: "タイマーの分数",
          },
          seconds: {
            type: SchemaType.NUMBER,
            description: "タイマーの秒数",
          },
        },
        required: ["method"],
      },
    },
  ];

  // Gemini初期化
  private static initializeGemini() {
    if (this.genAI) return this.genAI;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY environment variable is not set. Please create .env.local file with your Google AI API key."
      );
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    console.log("✅ [AI] Gemini Function Calling初期化完了");
    return this.genAI;
  }

  // 本物のGemini Function Callingで3パターンを処理
  static async processWithLangChainAgent(transcript: string) {
    console.log("🤖 [AI] Gemini Function Calling処理開始");

    try {
      const genAI = this.initializeGemini();

      // Function Calling対応モデルを初期化
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        tools: [{ functionDeclarations: this.functionDeclarations }],
      });

      // システムプロンプト
      const systemPrompt = `
あなたは料理アプリ「クラシル」のフレンドリーな料理パートナーです。
一緒に料理を楽しく作る仲間として、親しみやすく会話してください。

# あなたの性格
- 明るくて親しみやすい料理好きの友達
- ユーザーと一緒に料理を楽しむパートナー
- 失敗も含めて料理の楽しさを共有
- 会話は簡潔でテンポよく、親近感のある口調

# 利用可能なツール
1. **recipe_search**: レシピを検索
   - 「〇〇のレシピ」「〇〇の作り方」で使用
   - 結果は親しみやすく、要点を絞って説明

2. **method_video**: 切り方動画を表示
   - みじん切り(mince)、角切り(dice)、千切り(shred)など
   - 「〇〇切りを見せて」で使用

3. **video_control**: 動画の操作
   - 再生、一時停止、巻き戻し、早送り
   - 「動画を止めて」「もう一度見せて」で使用

4. **timer_control**: タイマー操作
   - 開始、停止、リセット
   - 「〇分タイマーセット」で使用

# 回答スタイル
## 会話のコツ：
- 「一緒に作りましょう！」の気持ちで
- 長すぎず、聞きやすい長さで
- 「〜ですね」「〜しましょう」など親しみやすい口調
- 料理の楽しさや美味しさを表現

## レシピ説明では：
- 手順は3-5ステップに要約
- 「ここがポイント！」など感情を込めて
- 「きっと美味しくできますよ♪」など励ましも

## 一般質問では：
- 簡潔で実用的なアドバイス
- 失敗談も交えて親近感を演出
- 「こうするともっと美味しくなりますよ」

## 注意点：
- 食材の安全性は必ず伝える
- でも堅苦しくならないように
- 楽しく安全に料理できるサポート

一緒に美味しい料理を作る料理仲間として、楽しく会話してください！
`;

      // Geminiにリクエスト送信
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model",
            parts: [
              {
                text: "こんにちは！クラシルの料理パートナーです♪一緒に美味しい料理を作りましょう！レシピを探したり、切り方の動画を見たり、タイマーをセットしたり、何でもお手伝いしますよ。今日は何を作りますか？",
              },
            ],
          },
        ],
      });

      const result = await chat.sendMessage(transcript);
      const response = result.response;

      console.log("🔍 [AI] Gemini Function Calling実行結果:", result);

      // Function Callがあるかチェック
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        console.log("🛠️ [AI] Function Call検出:", functionCalls);

        // 最初のFunction Callを処理
        const functionCall = functionCalls[0];
        const functionName = functionCall.name;
        const functionArgs = functionCall.args;

        console.log(`🛠️ [AI] 関数使用: ${functionName}`, functionArgs);

        // コマンド型かどうか判定
        if (this.isCommandTool(functionName)) {
          // パターン1: コマンド型ツール → Function Callの結果をそのまま返す
          console.log("🎯 [AI] パターン1: コマンド実行");

          // ツールを実行し、その結果をそのまま返す
          const toolResult = await this.executeFunction(
            functionName,
            functionArgs
          );

          let parsedOutput;
          try {
            parsedOutput = JSON.parse(toolResult);
          } catch {
            parsedOutput = {
              kind: "error",
              payload: { message: toolResult },
            };
          }

          return {
            pattern: 1,
            response: parsedOutput,
          };
        } else {
          // パターン2: 情報取得型ツール → ツール実行してAIが回答生成
          console.log("🎯 [AI] パターン2: 情報を基に応答生成");

          // ツール実行
          const toolResult = await this.executeFunction(
            functionName,
            functionArgs
          );

          // ツール結果をGeminiに送信してAI回答生成
          const followUpResult = await chat.sendMessage([
            {
              functionResponse: {
                name: functionName,
                response: { result: toolResult },
              },
            },
          ]);

          const aiResponse = followUpResult.response.text();

          return {
            pattern: 2,
            response: {
              kind: "withTalkUser",
              payload: { talkMessage: aiResponse },
            },
          };
        }
      } else {
        // パターン3: Function Call未使用 → AIの知識で直接回答
        console.log("🎯 [AI] パターン3: AI知識ベース回答");

        const aiResponse = response.text();

        return {
          pattern: 3,
          response: {
            kind: "withTalkUser",
            payload: { talkMessage: aiResponse },
          },
        };
      }
    } catch (error) {
      console.error("🚨 [AI] Gemini Function Calling処理エラー:", error);
      return {
        pattern: 3,
        response: {
          kind: "error",
          payload: {
            message: "申し訳ありません。処理中にエラーが発生しました。",
          },
        },
      };
    }
  }

  // コマンド型ツールかどうか判定
  private static isCommandTool(functionName: string): boolean {
    return ["method_video", "video_control", "timer_control"].includes(
      functionName
    );
  }

  // Function実行
  private static async executeFunction(functionName: string, args: any) {
    console.log(`🔧 [AI] Function実行: ${functionName}`, args);

    switch (functionName) {
      case "recipe_search":
        const recipeSearchTool = createRecipeSearchTool();
        return await recipeSearchTool.func(args);

      case "method_video":
        return JSON.stringify({
          kind: "methodToVideo",
          payload: {
            method: args.method,
            videoType: args.videoType,
          },
        });

      case "video_control":
        // Geminiが動的に抽出した秒数を使用（REWINDやFORWARDの場合）
        const payload: any = { instruction: args.instruction };
        if (args.time !== undefined) {
          payload.time = args.time;
        }

        return JSON.stringify({
          kind: "videoControll",
          payload: payload,
        });

      case "timer_control":
        // Geminiが動的に抽出した時間を秒に変換
        const totalSeconds = (args.minutes || 0) * 60 + (args.seconds || 0);
        const timerSeconds = totalSeconds > 0 ? totalSeconds : 300; // デフォルト5分

        return JSON.stringify({
          kind: "timer",
          payload: {
            method: args.method,
            seconds: timerSeconds,
          },
        });

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }
}
