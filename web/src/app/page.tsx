async function getRecipes() {
	const response = await fetch("http://localhost:3001/api/recipes");
	return response.json();
}

export default async function Home() {
	const recipes = await getRecipes();

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Recipes</h1>
			<pre className="bg-gray-100 p-4 rounded overflow-auto">
				{JSON.stringify(recipes, null, 2)}
			</pre>
		</div>
	);
}
