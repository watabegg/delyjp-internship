"use client";

import { useEffect, useMemo, useState } from "react";
import type { VoiceStatus, TranscriptionResult } from "@/types/realtime";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";

interface VoiceInterfaceProps {
	onStatusChange?: (status: VoiceStatus) => void;
	onTranscript?: (result: TranscriptionResult) => void;
	onError?: (error: string) => void;
}

export default function VoiceInterface({
	onStatusChange,
	onTranscript,
	onError,
}: VoiceInterfaceProps = {}) {
	const { status, isRecording, connect, disconnect, startRecording, stopRecording, error } =
		useRealtimeVoice({
			onStatusChange,
			onTranscript: (result) => {
				console.log("[VOICE-INTERFACE] 転写結果:", result.transcript);
				setTranscriptHistory(prev => [...prev, { 
					timestamp: new Date().toLocaleTimeString(), 
					text: result.transcript 
				}]);
				onTranscript?.(result);
			},
			onError,
			onMessage: (messageType, message) => {
				setRecentMessages(prev => [...prev.slice(-9), {
					timestamp: new Date().toLocaleTimeString(),
					type: messageType
				}]);
			},
		});

	const [shouldAutoStart, setShouldAutoStart] = useState(false);
	const [transcriptHistory, setTranscriptHistory] = useState<Array<{timestamp: string, text: string}>>([]);
	const [debugLogs, setDebugLogs] = useState<Array<{timestamp: string, message: string, type: 'info' | 'error' | 'success'}>>([]);
	const [recentMessages, setRecentMessages] = useState<Array<{timestamp: string, type: string}>>([]);

	// デバッグログを追加する関数
	const addDebugLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
		setDebugLogs(prev => [...prev.slice(-9), { 
			timestamp: new Date().toLocaleTimeString(), 
			message, 
			type 
		}]);
	};

	// ステータス変更を監視してログに追加
	useEffect(() => {
		addDebugLog(`ステータス変更: ${status}`, status === 'error' ? 'error' : status === 'connected' ? 'success' : 'info');
	}, [status]);

	// エラーを監視してログに追加
	useEffect(() => {
		if (error) {
			addDebugLog(`エラー: ${error}`, 'error');
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
			addDebugLog("接続開始...", 'info');
			setShouldAutoStart(true);
			connect();
			return;
		}

		if (status === "connecting") {
			// 接続待ち。接続完了時に自動で録音開始
			addDebugLog("接続完了後に録音開始予定", 'info');
			setShouldAutoStart(true);
			return;
		}

		if (isRecording || status === "listening" || status === "processing" || status === "speaking") {
			// 再クリックで完全停止・切断
			addDebugLog("録音停止・完全切断", 'info');
			stopRecording();
			disconnect();
			return;
		}

		// 接続済み（待機中）なら録音開始
		if (status === "connected") {
			addDebugLog("録音開始", 'success');
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
			{/* デバッグパネル */}
			<div className="fixed top-4 right-4 w-96 max-h-96 bg-black/90 text-white p-4 rounded-lg text-xs font-mono overflow-hidden">
				{/* ステータス表示 */}
				<div className="mb-3 p-2 bg-gray-800 rounded">
					<div className="flex items-center gap-2 mb-1">
						<div className={`w-3 h-3 rounded-full ${
							status === 'connected' ? 'bg-green-400' : 
							status === 'error' ? 'bg-red-400' :
							status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
							status === 'listening' ? 'bg-blue-400 animate-pulse' :
							status === 'processing' ? 'bg-orange-400 animate-pulse' :
							'bg-gray-400'
						}`}></div>
						<span className="font-bold">ステータス: {status}</span>
					</div>
					{isRecording && <div className="text-red-400">🔴 録音中</div>}
					{error && <div className="text-red-400 mt-1">❌ {error}</div>}
				</div>

				{/* 転写履歴 */}
				<div className="mb-3">
					<div className="text-green-400 font-bold mb-1">📝 転写履歴:</div>
					<div className="bg-gray-800 rounded p-2 max-h-24 overflow-y-auto">
						{transcriptHistory.length === 0 ? (
							<div className="text-gray-500">まだ転写結果がありません</div>
						) : (
							transcriptHistory.map((item, index) => (
								<div key={index} className="mb-1">
									<span className="text-gray-400">[{item.timestamp}]</span>
									<span className="ml-2 text-white">{item.text}</span>
								</div>
							))
						)}
					</div>
				</div>

				{/* デバッグログ */}
				<div>
					<div className="text-blue-400 font-bold mb-1">🔧 デバッグログ:</div>
					<div className="bg-gray-800 rounded p-2 max-h-32 overflow-y-auto">
						{debugLogs.map((log, index) => (
							<div key={index} className={`mb-1 ${
								log.type === 'error' ? 'text-red-400' :
								log.type === 'success' ? 'text-green-400' :
								'text-gray-300'
							}`}>
								<span className="text-gray-500">[{log.timestamp}]</span>
								<span className="ml-2">{log.message}</span>
							</div>
						))}
						{debugLogs.length === 0 && (
							<div className="text-gray-500">ログがありません</div>
						)}
					</div>
				</div>

				{/* メッセージタイプ履歴 */}
				<div className="mt-3">
					<div className="text-purple-400 font-bold mb-1">📡 受信メッセージ:</div>
					<div className="bg-gray-800 rounded p-2 max-h-24 overflow-y-auto">
						{recentMessages.map((msg, index) => (
							<div key={index} className="mb-1 text-xs">
								<span className="text-gray-500">[{msg.timestamp}]</span>
								<span className="ml-2 text-purple-300">{msg.type}</span>
							</div>
						))}
						{recentMessages.length === 0 && (
							<div className="text-gray-500">メッセージなし</div>
						)}
					</div>
				</div>

				{/* クリアボタン */}
				<div className="mt-3 flex gap-2">
					<button 
						onClick={() => setTranscriptHistory([])}
						className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
					>
						転写クリア
					</button>
					<button 
						onClick={() => setDebugLogs([])}
						className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
					>
						ログクリア
					</button>
					<button 
						onClick={() => setRecentMessages([])}
						className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
					>
						メッセージクリア
					</button>
				</div>
			</div>
		</>
	);
}
