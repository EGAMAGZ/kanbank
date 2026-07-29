export type Id<T extends string = string> = string & {
  readonly __brand: T;
};
export declare function generateId<T extends string = string>(): Id<T>;
