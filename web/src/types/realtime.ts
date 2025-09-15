// OpenAI Realtime API関連の型定義

export interface RealtimeSession {
	id: string;
	object: "realtime.session";
	model: string;
	expires_at: number;
	modalities: string[];
	instructions: string;
	voice: string;
	input_audio_format: string;
	output_audio_format: string;
	input_audio_transcription?: {
		model: string;
	};
	turn_detection: {
		type: string;
		threshold?: number;
		prefix_padding_ms?: number;
		silence_duration_ms?: number;
	};
	tools?: any[];
	tool_choice?: string;
	temperature?: number;
	max_response_output_tokens?: number | string;
	client_secret?: {
		value: string;
		expires_at: number;
	};
}

export interface RealtimeSessionResponse {
	success: boolean;
	session: RealtimeSession;
	error?: string;
	details?: string;
}

// WebRTCメッセージタイプ
export interface RealtimeMessage {
	type: string;
	[key: string]: any;
}

// 音声転写結果
export interface TranscriptionResult {
	transcript: string;
	confidence?: number;
	is_final: boolean;
}

// 音声セッションの状態
export type VoiceStatus =
	| "disconnected" // 未接続
	| "connecting" // 接続中
	| "connected" // 接続済み（待機中）
	| "listening" // 音声聞き取り中
	| "processing" // 処理中
	| "speaking" // 応答再生中
	| "error"; // エラー状態
