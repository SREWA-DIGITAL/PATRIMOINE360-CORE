import { ErrorIcon } from "~/components/errors";
import { Button } from "~/components/shared/button";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";

export const meta = () => [{ title: appendToMetaTitle("Page introuvable") }];

export default function LayoutSplat() {
  return (
    <div className="flex size-full h-dvh items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <span className="mb-5 size-14 text-primary">
          <ErrorIcon />
        </span>
        <h2 className="mb-2">Page introuvable</h2>
        <p className="max-w-[550px]">
          Nous n'avons pas trouvé la page que vous recherchez.
        </p>

        <div className=" mt-8 flex gap-3">
          <Button to="/" variant="secondary" icon="home">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
