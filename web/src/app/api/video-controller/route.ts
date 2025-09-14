import { NextRequest, NextResponse } from "next/server";
import { sendVideoControlEvent } from "@/lib/video-events";

interface VideoControlRequest {
  instruction: "PLAY" | "PAUSE" | "REWIND" | "FORWARD";
  time?: number;
  recipeId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoControlRequest = await request.json();
    const { instruction, time, recipeId } = body;

    // バリデーション
    if (!instruction || !recipeId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "instruction と recipeId は必須です",
          error: "MISSING_REQUIRED_FIELDS"
        },
        { status: 400 }
      );
    }

    // instruction の値をチェック
    const validInstructions = ["PLAY", "PAUSE", "REWIND", "FORWARD"];
    if (!validInstructions.includes(instruction)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `無効な instruction です。有効な値: ${validInstructions.join(", ")}`,
          error: "INVALID_INSTRUCTION"
        },
        { status: 400 }
      );
    }

    // timeのバリデーション（REWINDとFORWARDの場合）
    if ((instruction === "REWIND" || instruction === "FORWARD") && time && time <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "timeは正の数である必要があります",
          error: "INVALID_TIME"
        },
        { status: 400 }
      );
    }
    
    // 成功レスポンスを生成
    let message = "";
    const actualTime = time || 10; // デフォルト10秒
    
    switch (instruction) {
      case "PLAY":
        message = "再生を開始しました";
        break;
      case "PAUSE":
        message = "停止しました";
        break;
      case "REWIND":
        message = `${actualTime}秒戻しました`;
        break;
      case "FORWARD":
        message = `${actualTime}秒進めました`;
        break;
    }

    // ログ出力（開発時のデバッグ用）
    console.log(`[VIDEO_CONTROL] ${new Date().toISOString()} - Recipe: ${recipeId}, Action: ${instruction}${time ? `, Time: ${time}秒` : ""}`);

    // Server-Sent Events でクライアントにビデオ制御イベントを送信
    console.log(`[VIDEO_CONTROL] SSEイベント送信開始: ${recipeId}`);
    const eventSent = sendVideoControlEvent(recipeId, {
      instruction,
      time: actualTime,
      message,
    });
    console.log(`[VIDEO_CONTROL] SSEイベント送信結果: ${eventSent}`);

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message,
      data: {
        instruction,
        time: actualTime,
        recipeId,
        timestamp: new Date().toISOString(),
        eventSent, // SSEでイベントが送信されたかどうか
      }
    });

  } catch (error) {
    console.error("ビデオ制御エラー:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: `ビデオ制御の実行に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
        error: "INTERNAL_SERVER_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET エンドポイント - API仕様確認用
export async function GET() {
  return NextResponse.json({
    name: "Video Controller API",
    version: "1.0.0",
    description: "レシピ動画の制御API",
    endpoints: {
      POST: {
        path: "/api/video-controller",
        description: "ビデオ制御コマンドを実行",
        requestBody: {
          instruction: "PLAY | PAUSE | REWIND | FORWARD (必須)",
          time: "number (REWINDとFORWARDで使用、デフォルト10秒)",
          recipeId: "string (必須)"
        },
        responses: {
          200: {
            success: true,
            message: "string",
            data: {
              instruction: "string",
              time: "number",
              recipeId: "string", 
              timestamp: "ISO string"
            }
          },
          400: {
            success: false,
            message: "string",
            error: "ERROR_CODE"
          }
        }
      }
    },
    examples: [
      {
        description: "再生",
        request: { instruction: "PLAY", recipeId: "recipe-123" }
      },
      {
        description: "10秒巻き戻し",
        request: { instruction: "REWIND", time: 10, recipeId: "recipe-123" }
      }
    ]
  });
}
