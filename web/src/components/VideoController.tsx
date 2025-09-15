"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVideoControl } from "@/contexts/VideoControlContext";

interface VideoControllerProps {
	recipeId: string;
	videoSrc: string;
	className?: string;
}

export function VideoController({
	recipeId,
	videoSrc,
	className,
}: VideoControllerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [showWarning, setShowWarning] = useState(false);
	const [_userInteracted, setUserInteracted] = useState(false);
	const { registerPlayer, unregisterPlayer } = useVideoControl();

	const showAutoplayWarning = useCallback(() => {
		setShowWarning(true);
		setTimeout(() => setShowWarning(false), 5000); // 5秒後に非表示
	}, []);

	// ユーザーのインタラクションを検知
	useEffect(() => {
		const handleUserInteraction = () => {
			setUserInteracted(true);
			setShowWarning(false);
		};

		// ページ全体でのクリックやキーボード操作を監視
		document.addEventListener("click", handleUserInteraction);
		document.addEventListener("keydown", handleUserInteraction);
		document.addEventListener("touchstart", handleUserInteraction);

		return () => {
			document.removeEventListener("click", handleUserInteraction);
			document.removeEventListener("keydown", handleUserInteraction);
			document.removeEventListener("touchstart", handleUserInteraction);
		};
	}, []);

	// Contextへプレイヤーを登録
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		registerPlayer(recipeId, {
			play: () =>
				video.play().catch((error: unknown) => {
					const err = error as { name?: string } | undefined;
					if (err?.name === "NotAllowedError") {
						showAutoplayWarning();
					} else {
						throw error;
					}
				}),
			pause: () => video.pause(),
			seekBy: (delta) => {
				const target = Math.min(
					Number.isFinite(video.duration)
						? video.duration
						: video.currentTime + Math.max(0, delta),
					Math.max(0, video.currentTime + delta),
				);
				// 上のMin/Maxは一応のガード。最終的に0〜durationに丸める
				const duration = Number.isFinite(video.duration)
					? video.duration
					: undefined;
				const clamped = Math.max(0, Math.min(target, duration ?? target));
				video.currentTime = clamped;
			},
		});

		return () => {
			unregisterPlayer(recipeId);
		};
	}, [recipeId, registerPlayer, unregisterPlayer, showAutoplayWarning]);

	return (
		<>
			<video
				ref={videoRef}
				className={className}
				controls
				src={videoSrc}
				data-recipe-id={recipeId}
				onClick={() => setUserInteracted(true)}
			>
				<track kind="captions" />
			</video>

			{/* 自動再生警告バナー */}
			{showWarning && (
				<div className="absolute top-2 left-2 right-2 bg-yellow-500 text-black px-4 py-2 rounded-md text-sm font-medium z-10">
					⚠️ 動画をクリックして最初に再生してから、音声コマンドをお試しください
				</div>
			)}
		</>
	);
}
