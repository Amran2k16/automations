import { $ } from "bun";
import { tryExec } from "../../utils/tryExec";
import { generateCommitMessage } from "../../utils/ai/generateCommitMessage";
import { getUserConfirmation } from "../../utils/get-user-confirmation";

// This function commits and pushes changes in the main repo and all submodules.
// It checks for changes in both main repo and submodules, then adds, commits, and pushes them.
// Note: Git tracks submodules as pointers to commits in separate repositories.
export async function fastPush() {
  // Check for changes in main repository.
  const [status, statusErr] = await tryExec($`git status --porcelain`.text(), "Failed to check git status");
  if (statusErr) {
    console.error(statusErr);
    process.exit(1);
  }

  // Check for submodule changes (if any submodules exist, this prints their status).
  // We use git submodule foreach to collect statuses.
  const [subStatus, subStatusErr] = await tryExec(
    $`git submodule foreach --quiet "git status --porcelain"`.text(),
    "Failed to check submodules status"
  );
  if (subStatusErr) {
    console.error(subStatusErr);
    process.exit(1);
  }

  if (status.length === 0 && subStatus.trim().length === 0) {
    console.log("No changes to commit in main repo or submodules.");
    process.exit(1);
  }

  // Generate commit message based on the diff from main repository.
  const [gitDiff, diffErr] = await tryExec($`git diff`.text(), "Failed to get git diff");
  if (diffErr) {
    console.error(diffErr);
    process.exit(1);
  }
  if (gitDiff.length === 0) {
    console.log("No changes detected in git diff.");
    process.exit(1);
  }

  const commitMessage = await generateCommitMessage(gitDiff);
  if (!commitMessage) {
    console.error("Failed to generate commit message");
    process.exit(1);
  }

  // List changed files in main repo.
  const [files, filesErr] = await tryExec($`git diff --name-status`.text(), "Failed to list files");
  if (filesErr) {
    console.error(filesErr);
    process.exit(1);
  }

  console.log(`Commit message: "${commitMessage}"`);
  console.log(`The following changes will be committed in the main repo: \n${files.trim()}`);
  if (subStatus.trim().length > 0) {
    console.log("Submodule changes detected; they will also be processed.");
  }

  const answer = await getUserConfirmation(
    "Are you sure you want to commit and push these changes (in main repo and submodules)?",
    ["yes", "no"]
  );
  if (answer.toLowerCase() !== "yes") {
    console.log("Action cancelled.");
    process.exit(1);
  }

  // Process submodules first.
  // Use git submodule foreach to add, commit, and push any changes inside each submodule.
  // The "|| true" ensures that if a submodule has nothing to commit, it won't cause the script to exit.
  console.log("Processing submodules...");
  const [subAddRes, subAddErr] = await tryExec(
    $`git submodule foreach --recursive 'git add . || true'`.text(),
    "Failed to add files in submodules"
  );
  if (subAddErr) {
    console.error(subAddErr);
    process.exit(1);
  }
  const [subCommitRes, subCommitErr] = await tryExec(
    $`git submodule foreach --recursive 'git commit -m "${commitMessage}" || true'`.text(),
    "Failed to commit changes in submodules"
  );
  if (subCommitErr) {
    console.error(subCommitErr);
    process.exit(1);
  }
  const [subPushRes, subPushErr] = await tryExec(
    $`git submodule foreach --recursive 'git push || true'`.text(),
    "Failed to push changes in submodules"
  );
  if (subPushErr) {
    console.error(subPushErr);
    process.exit(1);
  }

  // Process the main repository.
  const [addRes, addErr] = await tryExec($`git add .`, "Failed to add files in main repository");
  if (addErr) {
    console.error(addErr);
    process.exit(1);
  }
  const [commitRes, commitErr] = await tryExec(
    $`git commit -m "${commitMessage}"`,
    "Failed to commit main repository changes"
  );
  if (commitErr) {
    console.error(commitErr);
    process.exit(1);
  }
  const [pushRes, pushErr] = await tryExec($`git push`, "Failed to push changes in main repository");
  if (pushErr) {
    console.error(pushErr);
    process.exit(1);
  }

  console.log("Successfully added, committed, and pushed changes in main repository and all submodules!");
}

if (require.main === module) {
  fastPush();
}
