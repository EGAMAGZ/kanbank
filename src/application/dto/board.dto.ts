import { z } from "zod";

export const CreateBoardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;

export const UpdateBoardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
