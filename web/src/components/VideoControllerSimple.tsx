"use client";

import { useEffect, useRef, useState } from "react";

interface VideoControllerSimpleProps {
  recipeId: string;
  videoSrc: string;
  className?: string;
}

export function VideoControllerSimple({ recipeId, videoSrc, className }: VideoControllerSimpleProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [_userInteracted, setUserInteracted] = useState(false);
  const [lastCommandId, setLastCommandId] = useState<string>("");

  // 自動再生警告を表示する関数
  const showAutoplayWarning = () => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);
  };

  // ユーザーのインタラクションを検知
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      setShowWarning(false);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // ポーリングでビデオ制御コマンドをチェック
  useEffect(() => {
    console.log("[POLLING] ポーリング開始:", recipeId);
    
    const checkForCommands = async () => {
      try {
        const response = await fetch(`/api/video-commands?recipeId=${recipeId}&lastCommandId=${lastCommandId}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.commands && data.commands.length > 0) {
            console.log("[POLLING] 新しいコマンド受信:", data.commands);
            
            for (const command of data.commands) {
              await executeVideoCommand(command);
              setLastCommandId(command.id);
            }
          }
        }
      } catch (error) {
        console.error("[POLLING] エラー:", error);
      }
    };

    const executeVideoCommand = async (command: any) => {
      const video = videoRef.current;
      if (!video) {
        console.warn("[VIDEO] ビデオ要素が見つかりません");
        return;
      }

      console.log(`[VIDEO] コマンド実行: ${command.instruction}`);

      switch (command.instruction) {
        case "PLAY":
          try {
            await video.play();
            console.log("[VIDEO] 再生成功");
          } catch (error: any) {
            if (error.name === 'NotAllowedError') {
              console.warn("⚠️ 自動再生が制限されています");
              showAutoplayWarning();
            } else {
              console.error("再生エラー:", error);
            }
          }
          break;
          
        case "PAUSE":
          video.pause();
          console.log("[VIDEO] 一時停止");
          break;
          
        case "REWIND":
          video.currentTime = Math.max(0, video.currentTime - (command.time || 10));
          console.log(`[VIDEO] ${command.time || 10}秒巻き戻し`);
          break;
          
        case "FORWARD":
          video.currentTime = Math.min(video.duration || 0, video.currentTime + (command.time || 10));
          console.log(`[VIDEO] ${command.time || 10}秒早送り`);
          break;
      }
    };

    // 1秒ごとにポーリング
    const interval = setInterval(checkForCommands, 1000);

    return () => {
      console.log("[POLLING] ポーリング停止");
      clearInterval(interval);
    };
  }, [recipeId, lastCommandId]);

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
