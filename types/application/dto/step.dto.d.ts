import { z } from "zod";
export declare const CreateStepSchema: z.ZodObject<{
  taskId: z.ZodString;
  text: z.ZodString;
  order: z.ZodNumber;
}, z.core.$strip>;
export type CreateStepInput = z.infer<typeof CreateStepSchema>;
export declare const UpdateStepSchema: z.ZodObject<{
  text: z.ZodOptional<z.ZodString>;
  checked: z.ZodOptional<z.ZodBoolean>;
  order: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type UpdateStepInput = z.infer<typeof UpdateStepSchema>;
