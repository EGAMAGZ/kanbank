import type { Id } from "../../shared/types/id.js";
import type { ImageRef } from "../../domain/value-objects/image-ref.js";
import type { ImageRepository } from "../../domain/repositories/image.repository.js";
import { db, type ImageRecord } from "../database/dexie-db.js";

export class DexieImageRepository implements ImageRepository {
  async store(
    blob: Blob,
    metadata: Omit<ImageRef, "id">,
  ): Promise<Id<"Image">> {
    const id = crypto.randomUUID() as Id<"Image">;
    const record: ImageRecord = {
      id,
      blob,
      filename: metadata.filename,
      mimeType: metadata.mimeType,
      size: metadata.size,
    };
    await db.images.add(record);
    return id;
  }

  async get(id: Id<"Image">): Promise<Blob | undefined> {
    const record = await db.images.get(id);
    return record?.blob;
  }

  async delete(id: Id<"Image">): Promise<void> {
    await db.images.delete(id);
  }
}
