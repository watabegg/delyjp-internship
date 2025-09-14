"use client";

import { useEffect, useState } from "react";

export default function AudioSynthesize() {
	const [currentText, setCurrentText] = useState<string | null>(null);
	const [isSupported, setIsSupported] = useState(false);

	// Speech Synthesis APIの対応確認
	useEffect(() => {
		const supported = "speechSynthesis" in window;
		setIsSupported(supported);
		console.log("[TTS] Speech Synthesis API対応:", supported);
	}, []);

	// ポーリングで新しいテキストをチェック
	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const res = await fetch("/api/tts");
				const data = await res.json();
				console.log(
					"[TTS] ポーリング結果:",
					data,
					"現在のテキスト:",
					currentText,
				);

				if (data.text && data.text !== currentText) {
					console.log(
						"[TTS] 新しいテキスト受信:",
						data.text,
						"前回:",
						currentText,
					);
					setCurrentText(data.text);

					// Speech Synthesis APIを使用
					if (isSupported) {
						console.log("[TTS] 音声合成開始");

						// 既存の音声を完全に停止
						speechSynthesis.cancel();

						// 少し待ってからリセット
						setTimeout(() => {
							// テキストを短く区切って確実性を向上
							const text =
								data.text.length > 100
									? data.text.substring(0, 100) + "..."
									: data.text;
							const utterance = new SpeechSynthesisUtterance(text);

							// 音声設定を確実に行う
							const voices = speechSynthesis.getVoices();
							console.log("[TTS] 利用可能な音声数:", voices.length);

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
								console.log(
									"[TTS] 日本語音声設定:",
									japaneseVoice.name,
									japaneseVoice.lang,
								);
							} else {
								console.log(
									"[TTS] 日本語音声が見つからない、利用可能な音声:",
									voices.map((v) => `${v.name} (${v.lang})`),
								);
							}

							// より安全な設定値
							utterance.rate = 1.0; // 標準速度
							utterance.pitch = 1.0;
							utterance.volume = 0.8; // 少し小さめ
							utterance.lang = "ja-JP"; // 明示的に日本語を指定

							// イベントハンドラーでデバッグ
							utterance.onstart = () => {
								console.log("[TTS] 音声再生開始");
							};

							utterance.onend = () => {
								console.log("[TTS] 音声再生完了");
							};

							utterance.onerror = (e) => {
								console.error("[TTS] 音声再生エラー詳細:", {
									error: e.error,
									type: e.type,
									target: e.target,
									eventType: typeof e,
								});
							};

							utterance.onpause = () => {
								console.log("[TTS] 音声一時停止");
							};

							utterance.onresume = () => {
								console.log("[TTS] 音声再開");
							};

							// Speech Synthesis の状態をチェック
							console.log("[TTS] SpeechSynthesis状態:", {
								speaking: speechSynthesis.speaking,
								pending: speechSynthesis.pending,
								paused: speechSynthesis.paused,
							});

							// 音声を再生キューに追加
							try {
								speechSynthesis.speak(utterance);
								console.log("[TTS] speak()実行完了");
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
