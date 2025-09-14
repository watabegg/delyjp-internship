// ビデオ制御イベント管理

// Hot Reload耐性のあるグローバルなイベントストリーム管理
declare global {
	var videoClients: Map<string, ReadableStreamDefaultController> | undefined;
}

const clients =
	globalThis.videoClients ||
	(() => {
		globalThis.videoClients = new Map<
			string,
			ReadableStreamDefaultController
		>();
		return globalThis.videoClients;
	})();

// クライアントを登録
export function registerClient(
	recipeId: string,
	controller: ReadableStreamDefaultController,
) {
	console.log(`[SSE LIB] クライアント登録: ${recipeId}`);
	console.log(`[SSE LIB] 登録前のクライアント数: ${clients.size}`);
	clients.set(recipeId, controller);
	console.log(`[SSE LIB] 登録後のクライアント数: ${clients.size}`);
	console.log(
		`[SSE LIB] 登録されたクライアントIDs:`,
		Array.from(clients.keys()),
	);
}

// クライアントを削除
export function unregisterClient(recipeId: string) {
	clients.delete(recipeId);
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
	console.log(`[SSE] sendVideoControlEvent呼び出し: ${recipeId}`);
	console.log(`[SSE] 登録されているクライアント数: ${clients.size}`);
	console.log(
		`[SSE] 登録されているクライアントIDs:`,
		Array.from(clients.keys()),
	);

	const controller = clients.get(recipeId);
	console.log(`[SSE] 対象クライアント見つかった: ${!!controller}`);

	if (controller) {
		try {
			const eventData = {
				type: "video-control",
				recipeId,
				...event,
				timestamp: new Date().toISOString(),
			};
			const message = `data: ${JSON.stringify(eventData)}\n\n`;

			console.log(`[SSE] 送信データ:`, eventData);
			controller.enqueue(message);

			console.log(`[SSE] イベント送信成功: ${recipeId} - ${event.instruction}`);
			return true;
		} catch (error) {
			console.error(`[SSE] イベント送信エラー: ${error}`);
			clients.delete(recipeId);
			return false;
		}
	} else {
		console.warn(`[SSE] クライアント未登録: ${recipeId}`);
		return false;
	}
}
