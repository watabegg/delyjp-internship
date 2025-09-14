"use client";

import { useMemo, useState } from "react";
import ActionRenderer from "@/components/ActionRenderer";
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
			// 公開テスト動画（汎用サンプル）
			video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
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
			label: "timer START 5s",
			message: { kind: "timer", payload: { method: "START", seconds: 5 } },
		},
		{
			label: "timer START 300s",
			message: { kind: "timer", payload: { method: "START", seconds: 300 } },
		},
		{
			label: "timer STOP (5s)",
			message: { kind: "timer", payload: { method: "STOP", seconds: 5 } },
		},
	);

	// methodToVideo for all cutting methods
	const cuttingKeys = Object.keys(methodToVideoUrl) as CuttingMethodKey[];
	cuttingKeys.forEach((key) => {
		messages.push(
			{
				label: `methodToVideo START (${key})`,
				message: {
					kind: "methodToVideo",
					payload: { method: "START", videoType: key },
				},
			},
			{
				label: `methodToVideo STOP (${key})`,
				message: {
					kind: "methodToVideo",
					payload: { method: "STOP", videoType: key },
				},
			},
		);
	});

	// videoControll
	messages.push(
		{
			label: "videoControll PLAY",
			message: { kind: "videoControll", payload: { instruction: "PLAY" } },
		},
		{
			label: "videoControll PAUSE",
			message: { kind: "videoControll", payload: { instruction: "PAUSE" } },
		},
		{
			label: "videoControll REWIND 5s",
			message: {
				kind: "videoControll",
				payload: { instruction: "REWIND", time: 5 },
			},
		},
		{
			label: "videoControll REWIND (default 10s)",
			message: { kind: "videoControll", payload: { instruction: "REWIND" } },
		},
		{
			label: "videoControll FORWARD 15s",
			message: {
				kind: "videoControll",
				payload: { instruction: "FORWARD", time: 15 },
			},
		},
	);

	// withTalkUser (現在のUIでは副作用なしだが、受信時の安定性確認)
	messages.push({
		label: "withTalkUser 'こんにちは'",
		message: { kind: "withTalkUser", payload: { talkMessage: "こんにちは" } },
	});

	// error (現在のUIでは副作用なしだが、受信時の安定性確認)
	messages.push({
		label: "error 'サンプルエラー'",
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
						<RecipeDetailView recipe={recipe} />
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

						{/* 実際の実行結果をこのレベルでレンダリング */}
						{selected && (
							<ActionRenderer message={selected} recipeId={recipe.id} />
						)}
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
							は閉じる判定のみでダイアログは表示されません。
						</li>
					</ul>
				</section>
			</div>
		</div>
	);
}
