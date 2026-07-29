import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { type MoveTaskInput } from "../../dto/task.dto.js";
export interface MoveTaskOptions {
  autoDiscard?: boolean;
  targetIsNotNow?: boolean;
}
export declare class MoveTaskUseCase {
  private taskRepo;
  constructor(taskRepo: TaskRepository);
  execute(input: MoveTaskInput, options?: MoveTaskOptions): Promise<void>;
}
