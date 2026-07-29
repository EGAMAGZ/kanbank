import { z } from "zod";
export declare const CreateTimelineEntrySchema: z.ZodObject<{
    taskId: z.ZodString;
    type: z.ZodEnum<{
        pinned: "pinned";
        created: "created";
        moved: "moved";
        updated: "updated";
        commented: "commented";
        completed: "completed";
        "auto-closed": "auto-closed";
        "gold-toggled": "gold-toggled";
        subscribed: "subscribed";
    }>;
    fromStateId: z.ZodOptional<z.ZodString>;
    toStateId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    userName: z.ZodString;
    message: z.ZodString;
}, z.core.$strip>;
export type CreateTimelineEntryInput = z.infer<typeof CreateTimelineEntrySchema>;
