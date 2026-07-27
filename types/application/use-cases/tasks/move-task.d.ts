import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { type MoveTaskInput } from "../../dto/task.dto.js";
export declare class MoveTaskUseCase {
  private taskRepo;
  constructor(taskRepo: TaskRepository);
  execute(input: MoveTaskInput): Promise<void>;
}
