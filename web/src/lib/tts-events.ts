declare global {
	// eslint-disable-next-line no-var
	var ttsClients: Map<string, Set<ReadableStreamDefaultController>> | undefined;
}

const clients =
	globalThis.ttsClients ||
	(() => {
		globalThis.ttsClients = new Map<
			string,
			Set<ReadableStreamDefaultController>
		>();
		return globalThis.ttsClients;
	})();

export function registerTTSClient(
	channelKey: string,
	controller: ReadableStreamDefaultController,
) {
	const set =
		clients.get(channelKey) ?? new Set<ReadableStreamDefaultController>();
	set.add(controller);
	clients.set(channelKey, set);
}

export function unregisterTTSClient(
	channelKey: string,
	controller?: ReadableStreamDefaultController,
) {
	if (!clients.has(channelKey)) return;
	if (controller) {
		const set = clients.get(channelKey)!;
		set.delete(controller);
		if (set.size === 0) clients.delete(channelKey);
	} else {
		clients.delete(channelKey);
	}
}

export function sendTTSEvent(
	channelKey: string,
	event: {
		type: "tts";
		text: string;
		senderId?: string;
		timestamp?: string;
	},
) {
	const set = clients.get(channelKey);
	if (!set || set.size === 0) return false;

	const payload = {
		...event,
		timestamp: event.timestamp ?? new Date().toISOString(),
	};
	const message = `data: ${JSON.stringify(payload)}\n\n`;

	let ok = false;
	for (const c of set) {
		try {
			c.enqueue(message);
			ok = true;
		} catch (_e) {
			set.delete(c);
		}
	}
	if (set.size === 0) clients.delete(channelKey);
	return ok;
}
