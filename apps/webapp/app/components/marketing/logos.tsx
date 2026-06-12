import { config } from "~/config/shelf.config";
import { tw } from "~/utils/tw";

const { brand } = config;

const BrandMark = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={tw(
      "inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-600 text-[10px] font-semibold text-white",
      className
    )}
  >
    {brand.shortName}
  </span>
);

/**
 * Logo shown in the sidebar
 * If a custom logo is used, we dynamically show that or the symbol depending on {optimisticMinimizedSidebar}
 */
export const ShelfSidebarLogo = ({ minimized }: { minimized: boolean }) => {
  const { logoPath } = config;

  if (logoPath) {
    return minimized ? (
      <img
        src={logoPath.symbol}
        alt={`${brand.name} logo`}
        className="mx-1.5 inline h-[32px] transition duration-150 ease-linear"
      />
    ) : (
      <img
        src={logoPath.fullLogo}
        alt={`${brand.name} logo`}
        className="mx-1.5 inline h-[32px] transition duration-150 ease-linear"
      />
    );
  }

  return minimized ? (
    <span className="mx-1.5 inline-flex h-[32px] items-center">
      <BrandMark />
      <span className="sr-only">{brand.name}</span>
    </span>
  ) : (
    <span
      className="mx-1.5 inline-flex h-[32px] items-center gap-2 transition duration-150 ease-linear"
      title={brand.name}
    >
      <BrandMark />
      <span className="text-sm font-semibold text-gray-900">{brand.name}</span>
    </span>
  );
};

/**
 * Logo shown in the header for mobile screen sizes
 */
export const ShelfMobileLogo = () => {
  const { logoPath } = config;

  if (logoPath) {
    return (
      <img
        src={logoPath.fullLogo}
        alt={`${brand.name} logo`}
        className="h-full"
      />
    );
  }

  return (
    <span className="inline-flex h-full items-center gap-2 px-1">
      <BrandMark className="size-7" />
      <span className="text-sm font-semibold text-gray-900">{brand.name}</span>
    </span>
  );
};

/**
 * Logo symbol
 */
export const ShelfSymbolLogo = ({ className }: { className?: string }) => {
  const { logoPath } = config;
  const classes = tw("mx-auto mb-2 size-12", className);

  if (logoPath) {
    return (
      <img
        src={logoPath.symbol}
        alt={`${brand.name} logo`}
        className={classes}
      />
    );
  }

  return <BrandMark className={classes} />;
};

/**
 * Full logo
 */
export const ShelfFullLogo = ({ className }: { className?: string }) => {
  const { logoPath } = config;
  const classes = tw(className);

  if (logoPath) {
    return (
      <img
        src={logoPath.fullLogo}
        alt={`${brand.name} logo`}
        className={classes}
      />
    );
  }

  return (
    <span className={tw("inline-flex items-center gap-2", classes)}>
      <BrandMark />
      <span className="font-semibold text-gray-900">{brand.name}</span>
    </span>
  );
};
