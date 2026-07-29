export declare class DomainError extends Error {
  constructor(message: string);
}
export declare class ValidationError extends DomainError {
  constructor(message: string);
}
export declare class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string);
}
export declare class InvalidStateTransitionError extends DomainError {
  constructor(message: string);
}
export declare class RepositoryError extends DomainError {
  constructor(message: string);
}
export declare class StorageError extends DomainError {
  constructor(message: string);
}
export declare class ImageStorageError extends DomainError {
  constructor(message: string);
}
