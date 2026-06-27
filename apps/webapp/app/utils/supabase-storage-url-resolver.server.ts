import { SUPABASE_URL } from "./env";

function getUrlOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function getUrlPathname(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

function extractStorageObjectPath(
  pathname: string | null,
  bucketName: string,
  visibility: "public" | "sign"
) {
  if (!pathname) {
    return null;
  }

  const prefix = `/storage/v1/object/${visibility}/${bucketName}/`;

  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const path = decodeURIComponent(pathname.slice(prefix.length));
  return path.length > 0 ? path : null;
}

export function extractStorageObjectPathFromUrl(
  url: string,
  bucketName: string
) {
  const pathname = getUrlPathname(url);

  return (
    extractStorageObjectPath(pathname, bucketName, "public") ??
    extractStorageObjectPath(pathname, bucketName, "sign")
  );
}

export function extractPublicStorageObjectPathFromUrl(
  url: string,
  bucketName: string
) {
  if (getUrlOrigin(url) !== SUPABASE_URL) {
    return null;
  }

  return extractStorageObjectPath(getUrlPathname(url), bucketName, "public");
}
