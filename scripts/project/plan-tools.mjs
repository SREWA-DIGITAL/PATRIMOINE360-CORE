#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const STATUSES = [
  "Backlog",
  "Ready",
  "In progress",
  "In review",
  "Blocked",
  "Done",
];
const EDITIONS = ["Core", "Enterprise", "Transverse"];
const PRIORITIES = ["P0", "P1", "P2", "P3"];
const COMPONENTS = [
  "Web",
  "API",
  "Base de données",
  "Mobile",
  "Documentation",
  "CI/CD",
  "Transverse",
];
const TASK_ID_PATTERN = /^(CORE|ENT|TRANS)-[0-9A-Z]+-[0-9A-Z]+$/;
const PHASE_ID_PATTERN = /^(CORE|ENT|TRANS)-[0-9A-Z]+$/;
const LABEL_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const TASK_MARKER = "patrimoine360-task-id";
const GITHUB_API = "https://api.github.com";

function main() {
  const [command, ...argv] = process.argv.slice(2);

  if (command === "validate") {
    const { planPath } = parseArgs(argv);
    const result = loadAndValidatePlan(planPath);
    printValidationResult(result);
    process.exit(result.errors.length > 0 ? 1 : 0);
  }

  if (command === "publish") {
    publish(argv).catch((error) => {
      console.error(`Erreur: ${error.message}`);
      process.exit(1);
    });
    return;
  }

  console.error("Usage:");
  console.error("  pnpm project:validate planning/phases/<phase>.yml");
  console.error(
    "  pnpm project:publish [--dry-run] planning/phases/<phase>.yml"
  );
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    projectOwner: process.env.PROJECT_OWNER,
    projectNumber: process.env.PROJECT_NUMBER,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--project-owner") {
      options.projectOwner = argv[++index];
    } else if (arg === "--project-number") {
      options.projectNumber = argv[++index];
    } else if (arg.startsWith("--")) {
      throw new Error(`Option inconnue: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) {
    throw new Error("Un seul fichier de plan YAML est requis.");
  }

  return { ...options, planPath: positional[0] };
}

function loadAndValidatePlan(planPath) {
  const absolutePath = path.resolve(planPath);
  const errors = [];

  if (!fs.existsSync(absolutePath)) {
    return {
      plan: null,
      absolutePath,
      errors: [`plan: fichier introuvable ${planPath}.`],
    };
  }

  let plan;
  try {
    plan = YAML.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    return {
      plan: null,
      absolutePath,
      errors: [`plan: YAML invalide (${error.message}).`],
    };
  }

  validatePlanShape(plan, errors);

  return { plan, absolutePath, errors };
}

function validatePlanShape(plan, errors) {
  if (!isObject(plan)) {
    errors.push("plan: le contenu racine doit être un objet.");
    return;
  }

  if (plan.version !== 1) {
    errors.push("version: la seule version acceptée est 1.");
  }

  if (!isObject(plan.phase)) {
    errors.push("phase: section obligatoire.");
  } else {
    validatePhase(plan.phase, errors);
  }

  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    errors.push("tasks: au moins une tâche est requise.");
    return;
  }

  const taskIds = new Set();
  for (const [index, task] of plan.tasks.entries()) {
    validateTask(task, index, plan.phase, taskIds, errors);
  }

  for (const [index, task] of plan.tasks.entries()) {
    const dependencies = Array.isArray(task.dependencies)
      ? task.dependencies
      : [];
    for (const [dependencyIndex, dependency] of dependencies.entries()) {
      if (!taskIds.has(dependency)) {
        errors.push(
          `tasks[${index}].dependencies[${dependencyIndex}]: dépendance inconnue ${dependency}.`
        );
      }
    }
  }

  detectCircularDependencies(plan.tasks, errors);
  detectSecrets(plan, errors);
}

function validatePhase(phase, errors) {
  if (!PHASE_ID_PATTERN.test(String(phase.id ?? ""))) {
    errors.push(
      "phase.id: format attendu CORE-<phase>, ENT-<phase> ou TRANS-<phase>."
    );
  }
  if (!isNonEmptyString(phase.title, 5)) {
    errors.push("phase.title: titre obligatoire de 5 caractères minimum.");
  }
  if (!EDITIONS.includes(phase.edition)) {
    errors.push(`phase.edition: valeur autorisée: ${EDITIONS.join(", ")}.`);
  }
  if (
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(phase.repository ?? ""))
  ) {
    errors.push("phase.repository: format attendu OWNER/REPOSITORY.");
  }

  const expectedPrefix = prefixForEdition(phase.edition);
  if (expectedPrefix && !String(phase.id).startsWith(`${expectedPrefix}-`)) {
    errors.push(
      `phase.id: l'édition ${phase.edition} attend le préfixe ${expectedPrefix}-.`
    );
  }
}

