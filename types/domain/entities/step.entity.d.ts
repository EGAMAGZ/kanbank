import type { Id, Timestamped } from "../../shared/types/index.js";
export interface Step extends Timestamped {
    id: Id<"Step">;
    taskId: Id<"Task">;
    text: string;
    checked: boolean;
    order: number;
}
export interface CreateStepData {
    id: Id<"Step">;
    taskId: Id<"Task">;
    text: string;
    checked?: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}
export declare function createStep(data: CreateStepData): Step;
