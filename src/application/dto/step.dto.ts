import { z } from "zod";

export const CreateStepSchema = z.object({
  taskId: z.string(),
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
