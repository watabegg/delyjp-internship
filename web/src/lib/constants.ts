export const API_BASE = "http://localhost:3001"; // Rails origin

// Upstream (Rails) paths
export const API_ROUTES = {
	recipes: {
		list: "/recipes",
		detail: (id: string) => `/recipes/${id}`,
	},
} as const;

// Next.js local API proxy paths
export const LOCAL_API = {
	recipes: {
		list: "/api/recipes",
		detail: (id: string) => `/api/recipes/${id}`,
	},
} as const;
