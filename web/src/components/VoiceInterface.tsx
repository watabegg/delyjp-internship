"use client";

import { useEffect, useMemo, useState } from "react";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import type { TranscriptionResult, VoiceStatus } from "@/types/realtime";

interface VoiceInterfaceProps {
	onStatusChange?: (status: VoiceStatus) => void;
	onTranscript?: (result: TranscriptionResult) => void;
	onResult?: (result: string) => void;
	onError?: (error: string) => void;
}

export default function VoiceInterface({
	onStatusChange,
	onTranscript,
	onError,
}: VoiceInterfaceProps = {}) {
	const {
		status,
		isRecording,
		connect,
		disconnect,
		startRecording,
		stopRecording,
		error,
	} = useRealtimeVoice({
		onStatusChange,
		onTranscript: (result) => {
			console.log("[VOICE-INTERFACE] 転写結果:", result.transcript);
			setTranscriptHistory((prev) => [
				...prev,
				{
					timestamp: new Date().toLocaleTimeString(),
					text: result.transcript,
				},
			]);
			onTranscript?.(result);
		},
		onError,
		onMessage: (messageType, message) => {
			setRecentMessages((prev) => [
				...prev.slice(-9),
				{
					timestamp: new Date().toLocaleTimeString(),
					type: messageType,
				},
			]);
		},
	});

	const [shouldAutoStart, setShouldAutoStart] = useState(false);
	const [transcriptHistory, setTranscriptHistory] = useState<
		Array<{ timestamp: string; text: string }>
	>([]);
	const [debugLogs, setDebugLogs] = useState<
		Array<{
			timestamp: string;
			message: string;
			type: "info" | "error" | "success";
		}>
	>([]);
	const [recentMessages, setRecentMessages] = useState<
		Array<{ timestamp: string; type: string }>
	>([]);

	// デバッグログを追加する関数
	const addDebugLog = (
		message: string,
		type: "info" | "error" | "success" = "info",
	) => {
		setDebugLogs((prev) => [
			...prev.slice(-9),
			{
				timestamp: new Date().toLocaleTimeString(),
				message,
				type,
			},
		]);
	};

	// ステータス変更を監視してログに追加
	useEffect(() => {
		addDebugLog(
			`ステータス変更: ${status}`,
			status === "error"
				? "error"
				: status === "connected"
					? "success"
					: "info",
		);
	}, [status]);

	// エラーを監視してログに追加
	useEffect(() => {
		if (error) {
			addDebugLog(`エラー: ${error}`, "error");
		}
	}, [error]);

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
						: status === "processing"
							? "マイク（処理中）"
							: status === "speaking"
								? "マイク（応答再生中）"
								: status === "error"
									? "マイク（エラー）"
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
			case "processing":
				return "ring-4 ring-orange-500 animate-pulse";
			case "speaking":
				return "ring-4 ring-purple-500 animate-pulse";
			case "error":
				return "ring-4 ring-red-500";
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
			setShouldAutoStart(true);
			return;
		}

		if (
			isRecording ||
			status === "listening" ||
			status === "processing" ||
			status === "speaking"
		) {
			// 再クリックで完全停止・切断
			stopRecording();
			disconnect();
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
					{status === "processing" && "マイク（処理中）"}
					{status === "speaking" && "マイク（応答再生中）"}
					{status === "error" && "マイク（エラー）"}
				</span>
			</button>
		</>
	);
}
