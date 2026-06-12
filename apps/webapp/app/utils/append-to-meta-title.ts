import { config } from "~/config/shelf.config";

/** Small helper that appends the public brand to the current route meta title */
export const appendToMetaTitle = (title: string | null | undefined) =>
  `${title ? title : "Page introuvable"} | ${config.brand.name}`;
