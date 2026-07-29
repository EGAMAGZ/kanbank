import { type CreateTimelineEntryInput } from "../../dto/timeline.dto.js";
import type { TimelineRepository } from "../../../domain/repositories/timeline.repository.js";
export declare class AddTimelineEntryUseCase {
  private timelineRepo;
  constructor(timelineRepo: TimelineRepository);
  execute(input: CreateTimelineEntryInput): Promise<string>;
}
