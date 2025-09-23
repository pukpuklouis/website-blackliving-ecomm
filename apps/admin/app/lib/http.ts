export async function safeParseJSON(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch (error) {
    return null;
  }
}
