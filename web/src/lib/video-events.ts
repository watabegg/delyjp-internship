// ビデオ制御イベント管理

// Hot Reload耐性のあるグローバルなイベントストリーム管理
declare global {
	var videoClients:
		| Map<string, Set<ReadableStreamDefaultController>>
		| undefined;
}

const clients =
	globalThis.videoClients ||
	(() => {
		globalThis.videoClients = new Map<
			string,
			Set<ReadableStreamDefaultController>
		>();
		return globalThis.videoClients;
	})();

// クライアントを登録
export function registerClient(
	recipeId: string,
	controller: ReadableStreamDefaultController,
) {
	console.log(`[SSE LIB] クライアント登録: ${recipeId}`);
	const set =
		clients.get(recipeId) ?? new Set<ReadableStreamDefaultController>();
	set.add(controller);
	clients.set(recipeId, set);
	console.log(`[SSE LIB] 現在のクライアント数(recipeId単位): ${set.size}`);
}

// クライアントを削除
export function unregisterClient(
	recipeId: string,
	controller?: ReadableStreamDefaultController,
) {
	if (!clients.has(recipeId)) return;
	if (controller) {
		const set = clients.get(recipeId);
		if (!set) return;
		set.delete(controller);
		if (set.size === 0) clients.delete(recipeId);
	} else {
		clients.delete(recipeId);
	}
}

// ビデオ制御イベントを特定のクライアントに送信する関数
export function sendVideoControlEvent(
	recipeId: string,
	event: {
		instruction: string;
		time?: number;
		message: string;
	},
) {
	const set = clients.get(recipeId);
	if (!set || set.size === 0) {
		console.warn(`[SSE] クライアント未登録: ${recipeId}`);
		return false;
	}

	const eventData = {
		type: "video-control" as const,
		recipeId,
		...event,
		timestamp: new Date().toISOString(),
	};
	const message = `data: ${JSON.stringify(eventData)}\n\n`;

	let success = false;
	for (const controller of set) {
		try {
			controller.enqueue(message);
			success = true;
		} catch (error) {
			console.error(`[SSE] イベント送信エラー: ${error}`);
			set.delete(controller);
		}
	}
	if (set.size === 0) clients.delete(recipeId);
	return success;
}
