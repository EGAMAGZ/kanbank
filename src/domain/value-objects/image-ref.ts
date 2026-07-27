import type { Id } from "../../shared/types/index.js";

export interface ImageRef {
  id: Id<"Image">;
  filename: string;
  mimeType: string;
  size: number;
}
