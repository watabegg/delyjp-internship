"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useRecorder } from "@/hooks/useRecorder";
import type { ServerMessage } from "@/types/express";

export type VoiceStatus =
	| "disconnected"
	| "connecting"
	| "connected"
	| "speaking"
	| "listening";

/**
 * Voice Interface のロジックを集約したフック
 * - Socket 接続管理
 * - 録音(PCM16 24kHz)の送出
 * - 受信音声の再生
 */
export function useVoiceSession(opts?: {
	onStatusChange?: (s: VoiceStatus) => void;
	onTranscript?: (t: string) => void;
	onResponse?: (t: ServerMessage) => void;
}) {
	const { onStatusChange, onTranscript, onResponse } = opts || {};
	const [status, setStatus] = useState<VoiceStatus>("disconnected");
	const [transcript, setTranscript] = useState("");
	const [response, setResponse] = useState("");
	const socketRef = useRef<Socket | null>(null);
	const { enqueue } = useAudioPlayer();

	const setS = (s: VoiceStatus) => {
		setStatus(s);
		onStatusChange?.(s);
	};

	const connect = () => {
		if (socketRef.current?.connected) return;
		setS("connecting");
		// ssr対応
		const url =
			typeof window !== "undefined"
				? "http://localhost:3002"
				: "http://voice-agent-server:3002";
		socketRef.current = io(url);

		socketRef.current.on("connect", () => setS("connected"));
		socketRef.current.on("disconnect", () => setS("disconnected"));
		socketRef.current.on("session_ready", () => {});
		socketRef.current.on("speech_started", () => setS("listening"));
		socketRef.current.on("speech_stopped", () => setS("connected"));

		socketRef.current.on("transcription", (d: { transcript: string }) => {
			setTranscript(d.transcript);
			onTranscript?.(d.transcript);
		});

		socketRef.current.on("audio_response", (d: { delta: string }) => {
			enqueue(d.delta);
			setS("speaking");
		});

		socketRef.current.on("text_response", (d: { delta: string }) => {
			setResponse((prev) => prev + d.delta);
		});

		socketRef.current.on("text_done", (d: { text: string }) => {
			setResponse(d.text);
		});

		socketRef.current.on("response_done", () => {
			// ここ本当はresponseのtextを成形したうえでServerMessageになっているかの検証をしたい
			onResponse?.(response as unknown as ServerMessage);
			setResponse("");
			setS("connected");
		});

		socketRef.current.on("openai_disconnected", () => setS("disconnected"));
		socketRef.current.on("openai_error", () => {});
	};

	const sendAudioBase64 = (b64: string) => {
		if (!socketRef.current?.connected) return;
		socketRef.current.emit("audio_data", {
			type: "input_audio_buffer.append",
			audio: b64,
		});
	};

	const {
		start: startRec,
		stop: stopRec,
		isRecording,
	} = useRecorder(sendAudioBase64);

	useEffect(() => {
		return () => {
			if (socketRef.current) socketRef.current.disconnect();
			stopRec();
		};
	}, [stopRec]);

	return {
		status,
		transcript,
		response,
		isRecording,
		connect,
		startRecording: startRec,
		stopRecording: stopRec,
	};
}
