import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * レシピ検索ツール（パターン2: 情報取得型）
 * ツール結果をもとにAIが詳細な回答を生成
 */
export function createRecipeSearchTool() {
  return new DynamicStructuredTool({
    name: "recipe_search",
    description:
      "ユーザーが指定したレシピIDでレシピの詳細情報を取得する。材料、手順、コツなどの完全な情報を提供します。",
    schema: z.object({
      recipe_id: z.string().describe("ユーザーが指定したレシピのID"),
    }),
    func: async ({ recipe_id }) => {
      console.log(`🍳 [Tool] レシピ詳細取得: ${recipe_id}`);

      try {
        // Rails API からレシピ詳細を取得
        const response = await fetch(
          `http://localhost:3001/recipes/${recipe_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const recipe = await response.json();
        const attrs = recipe.attributes || recipe;

        if (!recipe) {
          return `レシピが見つかりませんでした。
ID: ${recipe_id}

指定されたレシピが存在しないか、アクセスできません。`;
        }

        // レシピ詳細情報を整形
        const formattedResult = `🍳 ${attrs.title}

📊 基本情報:
⏱️ 調理時間: ${attrs.cooking_time}分
💰 推定費用: ${attrs.estimated_cost}円
⭐ 評価: ${attrs.review_score ? `${attrs.review_score}/5.0` : "未評価"}
🏷️ カテゴリ: ${
          Array.isArray(attrs.category)
            ? attrs.category.join(", ")
            : attrs.category
        }

📝 説明:
${attrs.description || "レシピの詳細説明"}

🥄 材料:
${
  attrs.ingredients && Array.isArray(attrs.ingredients)
    ? attrs.ingredients
        .map((ing: any) => `• ${ing.name || ing}: ${ing.amount || ""}`)
        .join("\n")
    : "材料リストが利用できません"
}

👨‍🍳 作り方:
${
  attrs.instructions && Array.isArray(attrs.instructions)
    ? attrs.instructions
        .map((step: any, i: number) => `${i + 1}. ${step.description || step}`)
        .join("\n")
    : "調理手順が利用できません"
}

💡 コツ・ポイント:
${
  attrs.tips && Array.isArray(attrs.tips)
    ? attrs.tips.map((tip: string) => `• ${tip}`).join("\n")
    : attrs.tips || "美味しく作るためのコツをお聞かせください！"
}

${
  attrs.comment && Array.isArray(attrs.comment) && attrs.comment.length > 0
    ? `\n💬 コメント:\n${attrs.comment
        .map((comment: string) => `• ${comment}`)
        .join("\n")}`
    : ""
}

${
  attrs.taberepos &&
  Array.isArray(attrs.taberepos) &&
  attrs.taberepos.length > 0
    ? `\n🍽️ 食べレポ:\n${attrs.taberepos
        .slice(0, 3)
        .map((repo: string) => `• ${repo}`)
        .join("\n")}`
    : ""
}`;

        console.log("\n📋 [Tool] ===== レシピツールの生レスポンス =====");
        console.log("🍳 取得レシピID:", recipe_id);
        console.log("📄 レスポンス内容:");
        console.log("─".repeat(60));
        console.log(formattedResult);
        console.log("─".repeat(60));
        console.log(`📊 データサイズ: ${formattedResult.length} 文字`);
        console.log("✅ [Tool] ===== レシピツール完了 =====\n");

        return formattedResult;
      } catch (error) {
        console.error("🚨 [Tool] レシピ取得エラー:", error);

        // エラー時はフォールバック
        return `レシピ取得エラー:
ID: ${recipe_id}

申し訳ありません。現在レシピデータベースにアクセスできません。
少し時間をおいてから再度お試しください。`;
      }
    },
  });
}

/**
 * 調理法動画ツール（パターン1: コマンド型）
 * 特定の調理法（切り方など）の動画を制御
 */
export function createMethodVideoTool() {
  return new DynamicStructuredTool({
    name: "method_video",
    description:
      "特定の調理法（切り方など）の動画を制御する。rectangles（短冊切り）、shavingCut（そぎ切り）、chop（ぶつ切り）、wedges（くし形切り）、mince（みじん切り）、dice（角切り）、shred（千切り）など",
    schema: z.object({
      method: z
        .enum(["START", "STOP", "CLOSE", "RESET"])
        .describe("動画の操作（開始、停止、閉じる、リセット）"),
      videoType: z
        .enum([
          "rectangles",
          "shavingCut",
          "chop",
          "wedges",
          "mince",
          "dice",
          "shred",
        ])
        .describe("調理法の種類"),
    }),
    func: async ({ method, videoType }) => {
      console.log(`🎬 [Tool] 調理法動画実行: ${method}, ${videoType}`);

      return JSON.stringify({
        kind: "methodToVideo",
        payload: { method, videoType },
      });
    },
  });
}

/**
 * 動画操作ツール（パターン1: コマンド型）
 * 動画の再生制御を行う
 */
export function createVideoControlTool() {
  return new DynamicStructuredTool({
    name: "video_control",
    description: "動画の再生制御を行う。再生、一時停止、早送り、巻き戻しなど",
    schema: z.object({
      instruction: z
        .enum(["PLAY", "PAUSE", "REWIND", "FORWARD"])
        .describe("実行する操作"),
      time: z.number().optional().describe("早送り/巻き戻しの秒数（省略可）"),
    }),
    func: async ({ instruction, time }) => {
      console.log(`🎮 [Tool] 動画操作実行: ${instruction}, ${time}秒`);

      const payload: any = { instruction };
      if (time !== undefined) {
        payload.time = time;
      }

      return JSON.stringify({
        kind: "videoControll",
        payload: payload,
      });
    },
  });
}

/**
 * タイマー操作ツール（パターン1: コマンド型）
 * 料理タイマーを操作する
 */
export function createTimerControlTool() {
  return new DynamicStructuredTool({
    name: "timer_control",
    description:
      "料理タイマーを操作する。分や秒を指定してタイマーを開始できます。",
    schema: z.object({
      method: z
        .enum(["START", "STOP", "RESET", "RESTART", "CLOSE"])
        .describe("タイマーの操作"),
      minutes: z.number().optional().describe("タイマーの分数"),
      seconds: z.number().optional().describe("タイマーの秒数"),
    }),
    func: async ({ method, minutes, seconds }) => {
      console.log(
        `⏱️ [Tool] タイマー操作実行: ${method}, ${minutes}分${seconds}秒`
      );

      const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
      const timerSeconds = totalSeconds > 0 ? totalSeconds : 300; // デフォルト5分

      return JSON.stringify({
        kind: "timer",
        payload: { method, seconds: timerSeconds },
      });
    },
  });
}

/**
 * コマンド型ツールかどうか判定
 */
export function isCommandTool(toolName: string): boolean {
  return ["method_video", "video_control", "timer_control"].includes(toolName);
}
