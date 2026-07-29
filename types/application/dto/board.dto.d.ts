import { z } from "zod";
export declare const CreateBoardSchema: z.ZodObject<{
  title: z.ZodString;
  description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export declare const UpdateBoardSchema: z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  description: z.ZodOptional<z.ZodString>;
  autoCloseDays: z.ZodOptional<z.ZodNumber>;
  autoCloseEnabled: z.ZodOptional<z.ZodBoolean>;
  publicLink: z.ZodOptional<z.ZodBoolean>;
  accessControl: z.ZodOptional<
    z.ZodEnum<{
      everyone: "everyone";
      restricted: "restricted";
    }>
  >;
}, z.core.$strip>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
