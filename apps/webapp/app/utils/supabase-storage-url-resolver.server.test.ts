// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("./env", () => ({
  SUPABASE_URL: "https://example.supabase.co",
}));

const {
  extractPublicStorageObjectPathFromUrl,
  extractStorageObjectPathFromUrl,
} = await import("./supabase-storage-url-resolver.server");

describe("supabase storage url resolver", () => {
  it("extracts a path from a public storage URL", () => {
    expect(
      extractStorageObjectPathFromUrl(
        "https://example.supabase.co/storage/v1/object/public/assets/org-1/assets/file.jpg",
        "assets"
      )
    ).toBe("org-1/assets/file.jpg");
  });

  it("extracts a path from a signed storage URL", () => {
    expect(
      extractStorageObjectPathFromUrl(
        "https://example.supabase.co/storage/v1/object/sign/assets/org-1/assets/file.jpg?token=abc",
        "assets"
      )
    ).toBe("org-1/assets/file.jpg");
  });

  it("returns null when the URL does not contain a supported storage path", () => {
    expect(
      extractStorageObjectPathFromUrl(
        "https://example.com/not-storage",
        "assets"
      )
    ).toBeNull();
  });

  it("extracts a public storage path only when the origin matches Supabase", () => {
    expect(
      extractPublicStorageObjectPathFromUrl(
        "https://example.supabase.co/storage/v1/object/public/files/documents/file.pdf",
        "files"
      )
    ).toBe("documents/file.pdf");
  });

  it("rejects public storage URLs from a different origin", () => {
    expect(
      extractPublicStorageObjectPathFromUrl(
        "https://cdn.example.com/storage/v1/object/public/files/documents/file.pdf",
        "files"
      )
    ).toBeNull();
  });

  it("rejects signed URLs for public-only extraction", () => {
    expect(
      extractPublicStorageObjectPathFromUrl(
        "https://example.supabase.co/storage/v1/object/sign/files/documents/file.pdf?token=abc",
        "files"
      )
    ).toBeNull();
  });
});
