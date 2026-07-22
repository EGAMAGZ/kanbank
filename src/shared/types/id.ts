export type Id<T extends string = string> = string & { readonly __brand: T };

export function generateId<T extends string = string>(): Id<T> {
  return crypto.randomUUID() as Id<T>;
}
