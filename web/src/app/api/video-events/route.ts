import { NextRequest } from "next/server";

// グローバルなイベントストリーム管理
const clients = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recipeId = searchParams.get("recipeId");

  if (!recipeId) {
    return new Response("recipeId is required", { status: 400 });
  }

  // Server-Sent Events のストリームを作成
  const stream = new ReadableStream({
    start(controller) {
      // クライアントを登録
      clients.set(recipeId, controller);

      // 接続確認メッセージ
      controller.enqueue(`data: ${JSON.stringify({
        type: "connected",
        recipeId,
        timestamp: new Date().toISOString()
      })}\n\n`);

      console.log(`[SSE] クライアント接続: ${recipeId}`);
    },
    cancel() {
      // クライアント切断時にクリーンアップ
      clients.delete(recipeId);
      console.log(`[SSE] クライアント切断: ${recipeId}`);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// ビデオ制御イベントを特定のクライアントに送信する関数
export function sendVideoControlEvent(recipeId: string, event: {
  instruction: string;
  time?: number;
  message: string;
}) {
  const controller = clients.get(recipeId);
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        type: "video-control",
        recipeId,
        ...event,
        timestamp: new Date().toISOString()
      })}\n\n`);
      
      console.log(`[SSE] イベント送信: ${recipeId} - ${event.instruction}`);
      return true;
    } catch (error) {
      console.error(`[SSE] イベント送信エラー: ${error}`);
      clients.delete(recipeId);
      return false;
    }
  }
  return false;
}
