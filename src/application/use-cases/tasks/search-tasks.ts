import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import {
  type SearchTasksInput,
  SearchTasksSchema,
} from "../../dto/task.dto.js";
import { ValidationError } from "../../../domain/errors/domain-errors.js";
import type { Task } from "../../../domain/entities/task.entity.js";

export class SearchTasksUseCase {
  constructor(private taskRepo: TaskRepository) {}

  async execute(input: SearchTasksInput): Promise<Task[]> {
    const parsed = SearchTasksSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    return this.taskRepo.search(parsed.data.boardId as any, parsed.data.query);
  }
}
