import Image from "next/image";
import Link from "next/link";
import type { RecipeSummary } from "@/types/recipe";

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
	const { id, attributes } = recipe;
	return (
		<Link
			href={`/${id}`}
			className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow block"
		>
			<div className="relative aspect-square bg-gray-100">
				{attributes.thumbnail_url ? (
					<Image
						src={attributes.thumbnail_url}
						alt={attributes.title}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-gray-400">
						No Image
					</div>
				)}
			</div>
			<div className="p-4">
				<h3 className="text-lg font-semibold line-clamp-2">
					{attributes.title}
				</h3>
				<div className="mt-2 text-sm text-gray-600 flex gap-3">
					{attributes.cooking_time != null && (
						<span>⏱️ {attributes.cooking_time}分</span>
					)}
					{attributes.estimated_cost != null && (
						<span>¥{attributes.estimated_cost}</span>
					)}
					{attributes.review_score != null && (
						<span>★ {attributes.review_score.toFixed(1)}</span>
					)}
				</div>
			</div>
		</Link>
	);
}
