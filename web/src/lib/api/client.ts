export async function apiGet(path: string, init?: RequestInit) {
	// サーバー側のfetchは相対パス不可のため、相対ならオリジンを補完
	const isAbsolute = /^https?:\/\//i.test(path);
	let url = path;
	if (!isAbsolute && typeof window === "undefined") {
		const origin =
			process.env.NEXT_PUBLIC_APP_ORIGIN ||
			`http://localhost:${process.env.PORT ?? "3000"}`;
		url = `${origin}${path}`;
	}

	const res = await fetch(url, {
		cache: "no-store",
		...init,
		headers: {
			Accept: "application/json",
			...(init?.headers || {}),
		},
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(
			`API GET ${url} failed: ${res.status} ${res.statusText} ${text}`,
		);
	}
	return res.json();
}
