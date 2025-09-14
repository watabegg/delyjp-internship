"use client";

import { useEffect, useRef, useState } from "react";

interface VideoControllerProps {
  recipeId: string;
  videoSrc: string;
  className?: string;
}

export function VideoController({ recipeId, videoSrc, className }: VideoControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // 自動再生警告を表示する関数
  const showAutoplayWarning = () => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000); // 5秒後に非表示
  };

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
    // Server-Sent Events で制御イベントを受信
    const eventSource = new EventSource(`/api/video-events?recipeId=${recipeId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] 受信イベント:", data);

        if (data.type === "video-control" && data.recipeId === recipeId) {
          const video = videoRef.current;
          if (!video) return;

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
              video.pause();
              break;
            case "REWIND":
              video.currentTime = Math.max(0, video.currentTime - (data.時間 || 10));
              break;
            case "FORWARD":
              video.currentTime = Math.min(video.duration || 0, video.currentTime + (data.時間 || 10));
              break;
          }

          console.log(`[VIDEO] ${data.instruction} 実行: ${data.message}`);
        }
      } catch (error) {
        console.error("[SSE] データ解析エラー:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[SSE] 接続エラー:", error);
    };

    // クリーンアップ
    return () => {
      eventSource.close();
    };
  }, [recipeId]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className={className}
        controls
        src={videoSrc}
        data-recipe-id={recipeId}
        onClick={() => setUserInteracted(true)}
      />
      
      {/* 自動再生警告バナー */}
      {showWarning && (
        <div className="absolute top-2 left-2 right-2 bg-yellow-500 text-black px-4 py-2 rounded-md text-sm font-medium z-10">
          ⚠️ 動画をクリックして最初に再生してから、音声コマンドをお試しください
        </div>
      )}
      
    </div>
  );
}
