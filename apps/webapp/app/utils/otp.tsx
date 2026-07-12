import type { FC } from "react";
import SubHeading from "~/components/shared/sub-heading";

export type OtpVerifyMode = "login" | "signup" | "confirm_signup";

export type OtpPageData = Record<
  OtpVerifyMode,
  {
    title: string;
    SubHeading: FC<{ email: string }>;
    buttonTitle: string;
  }
>;

export const OTP_PAGE_MAP: OtpPageData = {
  login: {
    title: "Saisissez votre code",
    SubHeading: ({ email }) => (
      <SubHeading className="-mt-4 text-center">
        Nous avons envoyé un code à{" "}
        <span className="font-bold text-gray-900">{email}</span>. Saisissez-le
        ci-dessous pour vous connecter.
      </SubHeading>
    ),
    buttonTitle: "Se connecter",
  },
  signup: {
    title: "Créer un compte",
    SubHeading: () => (
      <SubHeading className="-mt-4 text-center">
        Commencez votre parcours avec Patrimoine360.
      </SubHeading>
    ),
    buttonTitle: "Créer le compte",
  },
  confirm_signup: {
    title: "Confirmez votre adresse e-mail",
    SubHeading: ({ email }) => (
      <SubHeading className="-mt-4 text-center">
        Nous avons envoyé un code à{" "}
        <span className="font-bold text-gray-900">{email}</span>. Saisissez-le
        ci-dessous pour confirmer votre adresse e-mail.
      </SubHeading>
    ),
    buttonTitle: "Confirmer",
  },
};

export const DEFAULT_PAGE_DATA: OtpPageData["login"] = {
  title: "Code à usage unique",
  buttonTitle: "Continuer",
  SubHeading: () => (
    <SubHeading className="-mt-4 text-center">
      Veuillez confirmer votre code OTP pour continuer
    </SubHeading>
  ),
};

export function getOtpPageData(mode: OtpVerifyMode) {
  return OTP_PAGE_MAP[mode] ?? DEFAULT_PAGE_DATA;
}
