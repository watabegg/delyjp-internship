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

export type VideoInstruction = "PLAY" | "PAUSE" | "REWIND" | "FORWARD";

export interface VideoAction {
	instruction: VideoInstruction;
	time?: number; // REWIND/FORWARD のときの秒数
}

interface PlayerControls {
	play: () => Promise<void> | void;
	pause: () => void;
	seekBy: (deltaSec: number) => void;
}

interface CtxValue {
	registerPlayer: (recipeId: string, controls: PlayerControls) => void;
	unregisterPlayer: (recipeId: string) => void;
	dispatch: (
		recipeId: string,
		action: VideoAction,
		options?: { broadcast?: boolean },
	) => Promise<void>;
}

const VideoControlContext = createContext<CtxValue | null>(null);

export function useVideoControl() {
	const ctx = useContext(VideoControlContext);
	if (!ctx)
		throw new Error("useVideoControl must be used within VideoControlProvider");
	return ctx;
}

export function VideoControlProvider({
	children,
	recipeId,
}: {
	children: React.ReactNode;
	recipeId?: string;
}) {
	// recipeId -> controls
	const registryRef = useRef(new Map<string, PlayerControls>());

	const registerPlayer = useCallback(
		(recipeId: string, controls: PlayerControls) => {
			registryRef.current.set(recipeId, controls);
		},
		[],
	);

	const unregisterPlayer = useCallback((recipeId: string) => {
		registryRef.current.delete(recipeId);
	}, []);

	const dispatch = useCallback(
		async (
			recipeId: string,
			action: VideoAction,
			options?: { broadcast?: boolean },
		) => {
			const controls = registryRef.current.get(recipeId);
			if (!controls) {
				console.warn(
					`[VideoControl] player not found for recipeId=${recipeId}`,
				);
				return;
			}

			// 1) まずローカルで即時実行
			switch (action.instruction) {
				case "PLAY":
					try {
						await controls.play();
					} catch (e) {
						// 自動再生制限などは各コンポーネント側でハンドリング
						console.warn("[VideoControl] play error:", e);
					}
					break;
				case "PAUSE":
					controls.pause();
					break;
				case "REWIND":
					controls.seekBy(-Math.abs(action.time ?? 10));
					break;
				case "FORWARD":
					controls.seekBy(Math.abs(action.time ?? 10));
					break;
			}

			// 2) 必要ならサーバーへブロードキャスト（他クライアント同期用）
			if (options?.broadcast) {
				void apiPost(LOCAL_API.videos.control, {
					instruction: action.instruction,
					time: action.time,
					recipeId,
				});
			}
		},
		[],
	);

	const value = useMemo<CtxValue>(
		() => ({ registerPlayer, unregisterPlayer, dispatch }),
		[registerPlayer, unregisterPlayer, dispatch],
	);

	// 他クライアントからのSSEイベントを受信して適用
	useEffect(() => {
		if (!recipeId) return;

		const applyExternal = (instruction: VideoInstruction, time?: number) => {
			const controls = registryRef.current.get(recipeId);
			if (!controls) return;
			switch (instruction) {
				case "PLAY":
					void controls.play();
					break;
				case "PAUSE":
					controls.pause();
					break;
				case "REWIND":
					controls.seekBy(-Math.abs(time ?? 10));
					break;
				case "FORWARD":
					controls.seekBy(Math.abs(time ?? 10));
					break;
			}
		};

		const es = new EventSource(`/api/video-events?recipeId=${recipeId}`);
		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data?.type === "video-control" && data.recipeId === recipeId) {
					applyExternal(data.instruction, data.time);
				}
			} catch (_e) {
				// noop
			}
		};
		es.onerror = () => {
			es.close();
		};

		return () => es.close();
	}, [recipeId]);

	return (
		<VideoControlContext.Provider value={value}>
			{children}
		</VideoControlContext.Provider>
	);
}
