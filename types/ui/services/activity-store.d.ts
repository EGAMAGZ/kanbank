export interface ActivityEvent {
    id: string;
    type: "created" | "moved" | "updated" | "commented" | "completed";
    label: string;
    detail: string;
    taskId: string;
    boardId: string;
    timestamp: string;
    fromStateId?: string;
    toStateId?: string;
    isGold?: boolean;
}
declare class ActivityStoreImpl {
    private events;
    private maxEvents;
    constructor();
    private add;
    getAll(): ActivityEvent[];
}
export declare const activityStore: ActivityStoreImpl;
export {};
