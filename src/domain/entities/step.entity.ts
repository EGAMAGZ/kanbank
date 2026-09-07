import type { Id } from "../../shared/types/id.js";
import type { Timestamped } from "../../shared/types/common.js";

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

export function createStep(data: CreateStepData): Step {
  return {
    id: data.id,
    taskId: data.taskId,
    text: data.text,
    checked: data.checked ?? false,
    order: data.order,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
