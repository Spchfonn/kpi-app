export async function apiGet<T>(url: string): Promise<T> {
	const res = await fetch(url, { cache: "no-store" });
	const j = await res.json();
	if (!j.ok) throw new Error(j.message ?? "request failed");
	return j;
}
  
export async function apiPost<T>(url: string, body?: any): Promise<T> {
	const res = await fetch(url, {
	  method: "POST",
		headers: { "content-type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});
	const j = await res.json();
	if (!j.ok) throw new Error(j.message ?? "request failed");
	return j;
}