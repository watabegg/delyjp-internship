"use client";

import { useEffect, useState } from "react";

export default function AudioSynthesize() {
	const [currentText, setCurrentText] = useState<string | null>(null);
	const [isSupported, setIsSupported] = useState(false);

	// Speech Synthesis APIの対応確認
	useEffect(() => {
		const supported = "speechSynthesis" in window;
		setIsSupported(supported);
	}, []);

	// ポーリングで新しいテキストをチェック
	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const res = await fetch("/api/tts");
				const data = await res.json();

				if (data.text && data.text !== currentText) {
					setCurrentText(data.text);

					if (isSupported) {
						speechSynthesis.cancel();

						// 少し待ってからリセット
						setTimeout(() => {
							// テキストを短く区切って確実性を向上
							const text =
								data.text.length > 100
									? `${data.text.substring(0, 100)}...`
									: data.text;
							const utterance = new SpeechSynthesisUtterance(text);

							// 音声設定を確実に行う
							const voices = speechSynthesis.getVoices();

							// より確実な日本語音声の検索
							let japaneseVoice = voices.find(
								(voice) => voice.lang === "ja-JP",
							);
							if (!japaneseVoice) {
								japaneseVoice = voices.find((voice) =>
									voice.lang.startsWith("ja"),
								);
							}
							if (!japaneseVoice) {
								japaneseVoice = voices.find(
									(voice) =>
										voice.name.toLowerCase().includes("japanese") ||
										voice.name.toLowerCase().includes("ja"),
								);
							}

							if (japaneseVoice) {
								utterance.voice = japaneseVoice;
							}

							utterance.rate = 1.0; // 標準速度
							utterance.pitch = 1.0;
							utterance.volume = 0.8; // 少し小さめ
							utterance.lang = "ja-JP"; // 明示的に日本語を指定

							utterance.onerror = (e) => {
								console.error("[TTS] 音声再生エラー詳細:", {
									error: e.error,
									type: e.type,
									target: e.target,
									eventType: typeof e,
								});
							};

							// 音声を再生キューに追加
							try {
								speechSynthesis.speak(utterance);
							} catch (speakError) {
								console.error("[TTS] speak()実行エラー:", speakError);
							}
						}, 100); // 100ms待機してからリセット
					}
				}
			} catch (error) {
				console.error("[TTS] ポーリングエラー:", error);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [currentText, isSupported]);

	return null;
}
