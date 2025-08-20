import Image from "next/image";

interface Recipe {
	uuid: string;
	title: string;
	thumbnail: string;
	video: string;
}

async function getRecipes(): Promise<Recipe[]> {
	const response = await fetch("http://localhost:3001/api/recipes", {
		cache: "no-store",
	});
	// console.log(response.json());
	return response.json();
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
	return (
		<div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
				<h3 className="text-lg font-semibold line-clamp-2">{recipe.title}</h3>
			</div>
		</div>
	);
}

export default async function Home() {
	const recipes = await getRecipes();

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8 text-gray-800">レシピ一覧</h1>
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
			</div>
		</div>
	);
}
