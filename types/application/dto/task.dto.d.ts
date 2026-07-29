import { z } from "zod";
export declare const CreateTaskSchema: z.ZodObject<{
    boardId: z.ZodString;
    stateId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export declare const UpdateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    stateId: z.ZodOptional<z.ZodString>;
    pinned: z.ZodOptional<z.ZodBoolean>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notNowSince: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isGold: z.ZodOptional<z.ZodBoolean>;
    category: z.ZodOptional<z.ZodString>;
    subscriberIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export declare const MoveTaskSchema: z.ZodObject<{
    taskId: z.ZodString;
    newStateId: z.ZodString;
    order: z.ZodNumber;
}, z.core.$strip>;
export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;
export declare const SearchTasksSchema: z.ZodObject<{
    boardId: z.ZodString;
    query: z.ZodString;
}, z.core.$strip>;
export type SearchTasksInput = z.infer<typeof SearchTasksSchema>;
