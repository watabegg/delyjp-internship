import { NextResponse } from "next/server";
import { sendTTSEvent } from "@/lib/tts-events";

export async function POST(request: Request) {
	try {
		const { recipeId, text, senderId } = (await request.json()) as {
			recipeId?: string;
			text?: string;
			senderId?: string;
		};
		if (!recipeId || !text) {
			return NextResponse.json(
				{ success: false, error: "recipeId and text are required" },
				{ status: 400 },
			);
		}
		const ok = sendTTSEvent(recipeId, { type: "tts", text, senderId });
		return NextResponse.json({ success: ok });
	} catch (_e) {
		return NextResponse.json(
			{ success: false, error: "internal" },
			{ status: 500 },
		);
	}
}