function validateTask(task, index, phase, taskIds, errors) {
  if (!isObject(task)) {
    errors.push(`tasks[${index}]: la tâche doit être un objet.`);
    return;
  }

  if (!TASK_ID_PATTERN.test(String(task.id ?? ""))) {
    errors.push(`tasks[${index}].id: format d'identifiant invalide.`);
  } else if (taskIds.has(task.id)) {
    errors.push(`tasks[${index}].id: identifiant dupliqué ${task.id}.`);
  } else {
    taskIds.add(task.id);
  }

  const expectedPrefix = prefixForEdition(phase?.edition);
  if (
    expectedPrefix &&
    !String(task.id ?? "").startsWith(`${expectedPrefix}-`)
  ) {
    errors.push(
      `tasks[${index}].id: l'édition ${phase.edition} attend le préfixe ${expectedPrefix}-.`
    );
  }

  if (!isNonEmptyString(task.title, 5)) {
    errors.push(
      `tasks[${index}].title: titre obligatoire de 5 caractères minimum.`
    );
  }
  if (!STATUSES.includes(task.status)) {
    errors.push(
      `tasks[${index}].status: valeur autorisée: ${STATUSES.join(", ")}.`
    );
  }
  if (!PRIORITIES.includes(task.priority)) {
    errors.push(
      `tasks[${index}].priority: valeur autorisée: ${PRIORITIES.join(", ")}.`
    );
  }
  if (!COMPONENTS.includes(task.component)) {
    errors.push(
      `tasks[${index}].component: valeur autorisée: ${COMPONENTS.join(", ")}.`
    );
  }
  if (!Array.isArray(task.labels) || task.labels.length === 0) {
    errors.push(`tasks[${index}].labels: au moins un label est requis.`);
  } else {
    for (const [labelIndex, label] of task.labels.entries()) {
      if (!LABEL_PATTERN.test(String(label))) {
        errors.push(
          `tasks[${index}].labels[${labelIndex}]: utiliser un label en kebab-case.`
        );
      }
    }
  }
  if (!isNonEmptyString(task.description, 20)) {
    errors.push(`tasks[${index}].description: 20 caractères minimum.`);
  }
  if (
    !Array.isArray(task.acceptanceCriteria) ||
    task.acceptanceCriteria.length === 0
  ) {
    errors.push(
      `tasks[${index}].acceptanceCriteria: au moins un critère est requis.`
    );
  }
  if (!Array.isArray(task.dependencies)) {
    errors.push(
      `tasks[${index}].dependencies: tableau obligatoire, même vide.`
    );
  }
}

