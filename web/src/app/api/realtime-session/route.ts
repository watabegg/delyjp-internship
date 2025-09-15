import { NextRequest, NextResponse } from "next/server";

// エフェメラルキー生成用のAPIエンドポイント
export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.error("[REALTIME-SESSION] OpenAI API Key が見つかりません");
            return NextResponse.json(
                { error: "OpenAI API Key が設定されていません" },
                { status: 503 }
            );
        }

        console.log("[REALTIME-SESSION] エフェメラルキー生成開始");

        // OpenAI APIにエフェメラルキーをリクエスト
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-12-17",
                voice: "shimmer",
                instructions: "あなたは日本語で話すアシスタントです。ユーザーは日本語で話しかけます。日本語で文字起こししてください",
                modalities: ["audio", "text"],
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                    model: "whisper-1",
                    language: "ja"
                },
                turn_detection: {
                    type: "server_vad"
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[REALTIME-SESSION] OpenAI API エラー:", response.status, errorText);
            return NextResponse.json(
                { error: "エフェメラルキー生成に失敗しました", details: errorText },
                { status: response.status }
            );
        }

        const sessionData = await response.json();
        console.log("[REALTIME-SESSION] エフェメラルキー生成成功:", {
            id: sessionData.id,
            expires_at: sessionData.expires_at
        });

        return NextResponse.json({
            success: true,
            session: sessionData
        });

    } catch (error) {
        console.error("[REALTIME-SESSION] エラー:", error);
        return NextResponse.json(
            { error: "内部サーバーエラー", details: error instanceof Error ? error.message : "不明なエラー" },
            { status: 500 }
        );
    }
}
