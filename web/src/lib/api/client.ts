export async function apiGet(path: string, init?: RequestInit) {
	const res = await fetch(path, {
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
			`API GET ${path} failed: ${res.status} ${res.statusText} ${text}`,
		);
	}
	return res.json();
}