function detectCircularDependencies(tasks, errors) {
  const validTasks = tasks.filter((task) => {
    return isObject(task) && TASK_ID_PATTERN.test(String(task.id ?? ""));
  });
  const byId = new Map(validTasks.map((task) => [task.id, task]));
  const visiting = new Set();
  const visited = new Set();

  function visit(taskId, pathStack) {
    if (visiting.has(taskId)) {
      errors.push(
        `dependencies: cycle détecté ${[...pathStack, taskId].join(" -> ")}.`
      );
      return;
    }
    if (visited.has(taskId) || !byId.has(taskId)) {
      return;
    }

    visiting.add(taskId);
    const task = byId.get(taskId);
    const dependencies = Array.isArray(task.dependencies)
      ? task.dependencies
      : [];
    for (const dependency of dependencies) {
      visit(dependency, [...pathStack, taskId]);
    }
    visiting.delete(taskId);
    visited.add(taskId);
  }

  for (const task of validTasks) {
    visit(task.id, []);
  }
}

function detectSecrets(plan, errors) {
  const serialized = JSON.stringify(plan);
  const forbiddenPatterns = [
    /ghp_[A-Za-z0-9_]+/,
    /github_pat_[A-Za-z0-9_]+/,
    /BEGIN [A-Z ]*PRIVATE KEY/,
    /password\s*[:=]/i,
    /secret\s*[:=]/i,
  ];

  if (forbiddenPatterns.some((pattern) => pattern.test(serialized))) {
    errors.push("plan: contenu sensible potentiel détecté.");
  }
}

function printValidationResult(result) {
  if (result.errors.length === 0) {
    console.log(`Plan valide: ${result.absolutePath}`);
    return;
  }

  console.error(`Plan invalide: ${result.absolutePath}`);
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
}

async function publish(argv) {
  const options = parseArgs(argv);
  const validation = loadAndValidatePlan(options.planPath);
  if (validation.errors.length > 0) {
    printValidationResult(validation);
    process.exit(1);
  }

  const { plan } = validation;
  const summary = {
    created: [],
    updated: [],
    unchanged: [],
    projected: [],
    errors: [],
  };

  if (options.dryRun) {
    for (const task of plan.tasks) {
      summary.unchanged.push(`${task.id}: simulation uniquement`);
    }
    printPublishSummary(summary, true);
    return;
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN ou GH_TOKEN est requis pour publier.");
  }
  if (!options.projectOwner || !options.projectNumber) {
    throw new Error(
      "PROJECT_OWNER et PROJECT_NUMBER sont requis pour renseigner le Project."
    );
  }

  const [owner, repo] = plan.phase.repository.split("/");
  const project = await getProjectConfig(
    token,
    options.projectOwner,
    options.projectNumber
  );

  for (const task of plan.tasks) {
    try {
      const existingIssue = await findIssueByTaskId(
        token,
        owner,
        repo,
        task.id
      );
      const desiredIssue = buildIssuePayload(plan, task, options.planPath);

      let issue;
      if (!existingIssue) {
        await ensureLabels(token, owner, repo, desiredIssue.labels);
        issue = await githubRest(token, `/repos/${owner}/${repo}/issues`, {
          method: "POST",
          body: desiredIssue,
        });
        summary.created.push(`${task.id}: #${issue.number}`);
      } else if (issueNeedsUpdate(existingIssue, desiredIssue)) {
        await ensureLabels(token, owner, repo, desiredIssue.labels);
        issue = await githubRest(
          token,
          `/repos/${owner}/${repo}/issues/${existingIssue.number}`,
          {
            method: "PATCH",
            body: desiredIssue,
          }
        );
        summary.updated.push(`${task.id}: #${issue.number}`);
      } else {
        issue = existingIssue;
        summary.unchanged.push(`${task.id}: #${issue.number}`);
      }

      const itemId = await addIssueToProject(token, project.id, issue.node_id);
      await updateProjectFields(
        token,
        project,
        itemId,
        plan,
        task,
        options.planPath
      );
      summary.projected.push(`${task.id}: Project mis à jour`);
    } catch (error) {
      summary.errors.push(`${task.id}: ${error.message}`);
    }
  }

  printPublishSummary(summary, false);
  if (summary.errors.length > 0) {
    process.exit(1);
  }
}

function buildIssuePayload(plan, task, planPath) {
  return {
    title: task.title,
    body: renderIssueBody(plan, task, planPath),
    labels: [...new Set(task.labels)],
  };
}

