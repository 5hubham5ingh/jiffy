export type UserArguments = {
  mode: string;
  iconSize: number;
  preset: 1 | 2 | 3 | 4;
  printCategory: boolean;
  fzfArgs: string[];
  refresh: boolean;
  terminal: string;
  clipboard: 'xclip' | 'wl';
  inject: () => null;
  pLimit: number;
  disableNotification: boolean;
};

declare global {
  const USER_ARGUMENTS: UserArguments;
}
