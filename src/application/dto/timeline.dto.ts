import { z } from "zod";

export const CreateTimelineEntrySchema = z.object({
  taskId: z.string(),
  type: z.enum([
    "created",
    "moved",
    "updated",
    "commented",
    "completed",
    "auto-closed",
    "gold-toggled",
    "pinned",
    "subscribed",
  ]),
  fromStateId: z.string().optional(),
  toStateId: z.string().optional(),
  userId: z.string(),
  userName: z.string(),
  message: z.string(),
});

export type CreateTimelineEntryInput = z.infer<
  typeof CreateTimelineEntrySchema
>;
