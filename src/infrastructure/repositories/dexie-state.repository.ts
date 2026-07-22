import type { Id } from '../../shared/types/index.js';
import type { State } from '../../domain/entities/state.entity.js';
import type { StateRepository } from '../../domain/repositories/state.repository.js';
import { db } from '../database/dexie-db.js';

export class DexieStateRepository implements StateRepository {
  async findByBoard(boardId: Id<'Board'>): Promise<State[]> {
    return db.states.where('boardId').equals(boardId).toArray();
  }

  async findById(id: Id<'State'>): Promise<State | undefined> {
    return db.states.get(id);
  }

  async create(state: State): Promise<Id<'State'>> {
    await db.states.add(state);
    return state.id;
  }

  async update(id: Id<'State'>, changes: Partial<Pick<State, 'title' | 'order' | 'updatedAt'>>): Promise<void> {
    await db.states.update(id, changes);
  }

  async delete(id: Id<'State'>): Promise<void> {
    await db.states.delete(id);
  }

  async reorder(ids: Id<'State'>[]): Promise<void> {
    await db.transaction('rw', db.states, async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.states.update(ids[i], { order: i });
      }
    });
  }
}
