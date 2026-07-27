import { z } from "zod";

export const DetachImageSchema = z.object({
  entityId: z.string(),
  imageId: z.string(),
});

export type DetachImageInput = z.infer<typeof DetachImageSchema>;
