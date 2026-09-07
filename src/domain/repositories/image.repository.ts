import type { Id } from "../../shared/types/id.js";
import type { ImageRef } from "../value-objects/image-ref.js";

export interface ImageRepository {
  store(blob: Blob, metadata: Omit<ImageRef, "id">): Promise<Id<"Image">>;
  get(id: Id<"Image">): Promise<Blob | undefined>;
  delete(id: Id<"Image">): Promise<void>;
}
