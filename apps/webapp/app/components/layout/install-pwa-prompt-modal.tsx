import { useRef } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useLoaderData, useFetcher } from "react-router";
import type { LayoutLoaderResponse } from "~/routes/_layout+/_layout";
import { usePwaManager } from "~/utils/pwa-manager";
import { Button } from "../shared/button";

export function InstallPwaPromptModal() {
  const { hideInstallPwaPrompt } = useLoaderData<LayoutLoaderResponse>();
  const fetcher = useFetcher();
  let optimisticHideInstallPwaPrompt = hideInstallPwaPrompt;
  if (fetcher.formData) {
    optimisticHideInstallPwaPrompt =
      fetcher.formData.get("pwaPromptVisibility") === "hidden";
  }
  const hidePwaPromptForm = useRef<HTMLFormElement | null>(null);

  const { promptInstall } = usePwaManager();

  return optimisticHideInstallPwaPrompt ? null : (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="dialog-backdrop !items-end !bg-[#364054]/70">
          <dialog
            className="dialog m-auto h-auto w-[90%] pb-8 sm:w-[400px]"
            open={true}
          >
            <div className="relative z-10  rounded-xl bg-white p-4 shadow-lg">
              <div className="mb-8 text-center">
                <h4 className="mb-1 text-[18px] font-semibold">
                  Installer Patrimoine360 sur mobile
                </h4>
                <p className="text-gray-600">
                  Accédez à Patrimoine360 à tout moment, avec les mêmes
                  fonctionnalités que sur ordinateur.{" "}
                  {promptInstall && (
                    <>
                      Utilisez le{" "}
                      <strong>bouton d'installation ci-dessous</strong> pour
                      l'ajouter à votre appareil.
                    </>
                  )}
                </p>
                {promptInstall ? null : (
                  <>
                    <ol className="mb-8 mt-2 pt-2">
                      <li>
                        1. Cliquez sur l'<strong>icône de partage</strong>
                      </li>
                      <li>
                        2. Cliquez sur{" "}
                        <strong>"Ajouter à l'écran d'accueil"</strong>
                      </li>
                      <li>3. Profitez de Patrimoine360 sur votre mobile</li>
                    </ol>

                    <video
                      height="200"
                      loop
                      autoPlay
                      muted
                      playsInline
                      className="mb-6 rounded-lg"
                    >
                      <source
                        src="/static/videos/add-to-home-screen.mp4"
                        type="video/mp4"
                      />
                    </video>
                  </>
                )}
                <p>
                  Pour en savoir plus, consultez le{" "}
                  <Button
                    to="https://www.shelf.nu/knowledge-base/shelf-mobile-app"
                    variant="link"
                    target="_blank"
                    className="mt-4"
                  >
                    guide complet
                  </Button>
                </p>
              </div>

              {promptInstall && (
                <Button
                  type="button"
                  width="full"
                  variant="primary"
                  className="mb-3"
                  onClick={async () => {
                    await promptInstall().then(
                      () =>
                        void fetcher.submit(hidePwaPromptForm.current, {
                          method: "POST",
                        })
                    );
                  }}
                >
                  Installer
                </Button>
              )}
              <fetcher.Form
                ref={hidePwaPromptForm}
                method="post"
                action="/api/hide-pwa-install-prompt"
              >
                <input
                  type="hidden"
                  name="pwaPromptVisibility"
                  value="hidden"
                />
                <Button type="submit" width="full" variant="secondary">
                  Masquer pendant 2 semaines
                </Button>
              </fetcher.Form>
            </div>
          </dialog>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
