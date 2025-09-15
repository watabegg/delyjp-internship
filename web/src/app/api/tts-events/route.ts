import type { NextRequest } from "next/server";
import { registerTTSClient, unregisterTTSClient } from "@/lib/tts-events";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const recipeId = searchParams.get("recipeId");
	if (!recipeId) return new Response("recipeId is required", { status: 400 });

	let controllerRef: ReadableStreamDefaultController | undefined;
	const stream = new ReadableStream({
		start(controller) {
			controllerRef = controller;
			registerTTSClient(recipeId, controller);
			controller.enqueue(
				`data: ${JSON.stringify({ type: "connected", recipeId, ts: Date.now() })}\n\n`,
			);
		},
		cancel() {
			unregisterTTSClient(recipeId, controllerRef);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"Access-Control-Allow-Origin": "*",
		},
	});
}
