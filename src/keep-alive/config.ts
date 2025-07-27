export type KeepAliveConfig = typeof keepAliveConfig;

export const keepAliveConfig = {
  table: "keep-alive",
  column: "name",

  // If true rows can be inserted / deleted in the keep-alive table
  allowInsertionAndDeletion: true,
  // If true, the initial random SELECT query will be skipped
  disableRandomStringQuery: false,
  // Maximum rows in table before the oldest entry is pruned
  sizeBeforeDeletions: 10,

  // Log detailed errors to stdout when something fails
  consoleLogOnError: true,

  // Additional endpoints that should be pinged at the same time (optional)
  otherEndpoints: [] as string[],
} as const;

