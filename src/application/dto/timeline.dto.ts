import { z } from "zod";
import { idSchema } from "./id-schema.js";

const taskId = idSchema<"Task">();
const stateId = idSchema<"State">();

export const CreateTimelineEntrySchema = z.object({
  taskId,
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
  fromStateId: stateId.optional(),
  toStateId: stateId.optional(),
  userId: z.string(),
  userName: z.string(),
  message: z.string(),
});

export type CreateTimelineEntryInput = z.infer<
  typeof CreateTimelineEntrySchema
>;