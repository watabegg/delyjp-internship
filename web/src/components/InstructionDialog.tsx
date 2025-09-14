"use client";

import { useId } from "react";
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
	const url = method ? methodToVideoUrl[method].url : undefined;
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
