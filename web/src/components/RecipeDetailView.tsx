"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { RecipeDetail } from "@/types/recipe";
import InstructionDialog, {
	type CuttingMethodKey,
	cuttingMethodOptions,
	getInstructionVideoUrl,
} from "./InstructionDialog";

export function RecipeDetailView({ recipe }: { recipe: RecipeDetail }) {
	const { attributes } = recipe;
	const [selectedMethod, setSelectedMethod] = useState<CuttingMethodKey | "">(
		"",
	);
	const [isInstructionOpen, setIsInstructionOpen] = useState(false);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-6">
				<div className="mb-4">
					<Link href="/" className="text-blue-600 hover:underline">
						← 一覧に戻る
					</Link>
				</div>
				<h1 className="text-2xl md:text-3xl font-bold mb-4">
					{attributes.title}
				</h1>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="md:col-span-2">
						<div className="relative w-full aspect-video bg-black">
							{attributes.video_url ? (
								<video
									controls
									className="w-full h-full"
									src={attributes.video_url}
								>
									<track
										kind="captions"
										src="/captions/placeholder.vtt"
										srcLang="ja"
										label="Japanese captions"
										default
									/>
								</video>
							) : attributes.thumbnail_url ? (
								<Image
									src={attributes.thumbnail_url}
									alt={attributes.title}
									fill
									className="object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-gray-400">
									No Media
								</div>
							)}
						</div>
						{attributes.description && (
							<p className="mt-4 whitespace-pre-wrap text-gray-800">
								{attributes.description}
							</p>
						)}
						{/* 切り方動画: 選択と起動 */}
						<div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
							<label className="text-sm text-gray-700">
								切り方を選択
								<select
									className="ml-2 border rounded px-2 py-1 text-sm"
									value={selectedMethod}
									onChange={(e) =>
										setSelectedMethod(
											(e.target.value || "") as CuttingMethodKey | "",
										)
									}
								>
									<option value="">選択してください</option>
									{cuttingMethodOptions.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</select>
							</label>
							<button
								type="button"
								disabled={
									!selectedMethod || !getInstructionVideoUrl(selectedMethod)
								}
								onClick={() => setIsInstructionOpen(true)}
								className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
							>
								切り方を確認
							</button>
						</div>
					</div>
					<aside className="md:col-span-1 space-y-4">
						<div className="bg-white p-4 rounded-md shadow">
							<h2 className="font-semibold mb-2">基本情報</h2>
							<ul className="text-sm text-gray-700 space-y-1">
								{attributes.cooking_time != null && (
									<li>⏱️ 調理時間: {attributes.cooking_time}分</li>
								)}
								{attributes.estimated_cost != null && (
									<li>💰 コスト: ¥{attributes.estimated_cost}</li>
								)}
								{attributes.review_score != null && (
									<li>★ レビュー: {attributes.review_score.toFixed(1)}</li>
								)}
								{attributes.category && attributes.category.length > 0 && (
									<li>🏷️ カテゴリ: {attributes.category.join(", ")}</li>
								)}
							</ul>
						</div>
						{attributes.ingredients && (
							<div className="bg-white p-4 rounded-md shadow">
								<h2 className="font-semibold mb-2">材料</h2>
								<pre className="text-sm whitespace-pre-wrap text-gray-800">
									{attributes.ingredients}
								</pre>
							</div>
						)}
						{attributes.instructions && attributes.instructions.length > 0 && (
							<div className="bg-white p-4 rounded-md shadow">
								<h2 className="font-semibold mb-2">作り方</h2>
								<ol className="list-none list-inside space-y-1 text-sm">
									{attributes.instructions.map((step) => (
										<li key={step}>{step}</li>
									))}
								</ol>
							</div>
						)}
						{attributes.tips && attributes.tips.length > 0 && (
							<div className="bg-white p-4 rounded-md shadow">
								<h2 className="font-semibold mb-2">コツ</h2>
								<ul className="list-disc list-inside space-y-1 text-sm">
									{attributes.tips.map((tip) => (
										<li key={tip}>{tip}</li>
									))}
								</ul>
							</div>
						)}
						{attributes.comment && attributes.comment.length > 0 && (
							<div className="bg-white p-4 rounded-md shadow">
								<h2 className="font-semibold mb-2">コメント</h2>
								<ul className="list-disc list-inside space-y-1 text-sm">
									{attributes.comment.map((c) => (
										<li key={c}>{c}</li>
									))}
								</ul>
							</div>
						)}
					</aside>
				</div>
				{/* 切り方動画ダイアログ */}
				<InstructionDialog
					open={isInstructionOpen}
					onClose={() => setIsInstructionOpen(false)}
					method={selectedMethod || null}
				/>
			</div>
		</div>
	);
}
