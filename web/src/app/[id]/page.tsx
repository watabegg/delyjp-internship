import { RecipeDetailView } from "@/components/RecipeDetailView";
import { apiGet } from "@/lib/api/client";
import { LOCAL_API } from "@/lib/constants";
import type { RecipeDetail } from "@/types/recipe";

async function getRecipe(id: string): Promise<RecipeDetail> {
	return apiGet(LOCAL_API.recipes.detail(id));
}

export default async function RecipeDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const recipe = await getRecipe(params.id);
	return <RecipeDetailView recipe={recipe} />;
}
