"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PCM16(24kHz, mono) を生成して小さなチャンクで渡すレコーダーフック。
 * - getUserMedia -> AudioContext(24kHz) -> ScriptProcessorNode(4096) -> Float32 -> PCM16 -> Base64
 * - onPcmChunk には Base64 の文字列を渡す
 */
export function useRecorder(onPcmChunk?: (base64Pcm16: string) => void) {
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const processorRef = useRef<ScriptProcessorNode | null>(null);
	const [isRecording, setIsRecording] = useState(false);

	const float32ToPcm16Base64 = (input: Float32Array): string => {
		const pcm16 = new Int16Array(input.length);
		for (let i = 0; i < input.length; i++) {
			let s = input[i];
			if (s > 1) s = 1;
			else if (s < -1) s = -1;
			pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
		}
		const view = new Uint8Array(pcm16.buffer);
		let binary = "";
		const chunk = 0x8000;
		for (let i = 0; i < view.length; i += chunk) {
			binary += String.fromCharCode.apply(null, Array.from(view.subarray(i, i + chunk)));
		}
		return btoa(binary);
	};

	const start = async () => {
		if (isRecording) return;
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: { sampleRate: 24000, channelCount: 1 },
		});
		mediaStreamRef.current = stream;

		if (!audioContextRef.current) {
			audioContextRef.current = new AudioContext({ sampleRate: 24000 });
		}
		const source = audioContextRef.current.createMediaStreamSource(stream);
		const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
		processorRef.current = processor;

		processor.onaudioprocess = (e) => {
			const input = e.inputBuffer.getChannelData(0);
			if (onPcmChunk) onPcmChunk(float32ToPcm16Base64(input));
		};

		source.connect(processor);
		processor.connect(audioContextRef.current.destination);
		setIsRecording(true);
	};

	const stop = () => {
		setIsRecording(false);
		if (processorRef.current) {
			processorRef.current.disconnect();
			processorRef.current = null;
		}
		if (mediaStreamRef.current) {
			mediaStreamRef.current.getTracks().forEach((t) => t.stop());
			mediaStreamRef.current = null;
		}
	};

	useEffect(() => {
		return () => {
			stop();
			if (audioContextRef.current) {
				audioContextRef.current.close();
				audioContextRef.current = null;
			}
		};
	}, []);

	return { start, stop, isRecording };
}
