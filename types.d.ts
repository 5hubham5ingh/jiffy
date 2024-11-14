export type UserArguments = {
  mode: string;
  iconSize: number;
  preset: 1 | 2 | 3 | 4;
  printCategory: boolean;
  fzfArgs: string[];
  cache: boolean;
  terminal: string;
  inject: () => null;
  pLimit: number;
  disableNotification: boolean;
};

declare global {
  const USER_ARGUMENTS: UserArguments;
}
