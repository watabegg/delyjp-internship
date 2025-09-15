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
        .enum(["START", "STOP", "RESET", "CLOSE"])
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
