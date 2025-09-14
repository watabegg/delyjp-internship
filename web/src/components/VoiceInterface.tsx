"use client";

import { useState } from "react";
import { useVoiceSession } from "@/hooks/useVoiceSession";

interface VoiceInterfaceProps {
	onStatusChange?: (
		status:
			| "disconnected"
			| "connecting"
			| "connected"
			| "speaking"
			| "listening",
	) => void;
	onTranscript?: (transcript: string) => void;
	onResponse?: (response: string) => void;
}

export default function VoiceInterface({
	onStatusChange,
	onTranscript,
	onResponse,
}: VoiceInterfaceProps = {}) {
	const {
		status,
		isRecording,
		transcript,
		response,
		connect,
		startRecording,
		stopRecording,
	} = useVoiceSession({
		onStatusChange,
		onTranscript,
		onResponse,
	});

	return (
		<div className="voice-interface p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
			<h2 className="text-2xl font-bold text-center mb-6">音声アシスタント</h2>

			<div className="status-display mb-4 text-center">
				<div
					className={`status-indicator w-4 h-4 rounded-full mx-auto mb-2 ${
						status === "connected"
							? "bg-green-500"
							: status === "connecting"
								? "bg-yellow-500"
								: status === "listening"
									? "bg-blue-500 animate-pulse"
									: status === "speaking"
										? "bg-purple-500 animate-pulse"
										: "bg-red-500"
					}`}
				/>
				<p className="text-sm text-gray-600">
					{status === "disconnected" && "未接続"}
					{status === "connecting" && "接続中..."}
					{status === "connected" && "待機中"}
					{status === "listening" && "聞いています..."}
					{status === "speaking" && "応答中..."}
				</p>
			</div>

			{status === "disconnected" && (
				<button
					onClick={connect}
					className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
				>
					接続する
				</button>
			)}

			{status !== "disconnected" && status !== "connecting" && (
				<button
					onClick={isRecording ? stopRecording : startRecording}
					disabled={status === "speaking"}
					className={`w-full py-3 px-6 rounded-full text-white font-medium ${
						isRecording
							? "bg-red-500 hover:bg-red-600"
							: "bg-green-500 hover:bg-green-600"
					} ${status === "speaking" ? "opacity-50 cursor-not-allowed" : ""}`}
				>
					{isRecording ? "録音停止" : "話しかける"}
				</button>
			)}

			{transcript && (
				<div className="transcript mt-4 p-3 bg-gray-100 rounded">
					<h4 className="font-medium text-sm text-gray-700 mb-1">あなた:</h4>
					<p className="text-sm">{transcript}</p>
				</div>
			)}

			{response && (
				<div className="response mt-4 p-3 bg-blue-50 rounded">
					<h4 className="font-medium text-sm text-blue-700 mb-1">
						アシスタント:
					</h4>
					<p className="text-sm">{response}</p>
				</div>
			)}

			<div className="examples mt-6 text-xs text-gray-500">
				<h4 className="font-medium mb-2">使用例:</h4>
				<ul className="space-y-1">
					<li>• "カレーの作り方を教えて"</li>
					<li>• "動画を見せて"</li>
					<li>• "タイマーを5分で設定して"</li>
					<li>• "動画を一時停止して"</li>
				</ul>
			</div>
		</div>
	);
}
