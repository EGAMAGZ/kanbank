import { z } from "zod";
import { idSchema } from "./id-schema.js";

const taskId = idSchema<"Task">();

export const CreateStepSchema = z.object({
  taskId,
  text: z.string().min(1).max(1000),
  order: z.number().int().min(0),
});

export type CreateStepInput = z.infer<typeof CreateStepSchema>;

export const UpdateStepSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  checked: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export type UpdateStepInput = z.infer<typeof UpdateStepSchema>;