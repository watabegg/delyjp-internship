import { NextResponse } from "next/server";
import { API_BASE, API_ROUTES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
	_req: Request,
	{ params }: { params: { id: string } },
) {
	const upstream = `${API_BASE}${API_ROUTES.recipes.detail(params.id)}`;

	const res = await fetch(upstream, {
		headers: { Accept: "application/json" },
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
