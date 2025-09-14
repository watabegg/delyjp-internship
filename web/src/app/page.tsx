import { RecipeCard } from "@/components/RecipeCard";
import { apiGet } from "@/lib/api/client";
import { LOCAL_API } from "@/lib/constants";
import type { RecipeSummary, RecipesIndexResponse } from "@/types/recipe";

async function getRecipes(): Promise<RecipesIndexResponse> {
  const qs = new URLSearchParams({ limit: "20", start: "0" }).toString();
  return apiGet(`${LOCAL_API.recipes.list}?${qs}`);
}

export default async function Home() {
  const { recipes } = await getRecipes();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">レシピ一覧</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recipes.map((recipe: RecipeSummary) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  );
}
