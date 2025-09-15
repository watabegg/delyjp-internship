"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api/client";
import type { ServerMessage } from "@/types/express";
import type { TranscriptionResult, VoiceStatus } from "@/types/realtime";
import type { RecipeDetail } from "@/types/recipe";
import { RecipeDetailView } from "./RecipeDetailView";
import VoiceInterface from "./VoiceInterface";
import useIgnoreKonnichiwa from "@/hooks/useIgnoreKonnichiwa";

interface RecipeDetailWrapperProps {
	recipe: RecipeDetail;
}

export function RecipeDetailWrapper({ recipe }: RecipeDetailWrapperProps) {
	const [message, setMessage] = useState<ServerMessage | null>(null);

	const handleStatusChange = (status: VoiceStatus) => {
		console.log("[RECIPE-WRAPPER] 音声ステータス変更:", status);
	};

	const handleTranscript = async (result: TranscriptionResult) => {
		if (result.is_final) {
			console.log("[RECIPE-WRAPPER] 最終転写結果:", result.transcript);
			const ignoreKonnichiwa = useIgnoreKonnichiwa();
			const filteredText = ignoreKonnichiwa(result.transcript);
			try {
				const res = await apiPost(`/api/voice-command?recipe_id=${recipe.id}`, {
					speechText: filteredText,
				});
				console.log("[RECIPE-WRAPPER] API応答:", res);
				setMessage(res);
			} catch (error) {
				console.error("[RECIPE-WRAPPER] APIエラー:", error);
			}
		}
	};

	const handleError = (error: string) => {
		console.error("[RECIPE-WRAPPER] 音声エラー:", error);
	};

	return (
		<>
			{/* 既存のレシピ詳細表示 */}
			<RecipeDetailView recipe={recipe} message={message} />

			{/* 音声インターフェース */}
			<VoiceInterface
				onStatusChange={handleStatusChange}
				onTranscript={handleTranscript}
				onError={handleError}
			/>
		</>
	);
}
