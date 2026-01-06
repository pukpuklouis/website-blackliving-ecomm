export function reorderList<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  if (from === to) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
