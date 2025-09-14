import { NextResponse } from "next/server";
import { API_BASE, API_ROUTES } from "@/lib/constants";

export const dynamic = "force-dynamic"; // always fetch fresh

export async function GET(request: Request) {
	const { search } = new URL(request.url);
	const upstream = `${API_BASE}${API_ROUTES.recipes.list}${search}`;

	const res = await fetch(upstream, {
		headers: { Accept: "application/json" },
		// Avoid caching to reflect fresh Rails result
		cache: "no-store",
	});

	const body = await res.text();
	return new NextResponse(body, {
		status: res.status,
		headers: {
			"content-type": res.headers.get("content-type") ?? "application/json",
		},
	});
}
