const INSUFFICIENT_STOCK_PREFIX = 'INSUFFICIENT_STOCK';

export const insufficientStockError = (productId: string, available: number) =>
  new Error(`${INSUFFICIENT_STOCK_PREFIX}:${productId}:${available}`);

export const parseInsufficientStockError = (
  error: unknown,
): { productId: string; available: number } | null => {
  if (!(error instanceof Error)) return null;
  const match = error.message.match(
    /^INSUFFICIENT_STOCK:(.+):(\d+(?:\.\d+)?)$/,
  );
  if (!match) return null;
  return { productId: match[1], available: Number(match[2]) };
};
