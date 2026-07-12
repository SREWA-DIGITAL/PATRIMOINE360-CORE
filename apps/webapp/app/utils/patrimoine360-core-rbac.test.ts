import { OrganizationRoles, Roles } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  getHighestOrganizationRole,
  getPatrimoine360ProjectedRole,
  patrimoine360PrdRoleSupport,
} from "./patrimoine360-core-rbac";

describe("patrimoine360 core rbac mapping", () => {
  it("prioritizes platform admin as SUPER_ADMIN", () => {
    const profile = getPatrimoine360ProjectedRole({
      platformRoles: [Roles.ADMIN],
      organizationRoles: [OrganizationRoles.BASE],
    });

    expect(profile?.role).toBe("SUPER_ADMIN");
    expect(profile?.status).toBe("supported");
  });

  it("maps owner to ADMIN", () => {
    const profile = getPatrimoine360ProjectedRole({
      organizationRoles: [OrganizationRoles.OWNER],
    });

    expect(profile).toBe(patrimoine360PrdRoleSupport.ADMIN);
  });

  it("maps admin to ADMIN", () => {
    const profile = getPatrimoine360ProjectedRole({
      organizationRoles: [OrganizationRoles.ADMIN],
    });

    expect(profile).toBe(patrimoine360PrdRoleSupport.ADMIN);
  });

  it("maps self service to RESPONSABLE_SITE as partial support", () => {
    const profile = getPatrimoine360ProjectedRole({
      organizationRoles: [OrganizationRoles.SELF_SERVICE],
    });

    expect(profile?.role).toBe("RESPONSABLE_SITE");
    expect(profile?.status).toBe("partial");
  });

  it("maps base to LECTEUR as partial support", () => {
    const profile = getPatrimoine360ProjectedRole({
      organizationRoles: [OrganizationRoles.BASE],
    });

    expect(profile?.role).toBe("LECTEUR");
    expect(profile?.status).toBe("partial");
  });

  it("returns the highest organization role", () => {
    expect(
      getHighestOrganizationRole([
        OrganizationRoles.BASE,
        OrganizationRoles.ADMIN,
      ])
    ).toBe(OrganizationRoles.ADMIN);
  });

  it("returns null when no role is available", () => {
    expect(getPatrimoine360ProjectedRole({})).toBeNull();
  });
});
