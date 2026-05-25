export const STATUS_COLORS = {
  "в обработке": "bg-yellow-400/15 text-yellow-700 dark:text-yellow-400",
  "в работе":    "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "предложение": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  "согласована": "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  "выполнена":   "bg-green-500/15 text-green-700 dark:text-green-400",
  "отменена":    "bg-red-accent/10 text-red-accent",
};

export const TERMINAL = ["выполнена", "отменена"];
export const isFinal = (s) => TERMINAL.includes(s);

export const USER_EDITABLE    = ["в обработке"];
export const USER_CANCELLABLE = ["в обработке"];
export const USER_CLOSEABLE   = ["согласована"];
