export type IpcResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function unwrap<T>(response: IpcResponse<T>): T {
  if (!response.success) throw new Error(response.error);
  return response.data;
}

export async function ok<T>(fn: () => Promise<T>): Promise<IpcResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
