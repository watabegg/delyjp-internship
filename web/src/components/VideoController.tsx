"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VideoControllerProps {
  recipeId: string;
  videoSrc: string;
  className?: string;
}

export function VideoController({ recipeId, videoSrc, className }: VideoControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [_userInteracted, setUserInteracted] = useState(false);

  // 自動再生警告を表示する関数
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
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    // video要素の初期状態をログ出力
    console.log("[VIDEO] VideoController マウント, recipeId:", recipeId);
    console.log("[VIDEO] videoSrc:", videoSrc);
    
    // Server-Sent Events で制御イベントを受信
    console.log(`[SSE] 接続開始: /api/video-events?recipeId=${recipeId}`);
    const eventSource = new EventSource(`/api/video-events?recipeId=${recipeId}`);

    eventSource.onopen = () => {
      console.log("[SSE] 接続成功");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] 受信イベント:", data);

        if (data.type === "connected") {
          console.log("[SSE] 接続確認完了:", data);
          return;
        }

        if (data.type === "video-control" && data.recipeId === recipeId) {
          const video = videoRef.current;
          if (!video) {
            console.warn("[VIDEO] ビデオ要素が見つかりません");
            return;
          }

          console.log(`[VIDEO] 制御実行開始: ${data.instruction}`);
          console.log("[VIDEO] video要素の状態:", {
            paused: video.paused,
            currentTime: video.currentTime,
            duration: video.duration,
            readyState: video.readyState,
            src: video.src
          });

          // ビデオ制御を実行
          switch (data.instruction) {
            case "PLAY":
              video.play().catch((error) => {
                if (error.name === 'NotAllowedError') {
                  console.warn("⚠️ 自動再生が制限されています。ユーザーが動画をクリックして最初に再生してください。");
                  // ユーザーに通知するための視覚的フィードバック
                  showAutoplayWarning();
                } else {
                  console.error("再生エラー:", error);
                }
              });
              break;
            case "PAUSE":
              console.log("[VIDEO] 一時停止実行前:", { paused: video.paused });
              video.pause();
              console.log("[VIDEO] 一時停止実行後:", { paused: video.paused });
              break;
            case "REWIND":
              const rewindTime = Math.max(0, video.currentTime - (data.time || 10));
              console.log("[VIDEO] 巻き戻し実行前:", { currentTime: video.currentTime });
              video.currentTime = rewindTime;
              console.log("[VIDEO] 巻き戻し実行後:", { currentTime: video.currentTime, targetTime: rewindTime });
              break;
            case "FORWARD":
              const forwardTime = Math.min(video.duration || 0, video.currentTime + (data.time || 10));
              console.log("[VIDEO] 早送り実行前:", { currentTime: video.currentTime });
              video.currentTime = forwardTime;
              console.log("[VIDEO] 早送り実行後:", { currentTime: video.currentTime, targetTime: forwardTime });
              break;
            default:
              console.warn(`[VIDEO] 不明な命令: ${data.instruction}`);
          }

          console.log(`[VIDEO] ${data.instruction} 実行完了: ${data.message}`);
        }
      } catch (error) {
        console.error("[SSE] データ解析エラー:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[SSE] 接続エラー:", error);
      console.log("[SSE] EventSource状態:", eventSource.readyState);
      console.log("[SSE] EventSource状態の意味:", {
        0: "CONNECTING",
        1: "OPEN", 
        2: "CLOSED"
      }[eventSource.readyState]);
      console.log("[SSE] URL:", eventSource.url);
      
      // 接続が閉じられた場合の再接続を試行
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("[SSE] 接続が閉じられました。5秒後に再接続を試行します...");
        setTimeout(() => {
          console.log("[SSE] 再接続を試行中...");
          // useEffectを再実行させるための状態変更は行わず、ログのみ
        }, 5000);
      }
    };

    // クリーンアップ
    return () => {
      console.log("[SSE] 接続クローズ");
      eventSource.close();
    };
  }, [recipeId, showAutoplayWarning]);

  // video要素の状態を監視
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const logVideoState = () => {
        console.log("[VIDEO] 状態変更:", {
          paused: video.paused,
          currentTime: video.currentTime,
          duration: video.duration,
          readyState: video.readyState
        });
      };

      video.addEventListener('loadedmetadata', () => {
        console.log("[VIDEO] メタデータ読み込み完了:", {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      });

      video.addEventListener('timeupdate', logVideoState);
      video.addEventListener('play', () => console.log("[VIDEO] 再生開始"));
      video.addEventListener('pause', () => console.log("[VIDEO] 一時停止"));

      return () => {
        video.removeEventListener('timeupdate', logVideoState);
        video.removeEventListener('play', () => console.log("[VIDEO] 再生開始"));
        video.removeEventListener('pause', () => console.log("[VIDEO] 一時停止"));
      };
    }
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className={className}
        controls
        src={videoSrc}
        data-recipe-id={recipeId}
        onClick={() => setUserInteracted(true)}
        onLoadStart={() => console.log("[VIDEO] 読み込み開始")}
        onCanPlay={() => console.log("[VIDEO] 再生可能")}
        onError={(e) => console.error("[VIDEO] エラー:", e)}
      >
        <track kind="captions" />
      </video>
      
      {/* 自動再生警告バナー */}
      {showWarning && (
        <div className="absolute top-2 left-2 right-2 bg-yellow-500 text-black px-4 py-2 rounded-md text-sm font-medium z-10">
          ⚠️ 動画をクリックして最初に再生してから、音声コマンドをお試しください
        </div>
      )}
      
    </div>
  );
}
