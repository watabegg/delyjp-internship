"use client";

import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api/client";
import { LOCAL_API } from "@/lib/constants";
import type { ServerMessage } from "@/types/express";
import { type CuttingMethodKey, isMessageKind } from "@/types/express";
import InstructionDialog from "./InstructionDialog";
import TimerDialog from "./TimerDialog";

export default function ActionRenderer({
	message,
	recipeId,
}: {
	message: ServerMessage;
	recipeId: string;
}) {
	// ローカルUI状態を保持して、onCloseで確実に閉じられるようにする
	const [ui, setUi] = useState<
		| { type: "timer"; seconds: number }
		| { type: "instruction"; method: CuttingMethodKey }
		| null
	>(null);

	// メッセージを観測し、START/STOPに応じてUIを開閉
	useEffect(() => {
		if (isMessageKind(message, "timer")) {
			const { method, seconds } = message.payload;
			if (method === "START") setUi({ type: "timer", seconds });
			if (method === "STOP")
				setUi((prev) => (prev?.type === "timer" ? null : prev));
			return;
		}

		if (isMessageKind(message, "methodToVideo")) {
			const { method, videoType } = message.payload;
			if (method === "START") setUi({ type: "instruction", method: videoType });
			if (method === "STOP")
				setUi((prev) => (prev?.type === "instruction" ? null : prev));
			return;
		}

		if (isMessageKind(message, "videoControll")) {
			const { instruction, time } = message.payload;
			void apiPost(LOCAL_API.videos.control, { instruction, time, recipeId });
			return;
		}

		if (isMessageKind(message, "error")) {
			const { message: errorMessage } = message.payload;
			console.error("[ActionRenderer] error received:", errorMessage);
			return;
		}
	}, [message, recipeId]);

	if (ui?.type === "timer") {
		return (
			<TimerDialog open onClose={() => setUi(null)} seconds={ui.seconds} />
		);
	}

	if (ui?.type === "instruction") {
		return (
			<InstructionDialog open onClose={() => setUi(null)} method={ui.method} />
		);
	}

	return null;
}
