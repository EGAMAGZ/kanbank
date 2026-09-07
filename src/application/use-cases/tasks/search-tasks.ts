import { parseOrThrow } from "../../validation.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import {
  type SearchTasksInput,
  SearchTasksSchema,
} from "../../dto/task.dto.js";
import type { Task } from "../../../domain/entities/task.entity.js";

export class SearchTasksUseCase {
  constructor(private taskRepo: TaskRepository) {}

  async execute(input: SearchTasksInput): Promise<Task[]> {
    const parsed = parseOrThrow(SearchTasksSchema, input);

    return this.taskRepo.search(parsed.boardId, parsed.query);
  }
}
