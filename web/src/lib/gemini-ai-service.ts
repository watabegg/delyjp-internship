import {
	type FunctionDeclaration,
	GoogleGenerativeAI,
	SchemaType,
} from "@google/generative-ai";
import type { PayloadMap, ServerMessage } from "../types/express";
import { createRecipeSearchTool } from "./tools";

// Gemini Function Calling 対応 AI処理サービス
export class GeminiAIService {
	private static genAI: GoogleGenerativeAI | null = null;

	// Function Callingの定義
	private static functionDeclarations: FunctionDeclaration[] = [
		{
			name: "recipe_search",
			description:
				"ユーザーが現在のレシピについて詳しく知りたがっている時に使用。材料・手順・コツ・評価などの具体的な情報が必要な場面で実行する。「材料は何？」「作り方教えて」「コツある？」といった直接的な質問から、「何を用意すればいい？」「どうやって作るの？」「失敗しないポイントは？」のような間接的な表現まで幅広く対応。一般的な料理知識で答えられる質問（例：「塩の量は？」）では使用しない。",
			parameters: {
				type: SchemaType.OBJECT,
				properties: {
					recipe_id: {
						type: SchemaType.STRING,
						description: "リクエストに指定されたレシピのID（UUID形式）",
					},
				},
				required: ["recipe_id"],
			},
		},
		{
			name: "method_video",
			description:
				"ユーザーが具体的な切り方・調理技術を視覚的に学びたがっている時に使用。「みじん切りって？」「千切りのやり方」といった直接的な要求から、「玉ねぎをどう切ればいい？」「細かく切るコツは？」「包丁がうまく使えない」「切り方がわからない」のような困りごとまで対応。単純な切り方の説明（例：「みじん切りは細かく切ることです」）なら使用せず、実際の技術指導が必要な場面でのみ実行する。",
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
			description:
				"ユーザーが現在再生中の動画を操作したがっている時に使用。「止めて」「続けて」「戻して」「進めて」といった直接的な操作指示から、「見えない」「もう一度見たい」「早く次に行きたい」「ゆっくり見たい」「見逃した」のような間接的な要求まで対応。動画が再生されていない状態での操作要求や、動画に関する質問（例：「この動画どのくらい？」）では使用しない。",
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
				"ユーザーが具体的に時間を測定・管理したがっている時に使用。「5分タイマー」「時間測って」といった直接的な要求から、「どのくらい煮ればいい？」「茹で時間教えて」「いつまで炒める？」のような調理時間の質問まで対応。ただし、一般的な調理時間の質問（例：「パスタって何分？」）なら知識で回答し、実際にタイマーが必要な場面でのみ実行する。",
			parameters: {
				type: SchemaType.OBJECT,
				properties: {
					method: {
						type: SchemaType.STRING,
						format: "enum" as const,
						enum: ["START", "STOP", "RESET", "RESTART", "CLOSE"] as const,
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
		if (GeminiAIService.genAI) return GeminiAIService.genAI;

		const apiKey = process.env.GOOGLE_API_KEY;
		if (!apiKey) {
			throw new Error(
				"GOOGLE_API_KEY environment variable is not set. Please create .env.local file with your Google AI API key.",
			);
		}

		GeminiAIService.genAI = new GoogleGenerativeAI(apiKey);
		console.log("✅ [AI] Gemini Function Calling初期化完了");
		return GeminiAIService.genAI;
	}

	// 本物のGemini Function Callingで3パターンを処理
	static async processWithLangChainAgent(
		transcript: string,
		recipeId?: string | null,
	) {
		console.log("🤖 [AI] Gemini Function Calling処理開始");
		console.log(`🆔 [AI] 受信レシピID: ${recipeId || "未指定"}`);

		try {
			const genAI = GeminiAIService.initializeGemini();

			// Function Calling対応モデルを初期化
			const model = genAI.getGenerativeModel({
				model: "gemini-1.5-pro",
				tools: [{ functionDeclarations: GeminiAIService.functionDeclarations }],
			});

			// システムプロンプト
			const systemPrompt = `
あなたは料理アプリのフレンドリーな料理パートナーかつ料理の知識が豊富なプロの料理人です。
一緒に料理を楽しく作る仲間として、親しみやすく会話してください。

# あなたの特徴
- 料理の専門知識が豊富なプロフェッショナル
- ユーザーの言葉の奥にある意図を汲み取る洞察力
- 失敗も一緒に乗り越える温かいサポーター
- 自然で親しみやすい会話スタイル

# 利用可能なツール
以下の4つのツールを適切に使い分けてユーザーをサポートしてください：

1. **recipe_search**: 現在のレシピ詳細取得
   - 材料、手順、コツ、評価などの完全な情報を提供

2. **method_video**: 切り方動画の表示  
   - みじん切り、千切り、角切りなど7種類の切り方動画
   - 調理法の学習と技術向上をサポート

3. **video_control**: 動画の再生制御
   - 再生、一時停止、早送り、巻き戻しの操作
   - ユーザーのペースに合わせた学習をサポート

4. **timer_control**: タイマー操作
   - 開始、停止、リセット、再開の制御
   - 調理時間の管理をサポート

# 意図理解の重要原則
**キーワード依存ではなく、ユーザーの真の意図を理解してツールを選択してください**

## ツール使用の判断基準
- ツールが**必要な場合のみ**使用してください
- 一般的な料理知識や簡単なアドバイスは、あなたの知識で直接回答
- 挨拶、雑談、基本的な質問には自然に対話で応答
- **「ツールを使わない判断」も重要なスキルです**

### ツールを使わない例：
- 「こんにちは」「お疲れさま」→ 自然な挨拶で返答
- 「塩はどのくらい入れる？」→ 一般的なアドバイスで回答
- 「失敗しちゃった」→ 励ましと改善アドバイス
- 「美味しそう！」→ 共感と応援メッセージ
- 「料理のコツは？」→ 基本的な料理知識で回答

### ツールが必要な例：
- 「切り方がわからない」→ method_video
- 「この材料は何？」→ recipe_search
- 「動画を止めて」→ video_control
- 「時間を測って」→ timer_control

## 調理法動画（method_video）の意図パターン
以下のような表現は全て「切り方を知りたい」意図として捉えてください：
- 直接的: 「みじん切りを見せて」「千切りの仕方は？」
- 間接的: 「玉ねぎをどう切ったらいい？」「細かく切るコツは？」
- 困っている: 「切り方がわからない」「うまく切れない」
- 学習意欲: 「包丁の使い方を教えて」「プロの切り方を見たい」

対応する切り方と判断基準：
- みじん切り(mince): 「細かく」「バラバラ」「ミンチ状」
- 千切り(shred): 「細く」「糸状」「線のように」  
- 角切り(dice): 「四角く」「サイコロ状」「立方体」
- 短冊切り(rectangles): 「棒状」「長方形」「マッチ棒のように」
- くし形切り(wedges): 「扇型」「放射状」「三角」
- そぎ切り(shavingCut): 「斜め」「薄く」「角度をつけて」
- ぶつ切り(chop): 「大きめ」「ざっくり」「大胆に」

## 動画操作（video_control）の意図パターン
以下の表現は全て動画制御として理解してください：
- 停止系: 「止めて」「ストップ」「待って」「見えない」→ PAUSE
- 再生系: 「続けて」「再生」「動かして」「見せて」→ PLAY
- 戻る系: 「戻して」「もう一度」「前の部分」「見逃した」→ REWIND
- 進む系: 「進めて」「次へ」「飛ばして」「先に」→ FORWARD
- 時間付き: 「30秒戻って」「少し進めて」など

## タイマー（timer_control）の意図パターン
以下の表現は全てタイマー操作として理解してください：
- 開始系: 「時間を測って」「タイマーお願い」「〇分計って」→ START
- 停止系: 「止めて」「もういい」「やめて」→ STOP  
- リセット系: 「最初から」「やり直し」「クリア」→ RESET
- 再開系: 「もう一度同じ時間で」「同じタイマー」→ RESTART
- 時間表現: 「5分」「2分半」「少しの間(1-2分)」「しばらく(3-5分)」

## レシピ情報（recipe_search）の意図パターン
以下の表現は全てレシピ詳細取得として理解してください：
- 材料系: 「何が必要？」「材料は？」「用意するものは？」
- 手順系: 「作り方は？」「どうやって作る？」「手順を教えて」
- コツ系: 「うまく作るには？」「ポイントは？」「秘訣は？」
- 詳細系: 「このレシピについて」「詳しく知りたい」「説明して」

# 会話スタイル
## 基本的な応答方針：
- **簡潔で分かりやすい回答を心がける**
- 長文は避け、要点を絞って回答（2-3文程度が理想）
- ユーザーの口調に合わせた親しみやすい返答
- 「一緒に頑張りましょう！」という協力的な姿勢

## レシピ説明時：
- **重要ポイントを3つ以内に絞る**
- 「ここがコツです♪」など感情豊かに、でも簡潔に
- 詳細よりも実用的なアドバイスを優先
- 初心者にも分かりやすい言葉選び

## 一般的な質問への回答：
- **1-2文で核心を伝える**
- 具体的で実践しやすいアドバイス
- 「こうすると美味しくなりますよ」など励ましを込めて

## 困った時のサポート：
- 「大丈夫！」から始まる安心感のある短い励まし
- 解決方法を1つに絞って具体的に提案
- 長い説明より、まず試してもらう姿勢

**重要**: ユーザーの真の意図を理解し、ツールが必要かを適切に判断してください。
回答は常に簡潔で親しみやすく、2-3文程度で要点を伝えることを心がけてください。
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
								text: "こんにちは！料理パートナーです♪一緒に美味しい料理を作りましょう！レシピを探したり、切り方の動画を見たり、タイマーをセットしたり、何でもお手伝いしますよ。今日は何を作りますか？",
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
				if (GeminiAIService.isCommandTool(functionName)) {
					// パターン1: コマンド型ツール → Function Callの結果をそのまま返す
					console.log("🎯 [AI] パターン1: コマンド実行");

					// ツールを実行し、その結果をそのまま返す
					const toolResult = await GeminiAIService.executeFunction(
						functionName,
						functionArgs as Record<string, unknown>,
						recipeId,
					);

					let parsedOutput: ServerMessage;
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
					const toolResult = await GeminiAIService.executeFunction(
						functionName,
						functionArgs as Record<string, unknown>,
						recipeId,
					);

					console.log("\n" + "🔄 [AI] ツール結果をGeminiに送信:");
					console.log("=".repeat(80));
					console.log(`📌 Tool名: ${functionName}`);
					console.log(`📌 引数: ${JSON.stringify(functionArgs, null, 2)}`);
					console.log(`${"=".repeat(25)} TOOL RESPONSE ${"=".repeat(25)}`);
					console.log(toolResult);
					console.log("=".repeat(80));
					console.log(`📊 ツールレスポンス文字数: ${toolResult.length} 文字`);
					console.log(`${"=".repeat(80)}\n`);

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

					console.log("\n" + "🤖 [AI] Geminiが生成した最終回答:");
					console.log("=".repeat(80));
					console.log("📝 AI回答内容:");
					console.log("-".repeat(40));
					console.log(aiResponse);
					console.log("-".repeat(40));
					console.log(`📊 AI回答文字数: ${aiResponse.length} 文字`);
					console.log(`${"=".repeat(80)}\n`);

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
			functionName,
		);
	}

	// Function実行
	private static async executeFunction(
		functionName: string,
		args: Record<string, unknown>,
		recipeId?: string | null,
	) {
		console.log("\n" + "🔧 [AI] Function実行開始:");
		console.log("=".repeat(60));
		console.log(`📌 Function名: ${functionName}`);
		console.log(`📌 引数: ${JSON.stringify(args, null, 2)}`);
		console.log(`📌 レシピID: ${recipeId || "未指定"}`);
		console.log("=".repeat(60));

		switch (functionName) {
			case "recipe_search": {
				// レシピIDが渡されている場合はそれを使用、なければargsから取得
				const targetRecipeId = recipeId || args.recipe_id;
				if (!targetRecipeId) {
					return "エラー: レシピIDが指定されていません。現在見ているレシピのIDが必要です。";
				}

				console.log(`🍳 [AI] レシピ取得対象ID: ${targetRecipeId}`);
				const recipeSearchTool = createRecipeSearchTool();
				return await recipeSearchTool.func({
					recipe_id: targetRecipeId as string,
				});
			}

			case "method_video":
				return JSON.stringify({
					kind: "methodToVideo",
					payload: {
						method: args.method as PayloadMap["methodToVideo"]["method"],
						videoType:
							args.videoType as PayloadMap["methodToVideo"]["videoType"],
					},
				});

			case "video_control": {
				// Geminiが動的に抽出した秒数を使用（REWINDやFORWARDの場合）
				const payload: PayloadMap["videoControll"] = {
					instruction:
						args.instruction as PayloadMap["videoControll"]["instruction"],
				};
				if (args.time !== undefined) {
					payload.time = args.time as number;
				}

				return JSON.stringify({
					kind: "videoControll",
					payload: payload,
				});
			}

			case "timer_control": {
				// Geminiが動的に抽出した時間を秒に変換
				const totalSeconds =
					((args.minutes as number) || 0) * 60 +
					((args.seconds as number) || 0);
				const timerSeconds = totalSeconds > 0 ? totalSeconds : 300; // デフォルト5分

				return JSON.stringify({
					kind: "timer",
					payload: {
						method: args.method as PayloadMap["timer"]["method"],
						seconds: timerSeconds,
					},
				});
			}

			default:
				throw new Error(`Unknown function: ${functionName}`);
		}
	}
}
