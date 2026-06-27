import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { z } from "zod";
import { signOutCurrentAuthSession } from "~/modules/auth/service.server";

import { assertIsPost, parseData } from "~/utils/http.server";

export async function action({ context, request }: ActionFunctionArgs) {
  assertIsPost(request);
  const { redirectTo } = parseData(
    await request.formData(),
    z.object({
      redirectTo: z.string().optional(),
    })
  );

  if (context.isAuthenticated) {
    await signOutCurrentAuthSession(context.getSession()).catch(
      () => undefined
    );
  }

  context.destroySession();
  return redirect(redirectTo || "/login");
}

export function loader() {
  return redirect("/");
}
