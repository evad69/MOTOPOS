/** Returns a placeholder AI route response until the chat handler is implemented. */
export async function POST() {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
