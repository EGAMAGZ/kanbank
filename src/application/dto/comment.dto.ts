import { z } from 'zod';

export const AddCommentSchema = z.object({
  taskId: z.string(),
  markdown: z.string().min(1).max(50000),
});

export type AddCommentInput = z.infer<typeof AddCommentSchema>;

export const UpdateCommentSchema = z.object({
  markdown: z.string().min(1).max(50000),
});

export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
