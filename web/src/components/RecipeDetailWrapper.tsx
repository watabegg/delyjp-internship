"use client";

import type { TranscriptionResult, VoiceStatus } from "@/types/realtime";
import type { RecipeDetail } from "@/types/recipe";
import { RecipeDetailView } from "./RecipeDetailView";
import VoiceInterface from "./VoiceInterface";

interface RecipeDetailWrapperProps {
	recipe: RecipeDetail;
}

export function RecipeDetailWrapper({ recipe }: RecipeDetailWrapperProps) {
	const handleStatusChange = (status: VoiceStatus) => {
		console.log("[RECIPE-WRAPPER] 音声ステータス変更:", status);
	};

	const handleTranscript = (result: TranscriptionResult) => {
		console.log("[RECIPE-WRAPPER] 転写結果受信:", result);
		// ここで転写結果をエージェントに送信したり、他の処理を行う
	};

	const handleError = (error: string) => {
		console.error("[RECIPE-WRAPPER] 音声エラー:", error);
	};

	return (
		<>
			{/* 既存のレシピ詳細表示 */}
			<RecipeDetailView recipe={recipe} message={null} />

			{/* 音声インターフェース */}
			<VoiceInterface
				onStatusChange={handleStatusChange}
				onTranscript={handleTranscript}
				onError={handleError}
			/>
		</>
	);
}
