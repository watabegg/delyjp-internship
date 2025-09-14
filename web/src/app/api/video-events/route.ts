import { NextRequest } from "next/server";
import { registerClient, unregisterClient } from "@/lib/video-events";

export async function GET(request: NextRequest) {
  console.log("[SSE API] GET リクエスト受信");
  
  const { searchParams } = new URL(request.url);
  const recipeId = searchParams.get("recipeId");

  console.log(`[SSE API] recipeId: ${recipeId}`);

  if (!recipeId) {
    console.error("[SSE API] recipeId が提供されていません");
    return new Response("recipeId is required", { status: 400 });
  }

  // Server-Sent Events のストリームを作成
  const stream = new ReadableStream({
    start(controller) {
      try {
        console.log(`[SSE API] ストリーム開始: ${recipeId}`);
        
        // クライアントを登録
        registerClient(recipeId, controller);

        // 接続確認メッセージ
        const message = `data: ${JSON.stringify({
          type: "connected",
          recipeId,
          timestamp: new Date().toISOString()
        })}\n\n`;
        
        controller.enqueue(message);
        console.log(`[SSE API] 接続確認メッセージ送信: ${recipeId}`);
      } catch (error) {
        console.error("[SSE API] ストリーム開始エラー:", error);
      }
    },
    cancel() {
      try {
        // クライアント切断時にクリーンアップ
        unregisterClient(recipeId);
        console.log(`[SSE API] クライアント切断: ${recipeId}`);
      } catch (error) {
        console.error("[SSE API] クリーンアップエラー:", error);
      }
    },
  });

  console.log(`[SSE API] レスポンス返却: ${recipeId}`);

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