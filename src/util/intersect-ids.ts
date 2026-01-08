export const intersectIds = (lists: (string[] | undefined)[]) =>
  lists
    .filter(Boolean)
    .reduce<string[] | undefined>(
      (acc, ids) => (acc ? acc.filter((id) => ids?.includes(id)) : ids),
      undefined,
    );
