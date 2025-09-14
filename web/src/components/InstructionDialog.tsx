"use client";

import { useId } from "react";
import Dialog from "./ui/Dialog";

// 切り方と動画URLのマッピング
const methodToVideoUrl = {
	// 短冊切り（にんじん）
	rectangles:
		"https://video.kurashiru.com/production/videos/1384fe04-a3b3-41e8-bd12-1ff32d6e0b16/webm/master.webm",
	// そぎ切り（鶏むね肉）
	shavingCut:
		"https://video.kurashiru.com/production/videos/5cc951dd-f185-417d-bb29-2aa7f1c16d94/webm/master.webm",
	// ざく切り（トマト）
	chop: "https://video.kurashiru.com/production/videos/5ebc23d6-a029-48c4-a3a2-26cfa7f316da/webm/master.webm",
	// くし切り（玉ねぎ）
	wedges:
		"https://video.kurashiru.com/production/videos/e97865b9-ae61-434e-99b4-955bc563e381/webm/master.webm",
	// みじん切り（玉ねぎ）
	mince:
		"https://video.kurashiru.com/production/videos/f0cf6a8c-3a7a-43bd-b0a4-0247c9956bc5/webm/master.webm",
	// さいの目切り（じゃがいも）
	dice: "https://video.kurashiru.com/production/videos/f13fc56e-2744-4596-b476-6b1196659765/webm/master.webm",
	// 千切り（キャベツ）
	shred:
		"https://video.kurashiru.com/production/videos/a2ec8c99-0fb1-42b0-8d58-32750ff3ac05/webm/master.webm",
};

export type CuttingMethodKey = keyof typeof methodToVideoUrl;

export const cuttingMethodOptions: {
	value: CuttingMethodKey;
	label: string;
}[] = [
	{ value: "rectangles", label: "短冊切り（にんじん）" },
	{ value: "shavingCut", label: "そぎ切り（鶏むね肉）" },
	{ value: "chop", label: "ざく切り（トマト）" },
	{ value: "wedges", label: "くし切り（玉ねぎ）" },
	{ value: "mince", label: "みじん切り（玉ねぎ）" },
	{ value: "dice", label: "さいの目切り（じゃがいも）" },
	{ value: "shred", label: "千切り（キャベツ）" },
];

export const getInstructionVideoUrl = (method?: CuttingMethodKey | null) =>
	method ? methodToVideoUrl[method] : undefined;

type InstructionDialogProps = {
	open: boolean;
	onClose: () => void;
	method: CuttingMethodKey | null;
};

const InstructionDialog = ({
	open,
	onClose,
	method,
}: InstructionDialogProps) => {
	const url = method ? methodToVideoUrl[method] : undefined;
	const dialogId = useId();

	return (
		<Dialog
			id={dialogId}
			title="切り方動画"
			open={open}
			onClose={onClose}
			className="w-full max-w-3xl"
		>
			{url ? (
				<video controls className="w-full h-full max-h-[80vh]" src={url}>
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
};

export default InstructionDialog;
