import { NextRequest, NextResponse } from "next/server";
import { GeminiAIService } from "@/lib/gemini-ai-service";

// API Route Handler
export async function POST(req: NextRequest) {
  try {
    console.log("🔥 [API] 音声コマンド受信");

    const { speechText } = await req.json();

    if (!speechText || typeof speechText !== "string") {
      return NextResponse.json(
        {
          type: "generate_text_response",
          payload: {
            message: "音声テキストが必要です。",
          },
        },
        { status: 400 }
      );
    }

    console.log(`🎤 [API] 音声テキスト: "${speechText}"`);

    // Geminiエージェントで3パターンを処理
    const agentResult = await GeminiAIService.processWithLangChainAgent(
      speechText
    );

    console.log(`🎯 [API] パターン${agentResult.pattern}で処理完了`);
    console.log(`📤 [API] レスポンス:`, agentResult.response);

    return NextResponse.json(agentResult.response);
  } catch (error) {
    console.error("🚨 [API] 処理エラー:", error);

    return NextResponse.json(
      {
        type: "generate_text_response",
        payload: {
          message: "申し訳ありません。エラーが発生しました。",
        },
      },
      { status: 500 }
    );
  }
}
