import Image from "next/image";
import VoiceInterface from "@/components/VoiceInterface";

interface Recipe {
  uuid: string;
  title: string;
  thumbnail: string;
  video: string;
}

async function getRecipes(): Promise<Recipe[]> {
  try {
    const response = await fetch("http://rails-app:3001/api/recipes", {
      cache: "no-store",
    });
    return response.json();
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return [];
  }
}

export default async function Home() {
  const recipes = await getRecipes();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">
          クラシル 音声アシスタント
        </h1>

        {/* 音声インターフェース */}
        <div className="mb-12">
          <VoiceInterface />
        </div>

        {/* レシピ一覧 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">レシピ一覧</h2>
          {recipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.uuid}
                  id={recipe.uuid}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={recipe.thumbnail}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold line-clamp-2">
                      {recipe.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                レシピを読み込み中...
                Railsサーバーが起動していることを確認してください。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
