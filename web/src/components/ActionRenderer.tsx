"use client";

import { useEffect, useState } from "react";
import { useTTS } from "@/contexts/TTSContext";
import { useVideoControl } from "@/contexts/VideoControlContext";
// import { apiPost } from "@/lib/api/client";
// import { LOCAL_API } from "@/lib/constants";
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
	const { dispatch } = useVideoControl();
	const { speak } = useTTS();

	useEffect(() => {
		if (isMessageKind(message, "timer")) {
			const { method, seconds } = message.payload;
			if (method === "START") setUi({ type: "timer", seconds });
			if (method === "STOP")
				setUi((prev) => (prev?.type === "timer" ? null : prev));
			if (method === "CLOSE")
				setUi((prev) => (prev?.type === "timer" ? null : prev));
			return;
		}

		if (isMessageKind(message, "methodToVideo")) {
			const { method, videoType } = message.payload;
			if (method === "START") setUi({ type: "instruction", method: videoType });
			if (method === "STOP")
				setUi((prev) => (prev?.type === "instruction" ? null : prev));
			if (method === "CLOSE")
				setUi((prev) => (prev?.type === "instruction" ? null : prev));
			return;
		}

		if (isMessageKind(message, "videoControll")) {
			const { instruction, time } = message.payload;
			void dispatch(recipeId, { instruction, time }, { broadcast: false });
			return;
		}

		if (isMessageKind(message, "withTalkUser")) {
			const { talkMessage } = message.payload;
			void speak(talkMessage, { broadcast: false });
			return;
		}

		if (isMessageKind(message, "error")) {
			const { message: errorMessage } = message.payload;
			console.error("[ActionRenderer] error received:", errorMessage);
			return;
		}
	}, [message, recipeId, dispatch, speak]);

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
