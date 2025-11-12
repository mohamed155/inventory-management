export type User = {
  id?: string;
  firstname: string;
  lastname: string;
  username: string;
  password: string;
};

export type CurrentUser = Omit<User, 'password'>;
