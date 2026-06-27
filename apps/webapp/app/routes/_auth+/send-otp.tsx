import type { ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";

import { SendOtpSchema } from "~/modules/auth/components/continue-with-email-form";
import { sendOTP } from "~/modules/auth/service.server";
import { makeShelfError, notAllowedMethod } from "~/utils/error";
import { error, getActionMethod, parseData } from "~/utils/http.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const method = getActionMethod(request);

    switch (method) {
      case "POST": {
        const { email, mode } = parseData(
          await request.formData(),
          SendOtpSchema,
          { shouldBeCaptured: false }
        );
        const otpMode = mode ?? "login";

        await sendOTP(email, otpMode);

        return redirect(
          `/otp?email=${encodeURIComponent(email)}&mode=${otpMode}`
        );
      }
    }

    throw notAllowedMethod(method);
  } catch (cause) {
    const reason = makeShelfError(cause);
    return data(error(reason), { status: reason.status });
  }
}
