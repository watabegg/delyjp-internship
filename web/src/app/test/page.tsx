"use client";

import { useMemo, useState } from "react";
import { RecipeDetailView } from "@/components/RecipeDetailView";
import type { ServerMessage } from "@/types/express";
import { type CuttingMethodKey, methodToVideoUrl } from "@/types/express";
import type { RecipeDetail } from "@/types/recipe";

// このページは RecipeDetailView と ActionRenderer を用いて
// /src/types/express.ts に定義された ServerMessage の網羅的ケースを実行・検証するためのテストページです。

function buildMockRecipe(): RecipeDetail {
	return {
		id: "test-recipe-001",
		type: "videos",
		attributes: {
			title: "テスト用レシピ (E2E)",
			description:
				"テストページで使用するダミーのレシピ詳細です。\nSSEによる動画制御と各ダイアログの表示を検証します。",
			cooking_time: 10,
			estimated_cost: 100,
			ingredients: "にんじん 1本\nたまねぎ 1/2個\n塩 少々",
			instructions: ["材料を切る", "フライパンで炒める", "味を整える"],
			tips: ["強火にしすぎない", "塩は最後に入れる"],
			review_score: 4.5,
			video_url:
				"https://video.kurashiru.com/production/videos/013adbe4-3f17-4915-988e-e8e4dd4b1322/original.mp4",
			thumbnail_url: null,
			category: ["テスト", "デモ"],
			comment: ["おいしかった", "簡単でした"],
			taberepos: null,
		},
	};
}

function buildAllMessages(): Array<{ label: string; message: ServerMessage }> {
	const messages: Array<{ label: string; message: ServerMessage }> = [];

	// timer
	messages.push(
		{
			label: "タイマー 1秒 START",
			message: { kind: "timer", payload: { method: "START", seconds: 1 } },
		},
		{
			label: "タイマー 10秒 START",
			message: { kind: "timer", payload: { method: "START", seconds: 10 } },
		},
		{
			label: "タイマー 5秒 START",
			message: { kind: "timer", payload: { method: "START", seconds: 5 } },
		},
		{
			label: "タイマー 5分 START",
			message: { kind: "timer", payload: { method: "START", seconds: 300 } },
		},
		{
			label: "タイマー 5秒 STOP",
			message: { kind: "timer", payload: { method: "STOP", seconds: 5 } },
		},
		{
			label: "タイマー 5秒 RESTART",
			message: { kind: "timer", payload: { method: "RESTART", seconds: 5 } },
		},
		{
			label: "タイマー 5分 RESET",
			message: { kind: "timer", payload: { method: "RESET", seconds: 300 } },
		},
		{
			label: "タイマー 5分 RESTART",
			message: { kind: "timer", payload: { method: "RESTART", seconds: 300 } },
		},
		{
			label: "タイマー 10秒 STOP",
			message: { kind: "timer", payload: { method: "STOP", seconds: 10 } },
		},
		{
			label: "タイマー 10秒 RESET",
			message: { kind: "timer", payload: { method: "RESET", seconds: 10 } },
		},
		{
			label: "タイマー 10秒 RESTART",
			message: { kind: "timer", payload: { method: "RESTART", seconds: 10 } },
		},
		{
			label: "タイマー CLOSE",
			message: { kind: "timer", payload: { method: "CLOSE", seconds: 5 } },
		},
	);

	// methodToVideo for all cutting methods
	const cuttingKeys = Object.keys(methodToVideoUrl) as CuttingMethodKey[];
	cuttingKeys.forEach((key) => {
		messages.push(
			{
				label: `作り方動画 START (${key})`,
				message: {
					kind: "methodToVideo",
					payload: { method: "START", videoType: key },
				},
			},
			{
				label: `作り方動画 STOP (${key})`,
				message: {
					kind: "methodToVideo",
					payload: { method: "STOP", videoType: key },
				},
			},
			{
				label: `作り方動画 CLOSE (${key})`,
				message: {
					kind: "methodToVideo",
					payload: { method: "CLOSE", videoType: key },
				},
			},
			{
				label: `作り方動画 RESET (${key})`,
				message: {
					kind: "methodToVideo",
					payload: { method: "RESET", videoType: key },
				},
			},
			{
				label: `作り方動画 RESTART (${key})`,
				message: {
					kind: "methodToVideo",
					payload: { method: "RESTART", videoType: key },
				},
			},
		);
	});

	// videoControll
	messages.push(
		{
			label: "動画コントロール PLAY",
			message: { kind: "videoControll", payload: { instruction: "PLAY" } },
		},
		{
			label: "動画コントロール PAUSE",
			message: { kind: "videoControll", payload: { instruction: "PAUSE" } },
		},
		{
			label: "動画コントロール REWIND 5s",
			message: {
				kind: "videoControll",
				payload: { instruction: "REWIND", time: 5 },
			},
		},
		{
			label: "動画コントロール REWIND (default 10s)",
			message: { kind: "videoControll", payload: { instruction: "REWIND" } },
		},
		{
			label: "動画コントロール FORWARD 15s",
			message: {
				kind: "videoControll",
				payload: { instruction: "FORWARD", time: 15 },
			},
		},
	);

	messages.push(
		{
			label: "ユーザと話す機能 'こんにちは'",
			message: { kind: "withTalkUser", payload: { talkMessage: "こんにちは" } },
		},
		{
			label: "ユーザと話す機能 '次の手順を教えて'",
			message: {
				kind: "withTalkUser",
				payload: { talkMessage: "次の手順を教えて" },
			},
		},
	);

	messages.push({
		label: "エラー 'サンプルエラー'",
		message: { kind: "error", payload: { message: "サンプルエラー" } },
	});

	return messages;
}

