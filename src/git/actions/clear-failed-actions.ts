import { Octokit } from "@octokit/rest";
import { getUserConfirmation } from "../../utils/get-user-confirmation";

// Retrieve configuration from environment variables.
const owner = process.env.GITHUB_ACTIONS_OWNER;
console.log(`Owner: ${owner}`);

const repo = process.env.GITHUB_ACTIONS_REPO;
console.log(`Repo: ${repo}`);

const token = process.env.GITHUB_TOKEN;
console.log(`Token: ${token ? "[REDACTED]" : "undefined"}`);

if (!owner || !repo || !token) {
  console.error("Missing configuration. Please set GITHUB_OWNER, GITHUB_REPO, and GITHUB_TOKEN environment variables.");
  process.exit(1);
}

// Create an authenticated Octokit instance.
const octokit = new Octokit({ auth: token });

(async () => {
  console.log(`Fetching completed workflow runs for ${owner}/${repo}...`);

  // Fetch all completed workflow runs using pagination.
  const runs = await octokit.paginate(octokit.actions.listWorkflowRunsForRepo, {
    owner,
    repo,
    status: "completed",
    per_page: 100,
  });

  // Filter for runs that failed (conclusion equals "failure").
  const failedRuns = runs.filter((run) => run.conclusion === "failure");

  if (failedRuns.length === 0) {
    console.log("No failed workflow runs found.");
    process.exit(0);
  }

  console.log(`Found ${failedRuns.length} failed workflow run(s):`);
  failedRuns.forEach((run) => {
    console.log(`- Workflow: ${run.name} (ID: ${run.id})`);
    console.log(`  Started: ${run.created_at}`);
    console.log(`  Branch: ${run.head_branch}`);
    console.log("  ----------------");
  });

  const answer = await getUserConfirmation("Are you sure you want to delete these failed workflow runs?", [
    "yes",
    "no",
  ]);

  if (answer.toLowerCase() === "no") {
    console.log("Action cancelled.");
    process.exit(0);
  }

  // Delete each failed workflow run.
  for (const run of failedRuns) {
    console.log(`Attempting to delete workflow run ID: ${run.id}...`);
    try {
      await octokit.actions.deleteWorkflowRun({
        owner,
        repo,
        run_id: run.id,
      });
      console.log(`Successfully deleted workflow run ID: ${run.id}`);
    } catch (error) {
      console.error(`Error deleting workflow run ID: ${run.id}`, error);
    }
  }

  console.log("Successfully deleted all specified workflow runs!");
})().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
