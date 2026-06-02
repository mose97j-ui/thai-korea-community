export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= array.length || to >= array.length) {
    return array;
  }
  const copy = [...array];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function reorderIds(ids: string[], activeId: string, overId: string): string[] {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1 || from === to) {
    return ids;
  }
  return arrayMove(ids, from, to);
}

export function mergeGroupOrder(allOrder: string[], groupIds: string[], newGroupOrder: string[]): string[] {
  const groupSet = new Set(groupIds);
  let groupIndex = 0;
  return allOrder.map((id) => (groupSet.has(id) ? newGroupOrder[groupIndex++]! : id));
}