export default function TestPage() {
	const recipe = useMemo(buildMockRecipe, []);
	const allMessages = useMemo(() => buildAllMessages(), []);
	const [selected, setSelected] = useState<ServerMessage | null>(null);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-6 space-y-6">
				<header className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">
						/test: RecipeDetailView 動作検証
					</h1>
					<a href="/" className="text-blue-600 hover:underline text-sm">
						← TOPへ戻る
					</a>
				</header>

				<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<RecipeDetailView recipe={recipe} message={selected} />
					</div>

					<aside className="lg:col-span-1">
						<div className="bg-white rounded-md shadow p-4">
							<h2 className="font-semibold mb-3">メッセージ送出 (網羅)</h2>
							<div className="flex gap-2 mb-3">
								<button
									type="button"
									className="px-3 py-1 bg-gray-200 rounded text-sm"
									onClick={() => setSelected(null)}
									aria-label="clear-selected"
								>
									Clear
								</button>
							</div>
							<ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
								{allMessages.map(({ label, message }) => (
									<li key={label}>
										<button
											type="button"
											onClick={() => setSelected(message)}
											className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 text-sm"
										>
											{label}
										</button>
									</li>
								))}
							</ul>
						</div>
					</aside>
				</section>

				<section className="bg-white rounded-md shadow p-4">
					<h2 className="font-semibold mb-2">説明</h2>
					<ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
						<li>
							左側の RecipeDetailView 内の動画は、SSE
							経由の制御イベントを受け取ります。
						</li>
						<li>
							右側のボタンで <code>ServerMessage</code> を送出し、ActionRenderer
							が適切に処理するか確認できます。
						</li>
						<li>
							videoControll 系は Next.js API (/api/video-controller) を叩き、SSE
							(/api/video-events) を経由して動画を操作します。
						</li>
						<li>
							methodToVideo/timer はそれぞれのダイアログを開閉します。STOP
							は再生/カウントを停止、RESET は先頭に戻して再生、RESTART
							は一時停止から再開します（ダイアログは閉じません）。CLOSE
							はダイアログを閉じます。
						</li>
					</ul>
				</section>
			</div>
		</div>
	);
}
