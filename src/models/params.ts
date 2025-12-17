export interface DataParams<T> {
  page: number;
  orderDirection?: 'asc' | 'desc';
  orderProperty?: keyof T;
  filter?: Record<keyof T, T[keyof T]> | undefined;
}
