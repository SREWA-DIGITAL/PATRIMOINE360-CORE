import {
  buildSupabaseMigrationPlan,
  executeSupabaseMigration,
  formatPlanSummary,
} from "./better-auth-migration/shared";

type MigrationOptions = {
  apply: boolean;
  email?: string;
  includeOauthAccounts: boolean;
  limit?: number;
  userId?: string;
};

function parseArgs(argv: string[]): MigrationOptions {
  const options: MigrationOptions = {
    apply: argv.includes("--apply"),
    includeOauthAccounts: argv.includes("--include-oauth"),
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

  console.log("Supabase -> Better Auth migration plan");
  console.log("");
  console.log(formatPlanSummary(plan.summary));
  console.log("");

  if (!options.apply) {
    console.log(
      "Dry run only. Re-run with --apply to insert BetterAuthUser / BetterAuthAccount rows."
    );
    console.log(
      "Add --include-oauth if you also want to import OAuth account mappings."
    );
    return;
  }

  const results = await executeSupabaseMigration(options);
  const executed = results.filter((result) => !result.skipped);

  console.log("");
  console.log(`Users processed: ${executed.length}`);
  console.log(
    `BetterAuthUser created: ${
      executed.filter((result) => result.createdUser).length
    }`
  );
  console.log(
    `Credential accounts created: ${
      executed.filter((result) => result.createdCredentialAccount).length
    }`
  );
  console.log(
    `OAuth accounts created: ${executed.reduce(
      (count, result) => count + result.createdOauthAccounts,
      0
    )}`
  );
  console.log(
    `Skipped users: ${results.filter((result) => result.skipped).length}`
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
