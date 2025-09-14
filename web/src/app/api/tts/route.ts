// app/api/tts/route.ts
import { NextResponse } from "next/server";

// グローバル状態でテキストを管理
const getTTSQueue = () => {
	if (!(globalThis as any).ttsQueue) {
		(globalThis as any).ttsQueue = [];
	}
	return (globalThis as any).ttsQueue as string[];
};

// Postmanからテキストを受信してキューに追加
export async function POST(req: Request) {
	try {
		const { text, action } = await req.json();

		if (action === "send") {
			if (!text) {
				return NextResponse.json(
					{ error: "text is required" },
					{ status: 400 },
				);
			}

			const queue = getTTSQueue();
			queue.push(text);
			console.log(
				"TTS text queued:",
				text,
				"Queue length:",
				queue.length,
				"Full queue:",
				queue,
			);
			return NextResponse.json({
				success: true,
				message: "Text queued for TTS",
			});
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (e) {
		console.error(e);
		return NextResponse.json({ error: "Request failed" }, { status: 500 });
	}
}

// キューからテキストを取得
export async function GET() {
	const queue = getTTSQueue();
	const text = queue.shift();
	console.log(
		"TTS GET request - Retrieved text:",
		text,
		"Remaining queue length:",
		queue.length,
	);
	return NextResponse.json({ text: text || null });
}
