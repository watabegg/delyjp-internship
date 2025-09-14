"use client";

import { useEffect, useRef } from "react";

/**
 * Base64 エンコードされた音声(PCM/WAV/Opus など decodeAudioData が対応するもの)を再生するフック。
 * - 与えられた base64 チャンクをキューに入れて順次再生
 */
export function useAudioPlayer() {
	const audioCtxRef = useRef<AudioContext | null>(null);
	const queueRef = useRef<string[]>([]);
	const busyRef = useRef(false);

	const ensureCtx = () => {
		if (!audioCtxRef.current) {
			audioCtxRef.current = new AudioContext();
		}
		return audioCtxRef.current;
	};

	const playBase64 = async (base64: string) => {
		const ctx = ensureCtx();
		const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
		const buffer = await ctx.decodeAudioData(bytes.buffer);
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.connect(ctx.destination);
		src.start();
		await new Promise<void>((resolve) => (src.onended = () => resolve()));
	};

	const pump = async () => {
		if (busyRef.current) return;
		busyRef.current = true;
		try {
			while (queueRef.current.length) {
				const chunk = queueRef.current.shift()!;
				await playBase64(chunk);
			}
		} finally {
			busyRef.current = false;
		}
	};

	const enqueue = (base64: string) => {
		queueRef.current.push(base64);
		void pump();
	};

	useEffect(() => {
		return () => {
			if (audioCtxRef.current) {
				audioCtxRef.current.close();
				audioCtxRef.current = null;
			}
		};
	}, []);

	return { enqueue };
}
