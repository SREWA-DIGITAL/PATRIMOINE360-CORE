import {
  buildSupabaseMigrationPlan,
  formatPlanSummary,
} from "./better-auth-migration/shared";

type AuditOptions = {
  email?: string;
  json: boolean;
  limit?: number;
  userId?: string;
};

function parseArgs(argv: string[]): AuditOptions {
  const options: AuditOptions = {
    json: argv.includes("--json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = argv[index + 1];

    if (arg === "--email" && nextValue) {
      options.email = nextValue;
    }

    if (arg === "--user-id" && nextValue) {
      options.userId = nextValue;
    }

    if (arg === "--limit" && nextValue) {
      const parsed = Number.parseInt(nextValue, 10);

      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = parsed;
      }
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const plan = await buildSupabaseMigrationPlan(options);

  if (options.json) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  console.log("Supabase -> Better Auth migration audit");
  console.log("");
  console.log(formatPlanSummary(plan.summary));
  console.log("");

  const blockedEntries = plan.entries.filter(
    (entry) => entry.blockingReasons.length > 0
  );

  if (blockedEntries.length > 0) {
    console.log("Blocked users:");
    for (const entry of blockedEntries.slice(0, 20)) {
      console.log(
        `- ${entry.userId} (${
          entry.email ?? "no-email"
        }): ${entry.blockingReasons.join(", ")}`
      );
    }
    console.log("");
  }

  const readyEntries = plan.entries.filter(
    (entry) =>
      entry.canMigrate &&
      (entry.needsBetterAuthUser ||
        entry.credentialAccount?.readyToCreate ||
        entry.oauthAccounts.some((account) => account.readyToCreate))
  );

  if (readyEntries.length > 0) {
    console.log("Ready users:");
    for (const entry of readyEntries.slice(0, 20)) {
      console.log(
        `- ${entry.userId} (${entry.email}) | createUser=${
          entry.needsBetterAuthUser
        } | credential=${
          entry.credentialAccount?.readyToCreate ?? false
        } | oauth=${
          entry.oauthAccounts.filter((account) => account.readyToCreate).length
        }`
      );
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
