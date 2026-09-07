import type { Id } from "../../shared/types/id.js";

export interface ImageRef {
  id: Id<"Image">;
  filename: string;
  mimeType: string;
  size: number;
}
