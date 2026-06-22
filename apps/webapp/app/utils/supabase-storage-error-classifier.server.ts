export function isSupabaseStorageHtmlError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  const name =
    "name" in error && typeof error.name === "string" ? error.name : "";

  const lowerMessage = message.toLowerCase();
  const isJsonParseFailure =
    lowerMessage.includes("unexpected token") && lowerMessage.includes("json");
  const mentionsHtml =
    lowerMessage.includes("<html") ||
    lowerMessage.includes("html>") ||
    lowerMessage.includes("text/html");
  const isUnexpectedHtml =
    isJsonParseFailure && (mentionsHtml || lowerMessage.includes("<"));
  const isStorageUnknown =
    name === "StorageUnknownError" ||
    ("__isStorageError" in error &&
      typeof error.__isStorageError === "boolean" &&
      error.__isStorageError === true);

  return isUnexpectedHtml && isStorageUnknown;
}

export function isSupabaseStorageFetchFailedError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  const name =
    "name" in error && typeof error.name === "string" ? error.name : "";

  const lowerMessage = message.toLowerCase();
  const isFetchFailed = lowerMessage.includes("fetch failed");
  const isStorageUnknown =
    name === "StorageUnknownError" ||
    ("__isStorageError" in error &&
      typeof error.__isStorageError === "boolean" &&
      error.__isStorageError === true);

  return isFetchFailed && isStorageUnknown;
}

export function isSupabaseStorageRateLimitError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name =
    "name" in error && typeof error.name === "string" ? error.name : "";
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  const status =
    "status" in error && typeof error.status === "number" ? error.status : 0;
  const statusCode =
    "statusCode" in error && typeof error.statusCode === "string"
      ? error.statusCode
      : "";

  const isRateLimitStatus = status === 429 || statusCode === "429";
  const isRateLimitMessage = message.toLowerCase().includes("too many");
  const isStorageApiError = name === "StorageApiError";

  return isStorageApiError && (isRateLimitStatus || isRateLimitMessage);
}

export function isSupabaseStorageServerError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name =
    "name" in error && typeof error.name === "string" ? error.name : "";
  const status =
    "status" in error && typeof error.status === "number" ? error.status : 0;
  const statusCode =
    "statusCode" in error && typeof error.statusCode === "string"
      ? error.statusCode
      : "";

  const isServerStatus =
    (status >= 500 && status <= 599) ||
    (statusCode !== "" &&
      Number(statusCode) >= 500 &&
      Number(statusCode) <= 599);
  const isStorageApiError = name === "StorageApiError";

  return isStorageApiError && isServerStatus;
}
