export declare const MANDATORY_STATES: readonly ["Not now", "Maybe?", "Done"];
export declare const LOCAL_STORAGE_KEYS: {
  readonly lastOpenedBoard: "kanbank:lastOpenedBoard";
  readonly preferences: "kanbank:preferences";
  readonly autoDiscardDays: "kanbank:autoDiscardDays";
};
export declare function getAutoDiscardDays(): number | null;
export declare function setAutoDiscardDays(days: number | null): void;
