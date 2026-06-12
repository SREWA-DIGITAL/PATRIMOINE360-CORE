import { Heading, Img } from "@react-email/components";
import { config } from "~/config/shelf.config";
import { SERVER_URL } from "~/utils/env";

export function LogoForEmail() {
  const { brand, logoPath } = config;
  const logoUrl = logoPath?.fullLogo
    ? logoPath.fullLogo.startsWith("http")
      ? logoPath.fullLogo
      : `${SERVER_URL}${logoPath.fullLogo}`
    : null;

  return (
    <div style={{ margin: "0 auto", display: "flex" }}>
      {logoUrl ? (
        <Img
          src={logoUrl}
          alt={`${brand.name} logo`}
          width="auto"
          height="32"
          style={{ marginRight: "6px", width: "auto", height: "32px" }}
        />
      ) : (
        <Heading
          as="h1"
          style={{
            color: "#101828",
            fontWeight: "600",
            margin: "0",
          }}
        >
          {brand.name}
        </Heading>
      )}
    </div>
  );
}