function renderIssueBody(plan, task, planPath) {
  const criteria = task.acceptanceCriteria
    .map((criterion) => `- ${criterion}`)
    .join("\n");
  const dependencies =
    task.dependencies.length > 0
      ? task.dependencies.map((dependency) => `- ${dependency}`).join("\n")
      : "- Aucune";

  return `<!-- ${TASK_MARKER}: ${task.id} -->
<!-- patrimoine360-source-plan: ${planPath} -->

## Objectif

${task.description}

## Critères d'acceptation

${criteria}

## Dépendances

${dependencies}

## Métadonnées

- Task ID : \`${task.id}\`
- Phase : \`${plan.phase.id}\`
- Édition : \`${plan.phase.edition}\`
- Priorité : \`${task.priority}\`
- Composant : \`${task.component}\`
- Source Plan : \`${planPath}\`
`;
}

function issueNeedsUpdate(issue, desiredIssue) {
  const existingLabels = (issue.labels ?? []).map((label) => label.name).sort();
  const desiredLabels = [...desiredIssue.labels].sort();

  return (
    issue.title !== desiredIssue.title ||
    issue.body !== desiredIssue.body ||
    JSON.stringify(existingLabels) !== JSON.stringify(desiredLabels)
  );
}

async function findIssueByTaskId(token, owner, repo, taskId) {
  const marker = `<!-- ${TASK_MARKER}: ${taskId} -->`;
  let page = 1;

  while (true) {
    const issues = await githubRest(
      token,
      `/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`
    );
    const issue = issues.find((candidate) => {
      return !candidate.pull_request && candidate.body?.includes(marker);
    });
    if (issue) {
      return issue;
    }
    if (issues.length < 100) {
      return null;
    }
    page += 1;
  }
}

async function ensureLabels(token, owner, repo, labels) {
  const existingLabels = await githubRest(
    token,
    `/repos/${owner}/${repo}/labels?per_page=100`
  );
  const existingNames = new Set(existingLabels.map((label) => label.name));

  for (const label of labels) {
    if (existingNames.has(label)) {
      continue;
    }
    await githubRest(token, `/repos/${owner}/${repo}/labels`, {
      method: "POST",
      body: {
        name: label,
        color: "ededed",
        description: "Label créé par l'automatisation Patrimoine360.",
      },
    });
  }
}

async function getProjectConfig(token, owner, number) {
  const organizationQuery = `query($owner: String!, $number: Int!) {
    organization(login: $owner) {
      projectV2(number: $number) {
        id
        fields(first: 100) {
          nodes {
            __typename
            ... on ProjectV2Field {
              id
              name
              dataType
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              dataType
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }`;

  const userQuery = `query($owner: String!, $number: Int!) {
    user(login: $owner) {
      projectV2(number: $number) {
        id
        fields(first: 100) {
          nodes {
            __typename
            ... on ProjectV2Field {
              id
              name
              dataType
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              dataType
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }`;

  let project = null;
  try {
    const data = await githubGraphql(token, organizationQuery, {
      owner,
      number: Number(number),
    });
    project = data.organization?.projectV2;
  } catch (error) {
    if (!error.message.includes("Could not resolve to an Organization")) {
      throw error;
    }
  }

  if (!project) {
    const data = await githubGraphql(token, userQuery, {
      owner,
      number: Number(number),
    });
    project = data.user?.projectV2;
  }

  if (!project) {
    throw new Error(`Project introuvable: ${owner}/${number}.`);
  }

  const fields = new Map(
    project.fields.nodes.filter(Boolean).map((field) => [field.name, field])
  );
  return { id: project.id, fields };
}

