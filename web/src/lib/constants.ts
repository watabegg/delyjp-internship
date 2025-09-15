export const API_BASE = "http://localhost:3001";

export const API_ROUTES = {
	recipes: {
		list: "/recipes",
		detail: (id: string) => `/recipes/${id}`,
	},
} as const;

export const LOCAL_API = {
	recipes: {
		list: "/api/recipes",
		detail: (id: string) => `/api/recipes/${id}`,
	},
	videos: {
		control: "/api/video-controller",
	},
	tts: {
		events: "/api/tts-events",
		broadcast: "/api/tts-broadcast",
	},
} as const;
