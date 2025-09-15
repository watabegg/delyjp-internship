import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRecipeSearchTool } from "./tools";

// Gemini Function Calling 対応 AI処理サービス
export class GeminiAIService {
  private static genAI: GoogleGenerativeAI | null = null;

  // Function Callingの定義
  private static functionDeclarations = [
    {
      name: "recipe_search",
      description:
        "レシピを検索して詳細な情報を取得する。料理名や食材名で検索できます。",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "検索する料理名や食材名",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "video_search",
      description:
        "料理動画を検索する。料理名や調理法で動画を見つけることができます。",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "検索する動画のキーワード（料理名など）",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "video_control",
      description:
        "動画の再生制御を行う。再生、停止、早送り、巻き戻しなどができます。",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["play", "pause", "seek_forward", "seek_backward", "restart"],
            description: "実行するアクション",
          },
          seconds: {
            type: "number",
            description: "早送り/巻き戻しの秒数（省略可、デフォルト10秒）",
          },
        },
        required: ["action"],
      },
    },
    {
      name: "timer_control",
      description:
        "料理タイマーを操作する。分や秒を指定してタイマーを開始できます。",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["start", "stop", "pause", "reset"],
            description: "タイマーのアクション",
          },
          minutes: {
            type: "number",
            description: "タイマーの分数",
          },
          seconds: {
            type: "number",
            description: "タイマーの秒数",
          },
        },
        required: ["action"],
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
あなたは料理アプリ「クラシル」のAIアシスタントです。
ユーザーの要求に応じて適切なツール（関数）を使用してください。

利用可能なツール:
- recipe_search: レシピを検索して詳細な情報を取得
- video_search: 動画を検索  
- video_control: 動画の再生制御
- timer_control: タイマーの操作

ツールを使用しない場合は、料理に関する知識で直接回答してください。
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
                text: "はい、料理アプリ「クラシル」のAIアシスタントとして、ユーザーの要求に応じて適切なツールを使用してサポートします。",
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

          return {
            pattern: 1,
            response: {
              type: functionName,
              payload: functionArgs,
            },
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
              type: "generate_text_response",
              payload: { message: aiResponse },
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
            type: "generate_text_response",
            payload: { message: aiResponse },
          },
        };
      }
    } catch (error) {
      console.error("🚨 [AI] Gemini Function Calling処理エラー:", error);
      return {
        pattern: 3,
        response: {
          type: "generate_text_response",
          payload: {
            message: "申し訳ありません。処理中にエラーが発生しました。",
          },
        },
      };
    }
  }

  // コマンド型ツールかどうか判定
  private static isCommandTool(functionName: string): boolean {
    return ["video_search", "video_control", "timer_control"].includes(
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

      case "video_search":
        return JSON.stringify({
          type: "video_search",
          payload: args,
        });

      case "video_control":
        return JSON.stringify({
          type: "video_control",
          payload: { ...args, seconds: args.seconds || 10 },
        });

      case "timer_control":
        const totalSeconds = (args.minutes || 0) * 60 + (args.seconds || 0);
        return JSON.stringify({
          type: "timer_control",
          payload: { action: args.action, seconds: totalSeconds || 300 },
        });

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }
}
