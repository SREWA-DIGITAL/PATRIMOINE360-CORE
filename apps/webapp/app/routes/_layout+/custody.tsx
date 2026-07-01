import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { data, Link, useLoaderData } from "react-router";
import Header from "~/components/layout/header";
import { ListContentWrapper } from "~/components/list/content-wrapper";
import { Button } from "~/components/shared/button";
import { Card } from "~/components/shared/card";
import { DateS } from "~/components/shared/date";
import { Table, Td, Th, Tr } from "~/components/table";
import { db } from "~/database/db.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { makeShelfError } from "~/utils/error";
import { error } from "~/utils/http.server";
import {
  PermissionAction,
  PermissionEntity,
} from "~/utils/permissions/permission.data";
import { requirePermission } from "~/utils/roles.server";
import { resolveTeamMemberName } from "~/utils/user";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;

  try {
    const { organizationId } = await requirePermission({
      userId,
      request,
      entity: PermissionEntity.custody,
      action: PermissionAction.read,
    });

    const [activeCustodyRows, topCustodians, recentAssignments] =
      await Promise.all([
        db.custody.findMany({
          where: { asset: { organizationId } },
          select: {
            createdAt: true,
            teamMemberId: true,
            asset: {
              select: {
                locationId: true,
              },
            },
          },
        }),
        db.teamMember.findMany({
          where: {
            organizationId,
            deletedAt: null,
            custodies: { some: {} },
          },
          orderBy: { custodies: { _count: "desc" } },
          take: 12,
          select: {
            id: true,
            name: true,
            userId: true,
            user: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                custodies: true,
              },
            },
          },
        }),
        db.custody.findMany({
          where: { asset: { organizationId } },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            createdAt: true,
            custodian: {
              select: {
                name: true,
                userId: true,
                user: {
                  select: {
                    displayName: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            asset: {
              select: {
                id: true,
                title: true,
                location: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    const now = Date.now();
    const activeAssignmentsCount = activeCustodyRows.length;
    const activeCustodiansCount = new Set(
      activeCustodyRows.map((row) => row.teamMemberId)
    ).size;
    const coveredLocationsCount = new Set(
      activeCustodyRows
        .map((row) => row.asset.locationId)
        .filter((locationId): locationId is string => Boolean(locationId))
    ).size;
    const averageDaysInCustody =
      activeCustodyRows.length > 0
        ? Math.round(
            activeCustodyRows.reduce((sum, row) => {
              const days = Math.ceil(
                (now - row.createdAt.getTime()) / (1000 * 60 * 60 * 24)
              );

              return sum + days;
            }, 0) / activeCustodyRows.length
          )
        : 0;

    return data({
      header: {
        title: "Responsables et affectations",
        subHeading:
          "Vue Core des biens actuellement affectés et des responsables actifs.",
      },
      summary: {
        activeAssignmentsCount,
        activeCustodiansCount,
        coveredLocationsCount,
        averageDaysInCustody,
      },
      topCustodians,
      recentAssignments,
    });
  } catch (cause) {
    const reason = makeShelfError(cause, { userId });
    throw data(error(reason), { status: reason.status });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: appendToMetaTitle(data?.header?.title || "Responsables") },
];

export const handle = {
  breadcrumb: () => <Link to="/custody">Responsables</Link>,
};

export default function CustodyPage() {
  const { summary, topCustodians, recentAssignments } =
    useLoaderData<typeof loader>();

  return (
    <>
      <Header />

      <ListContentWrapper className="gap-4">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Biens affectés"
            value={summary.activeAssignmentsCount}
            hint="Biens actuellement rattachés à un responsable."
          />
          <MetricCard
            label="Responsables actifs"
            value={summary.activeCustodiansCount}
            hint="Personnes qui détiennent au moins un bien."
          />
          <MetricCard
            label="Sites / locaux couverts"
            value={summary.coveredLocationsCount}
            hint="Niveaux de localisation couverts par des affectations."
          />
          <MetricCard
            label="Ancienneté moyenne"
            value={
              summary.averageDaysInCustody > 0
                ? `${summary.averageDaysInCustody} j`
                : "—"
            }
            hint="Moyenne des jours d'affectation en cours."
          />
        </section>

        <Card className="my-0">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">
                Point d'entrée Core aligné PRD
              </h3>
              <p className="max-w-3xl text-sm text-gray-600">
                Cette page ferme le trou fonctionnel du Core sur le suivi "qui
                détient quoi". Le périmètre reste volontairement simple :
                affectations en cours, responsables actifs, rapport basique et
                renvoi vers la gestion d'équipe.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button to="/reports/custody-snapshot" variant="secondary">
                Ouvrir le rapport des affectations
              </Button>
              <Button to="/settings/team/nrm" variant="primary">
                Gérer les responsables
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="my-0 overflow-hidden p-0">
            <SectionHeader
              title="Responsables actifs"
              description="Vue rapide des personnes qui détiennent déjà des biens."
            />

            {topCustodians.length > 0 ? (
              <Table>
                <thead>
                  <Tr>
                    <Th>Responsable</Th>
                    <Th>Email</Th>
                    <Th className="text-right">Biens</Th>
                  </Tr>
                </thead>
                <tbody>
                  {topCustodians.map((custodian) => (
                    <Tr key={custodian.id}>
                      <Td className="w-full whitespace-normal">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-medium text-gray-900">
                            {resolveTeamMemberName(custodian, false)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {custodian.userId
                              ? "Utilisateur invité"
                              : "Responsable sans compte"}
                          </span>
                        </div>
                      </Td>
                      <Td className="whitespace-normal text-sm text-gray-600">
                        {custodian.user?.email || "—"}
                      </Td>
                      <Td className="text-right">
                        {custodian._count.custodies}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyBlock
                title="Aucun responsable actif"
                description="Les responsables apparaîtront ici dès qu'un bien leur sera affecté."
              />
            )}
          </Card>

          <Card className="my-0 overflow-hidden p-0">
            <SectionHeader
              title="Affectations récentes"
              description="Derniers biens affectés dans le périmètre Core."
            />

            {recentAssignments.length > 0 ? (
              <Table>
                <thead>
                  <Tr>
                    <Th>Bien</Th>
                    <Th>Responsable</Th>
                    <Th>Site / local</Th>
                    <Th>Affecté le</Th>
                  </Tr>
                </thead>
                <tbody>
                  {recentAssignments.map((assignment) => (
                    <Tr key={assignment.id}>
                      <Td className="w-full whitespace-normal">
                        <Button
                          to={`/assets/${assignment.asset.id}`}
                          variant="link"
                          className="text-left font-medium text-gray-900 hover:text-gray-700"
                        >
                          {assignment.asset.title}
                        </Button>
                      </Td>
                      <Td className="whitespace-normal">
                        {resolveTeamMemberName(assignment.custodian)}
                      </Td>
                      <Td className="whitespace-normal text-sm text-gray-600">
                        {assignment.asset.location?.name || "Sans site / local"}
                      </Td>
                      <Td className="text-sm text-gray-600">
                        <DateS
                          date={assignment.createdAt}
                          options={{
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }}
                        />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyBlock
                title="Aucune affectation en cours"
                description="Dès qu'un bien sera affecté, il apparaîtra ici avec son responsable."
              />
            )}
          </Card>
        </div>
      </ListContentWrapper>
    </>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <Card className="my-0">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{hint}</p>
      </div>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-gray-200 px-4 py-3 md:px-6">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function EmptyBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="max-w-lg text-sm text-gray-600">{description}</p>
    </div>
  );
}
