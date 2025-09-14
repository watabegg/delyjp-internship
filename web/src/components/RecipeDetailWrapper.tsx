"use client";

import { useState } from "react";
import type { ServerMessage } from "@/types/express";
import type { RecipeDetail } from "@/types/recipe";
import { RecipeDetailView } from "./RecipeDetailView";
import VoiceInterface from "./VoiceInterface";

export function RecipeDetailWrapper({ recipe }: { recipe: RecipeDetail }) {
	const [message, setMessage] = useState<ServerMessage | null>(null);

	return (
		<>
			<RecipeDetailView recipe={recipe} message={message} />
			<VoiceInterface onResponse={setMessage} />
		</>
	);
}
