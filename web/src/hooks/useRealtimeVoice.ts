"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { 
    RealtimeSessionResponse, 
    VoiceStatus, 
    TranscriptionResult 
} from "@/types/realtime";

interface UseRealtimeVoiceOptions {
    onTranscript?: (result: TranscriptionResult) => void;
    onStatusChange?: (status: VoiceStatus) => void;
    onError?: (error: string) => void;
    onMessage?: (messageType: string, message: any) => void;
}

interface UseRealtimeVoiceReturn {
    status: VoiceStatus;
    isRecording: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    startRecording: () => void;
    stopRecording: () => void;
    error: string | null;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}): UseRealtimeVoiceReturn {
    const { onTranscript, onStatusChange, onError, onMessage } = options;
    
    const [status, setStatus] = useState<VoiceStatus>("disconnected");
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioSenderRef = useRef<RTCRtpSender | null>(null);

    // ステータス変更時のコールバック
    const updateStatus = useCallback((newStatus: VoiceStatus) => {
        console.log("[REALTIME-VOICE] ステータス変更:", newStatus);
        setStatus(newStatus);
        onStatusChange?.(newStatus);
    }, [onStatusChange]);

    // エラーハンドリング
    const handleError = useCallback((errorMessage: string) => {
        console.error("[REALTIME-VOICE] エラー:", errorMessage);
        setError(errorMessage);
        updateStatus("error");
        onError?.(errorMessage);
    }, [updateStatus, onError]);

    // WebRTC接続の初期化
    const initWebRTC = useCallback(async (): Promise<RTCPeerConnection> => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        // データチャンネルの設定
        const dc = pc.createDataChannel("oai-events", {
            ordered: true
        });

        dc.addEventListener("open", () => {
            console.log("[REALTIME-VOICE] データチャンネル接続成功");
            updateStatus("connected");
        });

        dc.addEventListener("message", (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("[REALTIME-VOICE] 受信メッセージ:", message);
                
                // メッセージタイプを外部に通知
                onMessage?.(message.type, message);
                
                // 転写結果の処理
                if (message.type === "input_audio_buffer.speech_started") {
                    console.log("[REALTIME-VOICE] 音声検出開始");
                    updateStatus("listening");
                }
                
                if (message.type === "input_audio_buffer.speech_stopped") {
                    console.log("[REALTIME-VOICE] 音声検出終了");
                    updateStatus("processing");
                }
                
                // 転写完了イベント（複数パターンをチェック）
                if (message.type === "conversation.item.input_audio_transcription.completed") {
                    const transcript = message.transcript;
                    console.log("[REALTIME-VOICE] 転写完了:", transcript);
                    
                    const result: TranscriptionResult = {
                        transcript: transcript,
                        is_final: true
                    };
                    
                    onTranscript?.(result);
                    updateStatus("connected");
                }
                
                // 会話アイテム作成時の転写確認
                if (message.type === "conversation.item.created" && message.item?.content) {
                    const content = message.item.content;
                    console.log("[REALTIME-VOICE] 会話アイテム作成:", content);
                    
                    // テキストコンテンツがある場合
                    if (Array.isArray(content)) {
                        content.forEach(item => {
                            if (item.type === "input_text" && item.text) {
                                console.log("[REALTIME-VOICE] 入力テキスト発見:", item.text);
                                const result: TranscriptionResult = {
                                    transcript: item.text,
                                    is_final: true
                                };
                                onTranscript?.(result);
                            }
                            if (item.type === "input_audio" && item.transcript) {
                                console.log("[REALTIME-VOICE] 音声転写発見:", item.transcript);
                                const result: TranscriptionResult = {
                                    transcript: item.transcript,
                                    is_final: true
                                };
                                onTranscript?.(result);
                            }
                        });
                    }
                    updateStatus("connected");
                }
                
                // 入力音声バッファコミット時
                if (message.type === "input_audio_buffer.committed") {
                    console.log("[REALTIME-VOICE] 音声バッファコミット完了");
                    // 転写結果を待つ
                }
                
            } catch (error) {
                console.error("[REALTIME-VOICE] メッセージ解析エラー:", error);
            }
        });

        dc.addEventListener("error", (event) => {
            handleError(`データチャンネルエラー: ${event}`);
        });

        pc.addEventListener("iceconnectionstatechange", () => {
            console.log("[REALTIME-VOICE] ICE接続状態:", pc.iceConnectionState);
            if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
                handleError("WebRTC接続が失敗しました");
            }
        });

        pcRef.current = pc;
        dcRef.current = dc;
        
        return pc;
    }, [updateStatus, handleError, onTranscript]);

    // エフェメラルキーの取得とWebRTC接続
    const connect = useCallback(async () => {
        try {
            updateStatus("connecting");
            setError(null);

            console.log("[REALTIME-VOICE] エフェメラルキー取得開始");
            
            // エフェメラルキーを取得
            const response = await fetch("/api/realtime-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`エフェメラルキー取得失敗: ${response.status}`);
            }

            const sessionData: RealtimeSessionResponse = await response.json();
            console.log("[REALTIME-VOICE] セッション取得成功:", sessionData.session.id);

            // WebRTC接続の初期化
            const pc = await initWebRTC();

            // オーディオトラックの追加（マイクアクセス）
            const audioConstraints: MediaTrackConstraints = {
                sampleRate: 24000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            };

            // Chrome固有の音声最適化設定を条件付きで追加
            const chromeConstraints = audioConstraints as any;
            if (navigator.userAgent.includes('Chrome')) {
                chromeConstraints.googEchoCancellation = true;
                chromeConstraints.googAutoGainControl = true;
                chromeConstraints.googNoiseSuppression = true;
                chromeConstraints.googHighpassFilter = true;
                chromeConstraints.googTypingNoiseDetection = true;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: chromeConstraints
            });
            
            const audioTrack = stream.getAudioTracks()[0];
            const sender = pc.addTrack(audioTrack, stream);
            
            streamRef.current = stream;
            audioSenderRef.current = sender;

            // Offerの作成と設定
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            console.log("[REALTIME-VOICE] WebRTC Offer作成完了");

            // OpenAI Realtime APIにOfferを送信
            const clientSecret = sessionData.session.client_secret?.value;
            if (!clientSecret) {
                throw new Error("クライアントシークレットが取得できませんでした");
            }

            // OpenAI Realtime WebRTC接続
            console.log("[REALTIME-VOICE] WebRTC offer送信");
            
            const webrtcResponse = await fetch("https://api.openai.com/v1/realtime", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${clientSecret}`,
                    "Content-Type": "application/sdp"
                },
                body: offer.sdp
            });

            if (!webrtcResponse.ok) {
                const errorText = await webrtcResponse.text();
                console.error("[REALTIME-VOICE] WebRTC接続エラー:", webrtcResponse.status, errorText);
                throw new Error(`WebRTC接続失敗: ${webrtcResponse.status} - ${errorText}`);
            }

            const answerSdp = await webrtcResponse.text();
            console.log("[REALTIME-VOICE] Answer SDP受信");
            
            await pc.setRemoteDescription({ 
                type: "answer", 
                sdp: answerSdp 
            });

            console.log("[REALTIME-VOICE] WebRTC接続完了");

        } catch (error) {
            handleError(error instanceof Error ? error.message : "接続エラー");
        }
    }, [updateStatus, handleError, initWebRTC]);

    // 録音開始
    const startRecording = useCallback(() => {
        if (status !== "connected" || !dcRef.current) {
            console.warn("[REALTIME-VOICE] 録音開始: 接続されていません");
            return;
        }

        console.log("[REALTIME-VOICE] 録音開始");
        setIsRecording(true);

        // セッションレベルで転写が有効になっているので、個別の設定は不要
        console.log("[REALTIME-VOICE] 録音開始 - 転写はセッションレベルで有効");
    }, [status]);

    // 録音停止
    const stopRecording = useCallback(() => {
        if (!isRecording || !dcRef.current) {
            console.warn("[REALTIME-VOICE] 録音停止: 録音中ではありません");
            return;
        }

        console.log("[REALTIME-VOICE] 録音停止");
        setIsRecording(false);

        // 転写はセッションレベルで管理されるので、個別の無効化は不要
        console.log("[REALTIME-VOICE] 録音停止 - 転写はセッションレベルで継続");
    }, [isRecording]);

    // 切断
    const disconnect = useCallback(() => {
        console.log("[REALTIME-VOICE] 切断開始");

        // 録音停止
        setIsRecording(false);

        // メディアストリーム停止
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // WebRTC接続終了
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        dcRef.current = null;
        audioSenderRef.current = null;

        updateStatus("disconnected");
        setError(null);
    }, [updateStatus]);

    // コンポーネントアンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        status,
        isRecording,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        error
    };
}
