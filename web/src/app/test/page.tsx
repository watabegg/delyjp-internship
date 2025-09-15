"use client";

import { useMemo, useState } from "react";
import { RecipeDetailView } from "@/components/RecipeDetailView";
import type { ServerMessage } from "@/types/express";
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

// 自然言語でのコマンド例一覧（クリックでAPIに送る）
function buildNaturalLanguageCommands(): string[] {
	return [
		// タイマー
		"タイマー5分セットして",
		"タイマーを10秒で開始",
		"タイマーを停止",
		"タイマーをリセット",
		"タイマーを再開",
		"タイマーを閉じて",
		// 動画操作
		"動画を再生して",
		"動画を一時停止して",
		"5秒巻き戻して",
		"15秒早送りして",
		// 作り方動画（切り方など）
		"いちょう切りのやり方を見せて",
		"玉ねぎのみじん切りを再生",
		"作り方動画を止めて",
		"作り方動画を閉じて",
		// 会話
		"次の手順を教えて",
		"こんにちは",
	];
}

export default function TestPage() {
	const recipe = useMemo(buildMockRecipe, []);
	const queries = useMemo(() => buildNaturalLanguageCommands(), []);
	const [selected, setSelected] = useState<ServerMessage | null>(null);
	const [loading, setLoading] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function sendQuery(q: string) {
		try {
			setError(null);
			setLoading(q);
			setSelected(null);
			const res = await fetch(
				`/api/voice-command?recipe_id=${encodeURIComponent(recipe.id)}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ speechText: q }),
				},
			);
			const data = (await res.json()) as ServerMessage;
			setSelected(data);
			console.log("API応答:", data);
		} catch (e) {
			console.error(e);
			setError("API通信に失敗しました");
		} finally {
			setLoading(null);
		}
	}

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
							<h2 className="font-semibold mb-3">
								自然言語 → API → ServerMessage
							</h2>
							<div className="flex gap-2 mb-3">
								<button
									type="button"
									className="px-3 py-1 bg-gray-200 rounded text-sm"
									onClick={() => {
										setSelected(null);
										setError(null);
									}}
									aria-label="clear-selected"
								>
									Clear
								</button>
							</div>
							{error && <p className="text-red-600 text-sm mb-2">{error}</p>}
							<ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
								{queries.map((q) => (
									<li key={q}>
										<button
											type="button"
											onClick={() => sendQuery(q)}
											className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 text-sm disabled:opacity-50"
											disabled={loading !== null}
										>
											{loading === q ? "送信中…" : q}
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
							右側の自然言語ボタンをクリックすると、API (/api/voice-command) に
							POST され、返却された <code>ServerMessage</code> を ActionRenderer
							が処理します。
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
