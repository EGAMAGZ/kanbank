import { z } from "zod";
import type { Id } from "../../shared/types/id.js";

export function idSchema<const T extends string>(): z.ZodType<Id<T>> {
  return z.string() as unknown as z.ZodType<Id<T>>;
}