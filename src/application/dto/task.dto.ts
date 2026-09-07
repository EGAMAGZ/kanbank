import { z } from "zod";
import { idSchema } from "./id-schema.js";

const taskId = idSchema<"Task">();
const stateId = idSchema<"State">();
const boardId = idSchema<"Board">();

export const CreateTaskSchema = z.object({
  boardId,
  stateId,
  title: z.string().min(1).max(500),
  description: z.string().max(50000).optional(),
  dueDate: z.string().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(50000).optional(),
  stateId: stateId.optional(),
  boardId: boardId.optional(),
  pinned: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
  notNowSince: z.string().nullable().optional(),
  isGold: z.boolean().optional(),
  category: z.string().max(20).optional(),
  subscriberIds: z.array(z.string()).optional(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const MoveTaskSchema = z.object({
  taskId,
  newStateId: stateId,
  order: z.number().int().min(0),
});

export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;

export const SearchTasksSchema = z.object({
  boardId,
  query: z.string().min(1),
});

export type SearchTasksInput = z.infer<typeof SearchTasksSchema>;