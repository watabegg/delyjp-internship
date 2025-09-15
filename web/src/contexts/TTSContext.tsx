"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { apiPost } from "@/lib/api/client";
import { LOCAL_API } from "@/lib/constants";

interface TTSOptions {
	broadcast?: boolean;
	lang?: string;
	rate?: number;
	pitch?: number;
	volume?: number;
}

interface TTSContextValue {
	isSupported: boolean;
	speak: (text: string, options?: TTSOptions) => Promise<void>;
	cancel: () => void;
}

const Ctx = createContext<TTSContextValue | null>(null);

export function useTTS() {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error("useTTS must be used within TTSProvider");
	return ctx;
}

export function TTSProvider({
	children,
	recipeId,
	senderId,
}: {
	children: React.ReactNode;
	recipeId?: string;
	senderId?: string;
}) {
	const isSupported =
		typeof window !== "undefined" && "speechSynthesis" in window;
	const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

	const cancel = useCallback(() => {
		if (!isSupported) return;
		try {
			window.speechSynthesis.cancel();
			currentUtteranceRef.current = null;
		} catch {
			// noop
		}
	}, [isSupported]);

	const pickJapaneseVoice = useCallback(() => {
		const voices = window.speechSynthesis.getVoices();
		let voice = voices.find((v) => v.lang === "ja-JP");
		if (!voice)
			voice = voices.find((v) => v.lang?.toLowerCase().startsWith("ja"));
		if (!voice)
			voice = voices.find(
				(v) =>
					v.name.toLowerCase().includes("japanese") ||
					v.name.toLowerCase().includes("ja"),
			);
		return voice ?? null;
	}, []);

	const speak = useCallback(
		async (text: string, options?: TTSOptions) => {
			const opts = {
				broadcast: false,
				lang: "ja-JP",
				rate: 1.0,
				pitch: 1.0,
				volume: 0.8,
				...options,
			} as Required<Omit<TTSOptions, "broadcast">> & { broadcast: boolean };

			// 1) ローカルで即時再生
			if (isSupported) {
				try {
					window.speechSynthesis.cancel();
					const shortText =
						text.length > 200 ? `${text.substring(0, 200)}...` : text;
					const u = new SpeechSynthesisUtterance(shortText);
					u.lang = opts.lang;
					u.rate = opts.rate;
					u.pitch = opts.pitch;
					u.volume = opts.volume;
					const voice = pickJapaneseVoice();
					if (voice) u.voice = voice;
					currentUtteranceRef.current = u;
					window.speechSynthesis.speak(u);
				} catch (_e) {
					// ローカル再生は失敗しても進行
				}
			}

			// 2) 必要に応じてサーバー側にブロードキャスト（他クライアント向け）
			if (options?.broadcast && recipeId) {
				void apiPost(LOCAL_API.tts.broadcast, { recipeId, text, senderId });
			}
		},
		[isSupported, pickJapaneseVoice, recipeId, senderId],
	);

	const value = useMemo<TTSContextValue>(
		() => ({ isSupported, speak, cancel }),
		[isSupported, speak, cancel],
	);

	// SSE購読: 他クライアントからのTTSイベントを受け取りローカル再生
	useEffect(() => {
		if (!recipeId) return;
		const es = new EventSource(
			`${LOCAL_API.tts.events}?recipeId=${encodeURIComponent(recipeId)}`,
		);
		es.onmessage = (ev) => {
			try {
				const data = JSON.parse(ev.data) as {
					type?: string;
					text?: string;
					senderId?: string;
				};
				if (data?.type === "tts" && data.text) {
					// 自分が送ったものは無視
					if (senderId && data.senderId && senderId === data.senderId) return;
					void speak(data.text, { broadcast: false });
				}
			} catch {
				// noop
			}
		};
		es.onerror = () => {
			es.close();
		};
		return () => es.close();
	}, [recipeId, senderId, speak]);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
