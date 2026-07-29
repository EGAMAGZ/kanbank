import { z } from "zod";
export declare const AddCommentSchema: z.ZodObject<{
    taskId: z.ZodString;
    markdown: z.ZodString;
}, z.core.$strip>;
export type AddCommentInput = z.infer<typeof AddCommentSchema>;
export declare const UpdateCommentSchema: z.ZodObject<{
    markdown: z.ZodString;
}, z.core.$strip>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
