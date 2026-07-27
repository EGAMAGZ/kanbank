import { z } from "zod";
export declare const CreateBoardSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export declare const UpdateBoardSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
