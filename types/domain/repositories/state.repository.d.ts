import type { Id } from '../../shared/types/index.js';
import type { State } from '../entities/state.entity.js';
export interface StateRepository {
    findByBoard(boardId: Id<'Board'>): Promise<State[]>;
    findById(id: Id<'State'>): Promise<State | undefined>;
    create(state: State): Promise<Id<'State'>>;
    update(id: Id<'State'>, changes: Partial<Pick<State, 'title' | 'order' | 'updatedAt'>>): Promise<void>;
    delete(id: Id<'State'>): Promise<void>;
    reorder(ids: Id<'State'>[]): Promise<void>;
}