async function addIssueToProject(token, projectId, contentId) {
  const existingItemQuery = `query($contentId: ID!) {
    node(id: $contentId) {
      ... on Issue {
        projectItems(first: 50) {
          nodes {
            id
            project {
              id
            }
          }
        }
      }
    }
  }`;
  const existingItemData = await githubGraphql(token, existingItemQuery, {
    contentId,
  });
  const existingItem = existingItemData.node.projectItems.nodes.find((item) => {
    return item.project.id === projectId;
  });
  if (existingItem) {
    return existingItem.id;
  }

  const mutation = `mutation($projectId: ID!, $contentId: ID!) {
    addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
      item {
        id
      }
    }
  }`;
  const data = await githubGraphql(token, mutation, { projectId, contentId });
  return data.addProjectV2ItemById.item.id;
}

async function updateProjectFields(
  token,
  project,
  itemId,
  plan,
  task,
  planPath
) {
  await setSingleSelectField(token, project, itemId, "Status", task.status);
  await setSingleSelectField(
    token,
    project,
    itemId,
    "Édition",
    plan.phase.edition
  );
  await setTextField(token, project, itemId, "Phase", plan.phase.id);
  await setSingleSelectField(token, project, itemId, "Priorité", task.priority);
  await setSingleSelectField(
    token,
    project,
    itemId,
    "Composant",
    task.component
  );
  await setTextField(token, project, itemId, "Task ID", task.id);
  await setTextField(token, project, itemId, "Source Plan", planPath);
}

async function setSingleSelectField(
  token,
  project,
  itemId,
  fieldName,
  optionName
) {
  const field = requireField(project, fieldName);
  const option = field.options?.find(
    (candidate) => candidate.name === optionName
  );
  if (!option) {
    throw new Error(
      `Option ${optionName} introuvable pour le champ ${fieldName}.`
    );
  }
  const mutation = `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId,
      itemId: $itemId,
      fieldId: $fieldId,
      value: { singleSelectOptionId: $optionId }
    }) {
      projectV2Item {
        id
      }
    }
  }`;
  await githubGraphql(token, mutation, {
    projectId: project.id,
    itemId,
    fieldId: field.id,
    optionId: option.id,
  });
}

async function setTextField(token, project, itemId, fieldName, text) {
  const field = requireField(project, fieldName);
  const mutation = `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $text: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId,
      itemId: $itemId,
      fieldId: $fieldId,
      value: { text: $text }
    }) {
      projectV2Item {
        id
      }
    }
  }`;
  await githubGraphql(token, mutation, {
    projectId: project.id,
    itemId,
    fieldId: field.id,
    text,
  });
}

function requireField(project, name) {
  const field = project.fields.get(name);
  if (!field) {
    throw new Error(`Champ Project introuvable: ${name}.`);
  }
  return field;
}

async function githubRest(token, route, options = {}) {
  const response = await fetch(`${GITHUB_API}${route}`, {
    method: options.method ?? "GET",
    headers: githubHeaders(token),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return parseGithubResponse(response);
}

async function githubGraphql(token, query, variables) {
  const response = await fetch(`${GITHUB_API}/graphql`, {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({ query, variables }),
  });
  const payload = await parseGithubResponse(response);
  if (payload.errors?.length > 0) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }
  return payload.data;
}

function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function parseGithubResponse(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.message ?? `GitHub API HTTP ${response.status}`);
  }
  return payload;
}

function printPublishSummary(summary, dryRun) {
  console.log(dryRun ? "Simulation de publication" : "Publication terminée");
  printGroup("Créées", summary.created);
  printGroup("Mises à jour", summary.updated);
  printGroup("Inchangées", summary.unchanged);
  printGroup("Project", summary.projected);
  printGroup("Erreurs", summary.errors);
}

function printGroup(title, values) {
  console.log(`${title}: ${values.length}`);
  for (const value of values) {
    console.log(`- ${value}`);
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value, minimumLength) {
  return typeof value === "string" && value.trim().length >= minimumLength;
}

function prefixForEdition(edition) {
  if (edition === "Core") {
    return "CORE";
  }
  if (edition === "Enterprise") {
    return "ENT";
  }
  if (edition === "Transverse") {
    return "TRANS";
  }
  return null;
}

main();
