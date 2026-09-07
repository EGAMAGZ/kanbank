import { z } from "zod";
import { idSchema } from "./id-schema.js";

const boardId = idSchema<"Board">();
const stateId = idSchema<"State">();

export const CreateStateSchema = z.object({
  boardId,
  title: z.string().min(1).max(100),
  color: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateStateInput = z.infer<typeof CreateStateSchema>;

export const UpdateStateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export type UpdateStateInput = z.infer<typeof UpdateStateSchema>;

export const ReorderStatesSchema = z.object({
  boardId,
  stateIds: z.array(stateId).min(1),
});

export type ReorderStatesInput = z.infer<typeof ReorderStatesSchema>;