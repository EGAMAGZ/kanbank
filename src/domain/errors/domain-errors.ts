export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`);
    this.name = "EntityNotFoundError";
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStateTransitionError";
  }
}

export class RepositoryError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryError";
  }
}

export class StorageError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export class ImageStorageError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "ImageStorageError";
  }
}
