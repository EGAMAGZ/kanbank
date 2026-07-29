import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import { type UpdateStateInput } from "../../dto/state.dto.js";
import type { Id } from "../../../shared/types/index.js";
export declare class UpdateStateUseCase {
  private stateRepo;
  constructor(stateRepo: StateRepository);
  execute(id: Id<"State">, input: UpdateStateInput): Promise<void>;
}
