// 切り方と動画URLのマッピング
export const methodToVideoUrl = {
	// 短冊切り（にんじん）
	rectangles: {
		url: "https://video.kurashiru.com/production/videos/1384fe04-a3b3-41e8-bd12-1ff32d6e0b16/webm/master.webm",
		label: "短冊切り（にんじん）",
	},
	// そぎ切り（鶏むね肉）
	shavingCut: {
		url: "https://video.kurashiru.com/production/videos/5cc951dd-f185-417d-bb29-2aa7f1c16d94/webm/master.webm",
		label: "そぎ切り（鶏むね肉）",
	},
	// ざく切り（トマト）
	chop: {
		url: "https://video.kurashiru.com/production/videos/5ebc23d6-a029-48c4-a3a2-26cfa7f316da/webm/master.webm",
		label: "ざく切り（トマト）",
	},
	// くし切り（玉ねぎ）
	wedges: {
		url: "https://video.kurashiru.com/production/videos/e97865b9-ae61-434e-99b4-955bc563e381/webm/master.webm",
		label: "くし切り（玉ねぎ）",
	},
	// みじん切り（玉ねぎ）
	mince: {
		url: "https://video.kurashiru.com/production/videos/f0cf6a8c-3a7a-43bd-b0a4-0247c9956bc5/webm/master.webm",
		label: "みじん切り（玉ねぎ）",
	},
	// さいの目切り（じゃがいも）
	dice: {
		url: "https://video.kurashiru.com/production/videos/f13fc56e-2744-4596-b476-6b1196659765/webm/master.webm",
		label: "さいの目切り（じゃがいも）",
	},
	// 千切り（キャベツ）
	shred: {
		url: "https://video.kurashiru.com/production/videos/a2ec8c99-0fb1-42b0-8d58-32750ff3ac05/webm/master.webm",
		label: "千切り（キャベツ）",
	},
};

export type CuttingMethodKey = keyof typeof methodToVideoUrl;

export type ControllerInstruction = "PLAY" | "PAUSE" | "REWIND" | "FORWARD";

export type ActionMethod = "START" | "STOP" | "RESET" | "CLOSE";

export type PayloadMap = {
	timer: { method: ActionMethod; seconds: number };
	methodToVideo: { method: ActionMethod; videoType: CuttingMethodKey };
	videoControll: { instruction: ControllerInstruction; time?: number };
	withTalkUser: { talkMessage: string };
	error: { message: string };
};

export type ServerMessageKind = keyof PayloadMap;

export type ServerMessage<K extends ServerMessageKind = ServerMessageKind> = {
	kind: K;
	payload: PayloadMap[K];
};

// ヘルパー: 生成
export const createMessage = <K extends ServerMessageKind>(
	kind: K,
	payload: PayloadMap[K],
): ServerMessage<K> => ({ kind, payload });

// ヘルパー: 絞り込み
export const isMessageKind = <K extends ServerMessageKind>(
	msg: ServerMessage,
	kind: K,
): msg is ServerMessage<K> => msg.kind === kind;

// ヘルパー: switch の網羅性チェック
export const assertNever = (x: never): never => {
	throw new Error(`Unexpected message: ${JSON.stringify(x)}`);
};
