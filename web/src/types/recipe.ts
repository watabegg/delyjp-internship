// Types matching openapi.yaml

export type RecipeSummary = {
	id: string;
	type: "videos";
	attributes: {
		title: string;
		thumbnail_url: string | null;
		cooking_time: number | null;
		estimated_cost: number | null;
		review_score: number | null;
		category: string[] | null;
	};
};

export type RecipeDetail = {
	id: string;
	type: "videos";
	attributes: {
		title: string;
		description: string | null;
		cooking_time: number | null;
		estimated_cost: number | null;
		ingredients: string | null;
		instructions: string[] | null;
		tips: string[] | null;
		review_score: number | null;
		video_url: string | null;
		thumbnail_url: string | null;
		category: string[] | null;
		comment: string[] | null;
		taberepos: string[] | null;
	};
};

export type RecipesIndexResponse = {
	total: number;
	recipes: RecipeSummary[];
};
