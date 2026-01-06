import { vi } from "vitest";

if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = vi.fn(() => "blob:mock");
}

if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = vi.fn();
}

if (typeof globalThis.File === "undefined") {
  class PolyfilledFile extends Blob {
    name: string;
    lastModified: number;

    constructor(
      chunks: BlobPart[],
      fileName: string,
      options?: FilePropertyBag
    ) {
      super(chunks, options);
      this.name = fileName;
      this.lastModified = options?.lastModified ?? Date.now();
    }
  }
  // @ts-expect-error assigning polyfill for test environment
  globalThis.File = PolyfilledFile as unknown as typeof File;
}
