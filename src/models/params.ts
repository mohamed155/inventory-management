export interface DataParams<T, F> {
  page: number;
  orderDirection?: 'asc' | 'desc';
  orderProperty?: keyof T;
  filter?: F;
}
