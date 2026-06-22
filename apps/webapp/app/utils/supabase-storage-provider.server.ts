import { getSupabaseAdmin } from "~/integrations/supabase/client";

export function getPublicStorageUrl(path: string, bucketName: string) {
  return getSupabaseAdmin().storage.from(bucketName).getPublicUrl(path);
}

export async function createSignedStorageUrl(
  path: string,
  bucketName: string,
  expiresInSeconds: number
) {
  return getSupabaseAdmin()
    .storage.from(bucketName)
    .createSignedUrl(path, expiresInSeconds);
}

export async function downloadStorageObject(path: string, bucketName: string) {
  return getSupabaseAdmin().storage.from(bucketName).download(path);
}

export async function listStorageObjects(path: string, bucketName: string) {
  return getSupabaseAdmin().storage.from(bucketName).list(path);
}

export async function removeStorageObjects(
  paths: string[],
  bucketName: string
) {
  return getSupabaseAdmin().storage.from(bucketName).remove(paths);
}

export async function uploadStorageObject(
  path: string,
  body: File | Blob | ArrayBuffer | ArrayBufferView | Buffer | string,
  bucketName: string,
  options: {
    contentType?: string;
    upsert?: boolean;
    metadata?: Record<string, string>;
  } = {}
) {
  return getSupabaseAdmin()
    .storage.from(bucketName)
    .upload(path, body, options);
}
