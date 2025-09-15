"use client";

import { forwardRef, useId, useImperativeHandle, useRef } from "react";
import { type CuttingMethodKey, methodToVideoUrl } from "../types/express";
import Dialog from "./ui/Dialog";

export const cuttingMethodOptions: {
	value: CuttingMethodKey;
	label: string;
}[] = Object.entries(methodToVideoUrl).map(([value, meta]) => ({
	value: value as CuttingMethodKey,
	label: meta.label,
}));

export const getInstructionVideoUrl = (method?: CuttingMethodKey | null) =>
	method ? methodToVideoUrl[method].url : undefined;

export type InstructionDialogHandle = {
	stop: () => void; // 一時停止
	reset: () => void; // 先頭に戻して再生
	restart: () => void; // 一時停止状態から再生
};

type InstructionDialogProps = {
	open: boolean;
	onClose: () => void;
	method: CuttingMethodKey | null;
};

const InstructionDialog = forwardRef<
	InstructionDialogHandle,
	InstructionDialogProps
>(({ open, onClose, method }, ref) => {
	const url = method ? methodToVideoUrl[method].url : undefined;
	const dialogId = useId();
	const videoRef = useRef<HTMLVideoElement | null>(null);

	useImperativeHandle(ref, () => ({
		stop: () => {
			const v = videoRef.current;
			if (!v) return;
			try {
				v.pause();
			} catch {}
		},
		reset: () => {
			const v = videoRef.current;
			if (!v) return;
			try {
				v.currentTime = 0;
				void v.play();
			} catch {}
		},
		restart: () => {
			const v = videoRef.current;
			if (!v) return;
			try {
				void v.play();
			} catch {}
		},
	}));

	// 再生制御は親からの命令（stop/reset）で行う。method 変更時は key で再マウントして先頭から再生。

	return (
		<Dialog
			id={dialogId}
			title="切り方動画"
			open={open}
			onClose={onClose}
			className="w-full max-w-3xl"
		>
			{url ? (
				<video
					key={method ?? "none"}
					ref={videoRef}
					controls
					autoPlay
					className="w-full h-full max-h-[80vh]"
					src={url}
				>
					<track
						kind="captions"
						srcLang="ja"
						label="Japanese captions"
						default
					/>
				</video>
			) : (
				<p className="p-4">動画が見つかりません。</p>
			)}
		</Dialog>
	);
});

InstructionDialog.displayName = "InstructionDialog";

export default InstructionDialog;
