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
      "レシピを検索して詳細な情報を取得する。料理名や食材名で検索できます。",
    schema: z.object({
      query: z.string().describe("検索する料理名や食材名"),
    }),
    func: async ({ query }) => {
      console.log(`🍳 [Tool] レシピ検索実行: ${query}`);

      // 実際のDB検索やAPI呼び出し
      const mockRecipes = [
        {
          id: 1,
          title: `基本の${query}`,
          ingredients: [
            { name: "主材料A", amount: "300g" },
            { name: "主材料B", amount: "2個" },
            { name: "調味料C", amount: "大さじ2" },
            { name: "調味料D", amount: "適量" },
          ],
          steps: [
            "材料の準備と下ごしらえを行う",
            "主材料Aを中火で炒める（5分程度）",
            "主材料Bを加えてさらに炒める",
            "調味料Cと調味料Dで味付けをする",
            "蓋をして弱火で15分煮込んで完成",
          ],
          tips: "材料Aはしっかり炒めることで旨味が増します。",
          cookingTime: "約30分",
          difficulty: "初級",
        },
      ];

      return `レシピ検索結果:
クエリ: ${query}
見つかったレシピ: ${mockRecipes.length}件

${mockRecipes
  .map(
    (recipe, index) => `
レシピ${index + 1}: ${recipe.title}
調理時間: ${recipe.cookingTime}
難易度: ${recipe.difficulty}

材料:
${recipe.ingredients.map((ing) => `- ${ing.name}: ${ing.amount}`).join("\n")}

手順:
${recipe.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

コツ: ${recipe.tips}
`
  )
  .join("\n")}`;
    },
  });
}

/**
 * 動画検索ツール（パターン1: コマンド型）
 * フロントエンド向けのJSON指示をそのまま返す
 */
export function createVideoSearchTool() {
  return new DynamicStructuredTool({
    name: "video_search",
    description:
      "料理動画を検索する。料理名や調理法で動画を見つけることができます。",
    schema: z.object({
      query: z.string().describe("検索する動画のキーワード（料理名など）"),
    }),
    func: async ({ query }) => {
      console.log(`🎬 [Tool] 動画検索実行: ${query}`);

      return JSON.stringify({
        type: "video_search",
        payload: { query },
      });
    },
  });
}

/**
 * 動画操作ツール（パターン1: コマンド型）
 * フロントエンド向けのJSON指示をそのまま返す
 */
export function createVideoControlTool() {
  return new DynamicStructuredTool({
    name: "video_control",
    description:
      "動画の再生制御を行う。再生、停止、早送り、巻き戻しなどができます。",
    schema: z.object({
      action: z
        .enum(["play", "pause", "seek_forward", "seek_backward", "restart"])
        .describe("実行するアクション"),
      seconds: z
        .number()
        .optional()
        .describe("早送り/巻き戻しの秒数（省略可）"),
    }),
    func: async ({ action, seconds }) => {
      console.log(`🎮 [Tool] 動画操作実行: ${action}, ${seconds}秒`);

      return JSON.stringify({
        type: "video_control",
        payload: { action, seconds: seconds || 10 },
      });
    },
  });
}

/**
 * タイマー操作ツール（パターン1: コマンド型）
 * フロントエンド向けのJSON指示をそのまま返す
 */
export function createTimerControlTool() {
  return new DynamicStructuredTool({
    name: "timer_control",
    description:
      "料理タイマーを操作する。分や秒を指定してタイマーを開始できます。",
    schema: z.object({
      action: z
        .enum(["start", "stop", "pause", "reset"])
        .describe("タイマーのアクション"),
      minutes: z.number().optional().describe("タイマーの分数"),
      seconds: z.number().optional().describe("タイマーの秒数"),
    }),
    func: async ({ action, minutes, seconds }) => {
      console.log(
        `⏱️ [Tool] タイマー操作実行: ${action}, ${minutes}分${seconds}秒`
      );

      const totalSeconds = (minutes || 0) * 60 + (seconds || 0);

      return JSON.stringify({
        type: "timer_control",
        payload: { action, seconds: totalSeconds },
      });
    },
  });
}

/**
 * コマンド型ツールかどうか判定
 */
export function isCommandTool(toolName: string): boolean {
  return ["video_search", "video_control", "timer_control"].includes(toolName);
}
