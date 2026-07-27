import { z } from "zod";
export declare const DetachImageSchema: z.ZodObject<{
  entityId: z.ZodString;
  imageId: z.ZodString;
}, z.core.$strip>;
export type DetachImageInput = z.infer<typeof DetachImageSchema>;
