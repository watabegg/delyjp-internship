"use client";

import { useEffect, useMemo, useState } from "react";
import type { VoiceStatus } from "@/hooks/useVoiceSession";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import type { ServerMessage } from "@/types/express";

interface VoiceInterfaceProps {
	onStatusChange?: (status: VoiceStatus) => void;
	onTranscript?: (transcript: string) => void;
	onResponse?: (response: ServerMessage) => void;
}

export default function VoiceInterface({
	onStatusChange,
	onTranscript,
	onResponse,
}: VoiceInterfaceProps = {}) {
	const { status, isRecording, connect, startRecording, stopRecording } =
		useVoiceSession({
			onStatusChange,
			onTranscript,
			onResponse,
		});

	const [shouldAutoStart, setShouldAutoStart] = useState(false);

	const svgLabel =
		status === "disconnected"
			? "マイク（未接続）"
			: status === "connecting"
				? "マイク（接続中）"
				: status === "connected"
					? isRecording
						? "マイク（録音中）"
						: "マイク（待機中）"
					: status === "listening"
						? "マイク（聞き取り中）"
						: status === "speaking"
							? "マイク（応答再生中）"
							: "マイク";

	useEffect(() => {
		if (status === "connected" && shouldAutoStart) {
			startRecording();
			setShouldAutoStart(false);
		}
	}, [status, shouldAutoStart, startRecording]);

	const ringClass = useMemo(() => {
		switch (status) {
			case "connecting":
				return "ring-4 ring-yellow-500 animate-pulse";
			case "connected":
				return "ring-4 ring-green-500";
			case "listening":
				return "ring-4 ring-blue-500 animate-pulse";
			case "speaking":
				return "ring-4 ring-purple-500 animate-pulse";
			default:
				return "ring-4 ring-gray-400";
		}
	}, [status]);

	const bgClass = useMemo(() => {
		if (isRecording || status === "listening")
			return "bg-red-500 hover:bg-red-600";
		return "bg-indigo-600 hover:bg-indigo-700";
	}, [isRecording, status]);

	const handleMicClick = () => {
		if (status === "disconnected") {
			setShouldAutoStart(true);
			connect();
			return;
		}

		if (status === "connecting") {
			// 接続待ち。接続完了時に自動で録音開始
			setShouldAutoStart(true);
			return;
		}

		if (isRecording || status === "listening" || status === "speaking") {
			// 再クリックで停止
			stopRecording();
			return;
		}

		// 接続済み（待機中）なら録音開始
		if (status === "connected") {
			startRecording();
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={handleMicClick}
				aria-label="音声アシスタント"
				className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${ringClass} ${bgClass} 
					text-white w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition active:scale-95 focus:outline-none`}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					className="w-8 h-8"
					role="img"
					aria-label={svgLabel}
				>
					<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21H9v2h6v-2h-2v-3.08A7 7 0 0 0 19 11h-2Z" />
				</svg>

				<span className="sr-only">
					{status === "disconnected" && "未接続。クリックで接続して録音開始"}
					{status === "connected" &&
						(isRecording ? "マイク（録音中）" : "マイク（待機中）")}
					{status === "listening" && "マイク（聞き取り中）"}
					{status === "speaking" && "マイク（応答再生中）"}
				</span>
			</button>
			{/* 任意: デバッグ用のステータス小ラベル */}
			{/* <div className="fixed bottom-28 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded shadow">{status}</div> */}
		</>
	);
}
