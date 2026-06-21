// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicUrl: vi.fn().mockReturnValue({
    data: {
      publicUrl: "https://cdn.example.com/path/to/file.jpg",
    },
  }),
  createSignedUrl: vi.fn().mockResolvedValue({
    data: {
      signedUrl: "https://cdn.example.com/path/to/file.jpg?token=abc",
    },
    error: null,
  }),
  download: vi.fn().mockResolvedValue({
    data: {
      type: "image/jpeg",
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    },
    error: null,
  }),
  list: vi.fn().mockResolvedValue({
    data: [{ name: "file.jpg" }],
    error: null,
  }),
  remove: vi.fn().mockResolvedValue({
    data: null,
    error: null,
  }),
  upload: vi.fn().mockResolvedValue({
    data: {
      path: "path/to/file.jpg",
    },
    error: null,
  }),
}));

vi.mock("~/integrations/supabase/client", () => ({
  getSupabaseAdmin: () => ({
    storage: {
      from: () => ({
        getPublicUrl: mocks.getPublicUrl,
        createSignedUrl: mocks.createSignedUrl,
        download: mocks.download,
        list: mocks.list,
        remove: mocks.remove,
        upload: mocks.upload,
      }),
    },
  }),
}));

const {
  downloadStorageObject,
  createSignedStorageUrl,
  getPublicStorageUrl,
  listStorageObjects,
  removeStorageObjects,
  uploadStorageObject,
} = await import("./supabase-storage-provider.server");

describe("supabase storage provider", () => {
  beforeEach(() => {
    mocks.getPublicUrl.mockClear();
    mocks.createSignedUrl.mockClear();
    mocks.download.mockClear();
    mocks.list.mockClear();
    mocks.remove.mockClear();
    mocks.upload.mockClear();
  });

  it("retrieves public URLs through the centralized storage facade", () => {
    const result = getPublicStorageUrl("path/to/file.jpg", "files");

    expect(mocks.getPublicUrl).toHaveBeenCalledWith("path/to/file.jpg");
    expect(result.data.publicUrl).toBe(
      "https://cdn.example.com/path/to/file.jpg"
    );
  });

  it("downloads storage objects through the centralized storage facade", async () => {
    const result = await downloadStorageObject("path/to/file.jpg", "assets");

    expect(mocks.download).toHaveBeenCalledWith("path/to/file.jpg");
    expect(result.error).toBeNull();
  });

  it("creates signed URLs through the centralized storage facade", async () => {
    const result = await createSignedStorageUrl(
      "path/to/file.jpg",
      "assets",
      3600
    );

    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "path/to/file.jpg",
      3600
    );
    expect(result.data?.signedUrl).toContain("token=abc");
  });

  it("lists storage objects through the centralized storage facade", async () => {
    const result = await listStorageObjects("path/to/folder", "assets");

    expect(mocks.list).toHaveBeenCalledWith("path/to/folder");
    expect(result.data).toEqual([{ name: "file.jpg" }]);
  });

  it("removes storage objects through the centralized storage facade", async () => {
    const result = await removeStorageObjects(["path/to/file.jpg"], "assets");

    expect(mocks.remove).toHaveBeenCalledWith(["path/to/file.jpg"]);
    expect(result.error).toBeNull();
  });

  it("uploads storage objects through the centralized storage facade", async () => {
    const result = await uploadStorageObject(
      "path/to/file.jpg",
      Buffer.from("hello"),
      "assets",
      {
        contentType: "text/plain",
        upsert: true,
      }
    );

    expect(mocks.upload).toHaveBeenCalledWith(
      "path/to/file.jpg",
      expect.any(Buffer),
      {
        contentType: "text/plain",
        upsert: true,
      }
    );
    expect(result.data?.path).toBe("path/to/file.jpg");
  });
});
