export async function GET() {
	return new Response(JSON.stringify({ text: null }), {
		headers: { "Content-Type": "application/json" },
	});
}

export async function POST() {
	return new Response(JSON.stringify({ success: true, deprecated: true }), {
		headers: { "Content-Type": "application/json" },
	});
}
