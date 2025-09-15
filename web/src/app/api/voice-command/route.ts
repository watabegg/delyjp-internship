import { type NextRequest, NextResponse } from "next/server";
import { GeminiAIService } from "@/lib/gemini-ai-service";

// API Route Handler
export async function POST(req: NextRequest) {
	try {
		console.log("🔥 [API] 音声コマンド受信");

		const { searchParams } = new URL(req.url);
		const recipeId = searchParams.get("recipe_id");
		const { speechText } = await req.json();

		if (!speechText || typeof speechText !== "string") {
			return NextResponse.json(
				{
					kind: "error",
					payload: {
						message: "音声テキストが必要です。",
					},
				},
				{ status: 400 },
			);
		}

		console.log(`🎤 [API] 音声テキスト: "${speechText}"`);
		console.log(`🆔 [API] 現在のレシピID: ${recipeId || "未指定"}`);

		// Geminiエージェントで3パターンを処理（レシピIDを渡す）
		const agentResult = await GeminiAIService.processWithLangChainAgent(
			speechText,
			recipeId,
		);

		console.log(`🎯 [API] パターン${agentResult.pattern}で処理完了`);
		console.log(`📤 [API] レスポンス:`, agentResult.response);

		return NextResponse.json(agentResult.response);
	} catch (error) {
		console.error("🚨 [API] 処理エラー:", error);

		return NextResponse.json(
			{
				kind: "error",
				payload: {
					message: "申し訳ありません。エラーが発生しました。",
				},
			},
			{ status: 500 },
		);
	}
}
