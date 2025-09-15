import type { NextRequest } from "next/server";
import { registerClient, unregisterClient } from "@/lib/video-events";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const recipeId = searchParams.get("recipeId");

	if (!recipeId) {
		console.error("[SSE API] recipeId が提供されていません");
		return new Response("recipeId is required", { status: 400 });
	}

	// Server-Sent Events のストリームを作成
	let controllerRef: ReadableStreamDefaultController | undefined;
	const stream = new ReadableStream({
		start(controller) {
			try {
				controllerRef = controller;

				// クライアントを登録
				registerClient(recipeId, controller);

				// 接続確認メッセージ
				const message = `data: ${JSON.stringify({
					type: "connected",
					recipeId,
					timestamp: new Date().toISOString(),
				})}\n\n`;

				controller.enqueue(message);
			} catch (error) {
				console.error("[SSE API] ストリーム開始エラー:", error);
			}
		},
		cancel() {
			try {
				// クライアント切断時にクリーンアップ
				unregisterClient(recipeId, controllerRef);
			} catch (error) {
				console.error("[SSE API] クリーンアップエラー:", error);
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
