import { z } from "zod";
import { ValidationError } from "../domain/errors/domain-errors.js";

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues.map((i) => i.message).join(", "),
    );
  }
  return parsed.data;
}