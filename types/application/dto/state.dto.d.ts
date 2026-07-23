import { z } from 'zod';
export declare const CreateStateSchema: z.ZodObject<{
    boardId: z.ZodString;
    title: z.ZodString;
    order: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type CreateStateInput = z.infer<typeof CreateStateSchema>;
export declare const UpdateStateSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type UpdateStateInput = z.infer<typeof UpdateStateSchema>;
export declare const ReorderStatesSchema: z.ZodObject<{
    boardId: z.ZodString;
    stateIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type ReorderStatesInput = z.infer<typeof ReorderStatesSchema>;
