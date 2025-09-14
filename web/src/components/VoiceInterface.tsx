"use client";

/**
 * 音声インターフェースコンポーネント
 * OpenAI Realtime APIとの音声通信を管理
 */

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface VoiceInterfaceProps {
  onStatusChange?: (
    status:
      | "disconnected"
      | "connecting"
      | "connected"
      | "speaking"
      | "listening"
  ) => void;
  onTranscript?: (transcript: string) => void;
  onResponse?: (response: string) => void;
}

export default function VoiceInterface({
  onStatusChange,
  onTranscript,
  onResponse,
}: VoiceInterfaceProps = {}) {
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected" | "speaking" | "listening"
  >("disconnected");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isLocalRecordingRef = useRef<boolean>(false);

  /**
   * ステータスを更新
   */
  const updateStatus = (newStatus: typeof status) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  /**
   * Socket.ioサーバーに接続
   */
  const connectSocket = () => {
    try {
      updateStatus("connecting");

      // Express.js音声エージェントサーバーに接続
      // Docker環境内ではサービス名を使用、ブラウザからはlocalhostを使用
      const socketUrl =
        typeof window !== "undefined"
          ? "http://localhost:3002" // ブラウザから
          : "http://voice-agent-server:3002"; // SSR時
      socketRef.current = io(socketUrl);

      socketRef.current.on("connect", () => {
        console.log("🔗 [Voice] Connected to voice-agent-server:", socketUrl);
        updateStatus("connected");
      });

      socketRef.current.on("disconnect", () => {
        console.log("❌ [Voice] Disconnected from voice-agent-server");
        updateStatus("disconnected");
      });

      socketRef.current.on("session_ready", () => {
        console.log("✅ [Voice] OpenAI Realtime session ready");
      });

      socketRef.current.on("speech_started", () => {
        console.log("🎤 [Voice] Speech detection started");
        updateStatus("listening");
      });

      socketRef.current.on("speech_stopped", () => {
        console.log("⏹️ [Voice] Speech detection stopped");
        updateStatus("connected");
      });

      socketRef.current.on("transcription", (data: { transcript: string }) => {
        console.log("📝 [Voice] Transcription received:", data.transcript);
        setTranscript(data.transcript);
        onTranscript?.(data.transcript);
      });

      socketRef.current.on("audio_response", (data: { delta: string }) => {
        console.log(
          "🔊 [Voice] Audio response chunk received (length:",
          data.delta?.length,
          ")"
        );
        playAudioDelta(data.delta);
        updateStatus("speaking");
      });

      socketRef.current.on("response_done", () => {
        console.log("🏁 [Voice] Response completed");
        updateStatus("connected");
        const finalResponse = response;
        onResponse?.(finalResponse);
        setResponse(""); // レスポンスをリセット
      });

      socketRef.current.on(
        "tool_result",
        (data: { name: string; result: any }) => {
          console.log(`🛠️ [Voice] Tool ${data.name} executed:`, data.result);
          // ツール実行結果を表示することも可能
        }
      );

      socketRef.current.on("error", (error: any) => {
        console.error("❌ [Voice] Socket.io error:", error);
        updateStatus("disconnected");
      });

      socketRef.current.on("openai_disconnected", () => {
        console.log("🔌 [Voice] OpenAI Realtime API connection lost");
        updateStatus("disconnected");
      });

      socketRef.current.on("openai_error", (error: any) => {
        console.error("🚨 [Voice] OpenAI API error:", error);
      });
    } catch (error) {
      console.error("[Voice] Connection error:", error);
      updateStatus("disconnected");
    }
  };

  /**
   * 音声データを再生
   */
  const playAudioDelta = async (audioBase64: string) => {
    try {
      // Base64をArrayBufferに変換
      const audioData = Uint8Array.from(atob(audioBase64), (c) =>
        c.charCodeAt(0)
      );

      // AudioContextで再生
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(
        audioData.buffer
      );
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error("[Voice] Audio playback error:", error);
    }
  };

  /**
   * マイクロフォンアクセスを開始
   */
  const startRecording = async () => {
    try {
      console.log("🎙️ [Voice] Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
        },
      });

      console.log("✅ [Voice] Microphone access granted");
      audioStreamRef.current = stream;

      // AudioContextを使用してPCM16データを取得
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        console.log("🎵 [Voice] AudioContext created (24kHz)");
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1
      );
      processorRef.current = processor;
      console.log("🔄 [Voice] Audio processing pipeline established");

      let audioChunkCount = 0;
      isLocalRecordingRef.current = true; // ローカルな録音状態（React stateの遅延を回避）

      processor.onaudioprocess = (event) => {
        // デバッグ: 音声処理の詳細をログ出力
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);

        // 音声レベル（RMS）とピーク値を計算
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.abs(inputData[i]);
          sum += sample * sample;
          peak = Math.max(peak, sample);
        }
        const rms = Math.sqrt(sum / inputData.length);
        const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
        const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;

        // 最初の数回は詳細ログを出力
        if (audioChunkCount < 5) {
          console.log(
            `🔊 [Voice] Audio processing debug (chunk ${audioChunkCount + 1}):`
          );
          console.log(`  - Socket connected: ${socketRef.current?.connected}`);
          console.log(`  - Is recording (state): ${isRecording}`);
          console.log(
            `  - Is recording (local): ${isLocalRecordingRef.current}`
          );
          console.log(`  - Input data length: ${inputData.length}`);
          console.log(
            `  - RMS レベル: ${rms.toFixed(6)} (${rmsDb.toFixed(1)} dB)`
          );
          console.log(
            `  - Peak レベル: ${peak.toFixed(6)} (${peakDb.toFixed(1)} dB)`
          );
          console.log(
            `  - Audio level (first 10 samples): [${Array.from(
              inputData.slice(0, 10)
            )
              .map((x) => x.toFixed(4))
              .join(", ")}]`
          );
        }

        // 定期的にオーディオレベルをログ出力（10チャンクごと）
        if (audioChunkCount % 10 === 0 && audioChunkCount > 0) {
          const isAudible = rms > 0.001; // 閾値: 0.001以上で音声として認識
          console.log(
            `🎵 [Voice] Audio level check (chunk ${
              audioChunkCount + 1
            }): RMS=${rms.toFixed(6)} (${rmsDb.toFixed(
              1
            )}dB), Peak=${peak.toFixed(6)} (${peakDb.toFixed(1)}dB) ${
              isAudible ? "🔊 AUDIBLE" : "🔇 SILENT"
            }`
          );
        }

        if (socketRef.current?.connected && isLocalRecordingRef.current) {
          // Float32をPCM16に変換
          const pcm16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // -1.0 ~ 1.0 の範囲を -32768 ~ 32767 に変換
            const sample = Math.max(-1, Math.min(1, inputData[i]));
            pcm16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          }

          // Uint8Arrayに変換してBase64エンコード
          const uint8Array = new Uint8Array(pcm16Data.buffer);
          const base64Data = arrayBufferToBase64(uint8Array);

          audioChunkCount++;
          if (audioChunkCount % 50 === 0) {
            // 50チャンクごとにログ表示
            console.log(
              `📡 [Voice] Audio chunks sent: ${audioChunkCount} (${inputData.length} samples, ${base64Data.length} base64 chars)`
            );
          }

          // Socket.io経由でOpenAI Realtime APIに音声チャンクを送信
          socketRef.current?.emit("audio_data", {
            type: "input_audio_buffer.append",
            audio: base64Data,
          });

          if (audioChunkCount === 1) {
            console.log("🚀 [Voice] First audio chunk sent to backend!");
          }
        } else {
          if (audioChunkCount < 5) {
            console.warn(
              `⚠️ [Voice] Cannot send audio - Socket connected: ${socketRef.current?.connected}, Recording (state): ${isRecording}, Recording (local): ${isLocalRecordingRef.current}`
            );
          }
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      setIsRecording(true);
      updateStatus("listening");
      console.log("🎤 [Voice] Recording started successfully");
    } catch (error) {
      console.error("❌ [Voice] Microphone access error:", error);
    }
  };

  /**
   * マイクロフォン録音を停止
   */
  const stopRecording = () => {
    console.log("⏹️ [Voice] Stopping recording...");
    setIsRecording(false);
    isLocalRecordingRef.current = false; // ローカル録音フラグも停止
    updateStatus("connected");

    // AudioProcessorを切断
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
      console.log("🔌 [Voice] Audio processor disconnected");
    }

    // MediaStreamを停止
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      console.log("🎙️ [Voice] Microphone stream stopped");
    }
  };

  /**
   * ArrayBufferをBase64エンコード
   */
  const arrayBufferToBase64 = (buffer: Uint8Array): string => {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  };

  /**
   * クリーンアップ
   */
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopRecording();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="voice-interface p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">音声アシスタント</h2>

      {/* ステータス表示 */}
      <div className="status-display mb-4 text-center">
        <div
          className={`status-indicator w-4 h-4 rounded-full mx-auto mb-2 ${
            status === "connected"
              ? "bg-green-500"
              : status === "connecting"
              ? "bg-yellow-500"
              : status === "listening"
              ? "bg-blue-500 animate-pulse"
              : status === "speaking"
              ? "bg-purple-500 animate-pulse"
              : "bg-red-500"
          }`}
        />
        <p className="text-sm text-gray-600">
          {status === "disconnected" && "未接続"}
          {status === "connecting" && "接続中..."}
          {status === "connected" && "待機中"}
          {status === "listening" && "聞いています..."}
          {status === "speaking" && "応答中..."}
        </p>
      </div>

      {/* 接続ボタン */}
      {status === "disconnected" && (
        <button
          onClick={connectSocket}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        >
          接続する
        </button>
      )}

      {/* 録音ボタン */}
      {status !== "disconnected" && status !== "connecting" && (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={status === "speaking"}
          className={`w-full py-3 px-6 rounded-full text-white font-medium ${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } ${status === "speaking" ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isRecording ? "録音停止" : "話しかける"}
        </button>
      )}

      {/* 音声認識テキスト */}
      {transcript && (
        <div className="transcript mt-4 p-3 bg-gray-100 rounded">
          <h4 className="font-medium text-sm text-gray-700 mb-1">あなた:</h4>
          <p className="text-sm">{transcript}</p>
        </div>
      )}

      {/* アシスタント応答 */}
      {response && (
        <div className="response mt-4 p-3 bg-blue-50 rounded">
          <h4 className="font-medium text-sm text-blue-700 mb-1">
            アシスタント:
          </h4>
          <p className="text-sm">{response}</p>
        </div>
      )}

      {/* 使用例 */}
      <div className="examples mt-6 text-xs text-gray-500">
        <h4 className="font-medium mb-2">使用例:</h4>
        <ul className="space-y-1">
          <li>• "カレーの作り方を教えて"</li>
          <li>• "動画を見せて"</li>
          <li>• "タイマーを5分で設定して"</li>
          <li>• "動画を一時停止して"</li>
        </ul>
      </div>
    </div>
  );
}
