import type { StateRepository } from '../../../domain/repositories/state.repository.js';
import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import { EntityNotFoundError, InvalidStateTransitionError } from '../../../domain/errors/domain-errors.js';
import { eventBus } from '../../../shared/events/event-bus.js';
import { toISODate } from '../../../shared/types/index.js';
import type { Id } from '../../../shared/types/index.js';

export class DeleteStateUseCase {
  constructor(
    private stateRepo: StateRepository,
    private taskRepo: TaskRepository,
  ) {}

  async execute(id: Id<'State'>): Promise<void> {
    const state = await this.stateRepo.findById(id);
    if (!state) {
      throw new EntityNotFoundError('State', id);
    }

    if (state.isDefault) {
      throw new InvalidStateTransitionError('Cannot delete a mandatory state');
    }

    const states = await this.stateRepo.findByBoard(state.boardId);
    const defaultState = states.find(s => s.isDefault && s.title === 'Maybe?');
    if (!defaultState) {
      throw new InvalidStateTransitionError('No default state found to move tasks to');
    }

    const tasks = await this.taskRepo.findByState(id);
    const now = toISODate();
    for (const task of tasks) {
      await this.taskRepo.update(task.id, {
        stateId: defaultState.id,
        lastActivityAt: now,
        updatedAt: now,
      });
    }

    await this.stateRepo.delete(id);
    eventBus.publish('state.deleted', { id, boardId: state.boardId });
  }
}
