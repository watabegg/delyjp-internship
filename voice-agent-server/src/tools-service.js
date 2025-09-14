/**
 * ツールサービス（モック版）
 * 実装はせず、シンプルなモック応答のみ
 */

class ToolsService {
  /**
   * ツール定義を取得
   */
  static getToolDefinitions() {
    return [
      {
        type: "function",
        name: "recipeQA",
        description: "レシピに関する質問に答える",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "レシピに関する質問" },
          },
          required: ["query"],
        },
      },
      {
        type: "function",
        name: "showHowToVideo",
        description: "指定されたトピックのHow-to動画を表示する",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string", description: "動画で学びたいトピック" },
          },
          required: ["topic"],
        },
      },
      {
        type: "function",
        name: "controlVideo",
        description: "動画の再生操作を行う",
        parameters: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["play", "pause", "stop", "seek"],
              description: "実行するアクション",
            },
            value: { type: "number", description: "seekの場合の秒数" },
          },
          required: ["action"],
        },
      },
      {
        type: "function",
        name: "setTimer",
        description: "指定された時間のタイマーを設定する",
        parameters: {
          type: "object",
          properties: {
            seconds: { type: "number", description: "タイマーの秒数" },
          },
          required: ["seconds"],
        },
      },
    ];
  }

  /**
   * ツール実行のメイン関数（モック応答のみ）
   */
  static async executeFunction(name, args) {
    console.log(`[ToolsService] Mock executing: ${name}`, args);

    // すべてのツールに対してシンプルなモック応答を返す
    return {
      success: true,
      message: `${name} を実行しました（モック応答）`,
      data: {
        tool: name,
        args: args,
        timestamp: new Date().toISOString(),
        note: "これはモック応答です。実際の実装は後で追加予定。",
      },
    };
  }
}

module.exports = ToolsService;
