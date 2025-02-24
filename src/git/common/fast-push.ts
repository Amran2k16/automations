import { $ } from "bun";
import { tryExec } from "../../utils/tryExec";
import { generateCommitMessage } from "../../utils/ai/generateCommitMessage";
import { getUserConfirmation } from "../../utils/get-user-confirmation";

// This function is used to commit and push changes to the main branch.
// It requires open API Key to be set in the environment variables.
// It also gets user confirmation before proceeding.
export async function fastPush() {
  // Check for changes
  const [status, statusErr] = await tryExec($`git status --porcelain`.text(), "Failed to check git status");
  if (statusErr) {
    console.error(statusErr);
    process.exit(1);
  }

  if (status.length === 0) {
    console.log("No changes to commit");
    process.exit(1);
  }

  // Get commit message from OpenAI
  const [gitDiff, diffErr] = await tryExec($`git diff`.text(), "Failed to get git diff");
  if (diffErr) {
    console.error(diffErr);
    process.exit(1);
  }

  if (gitDiff.length === 0) {
    console.log("No changes detected in git diff");
    process.exit(1);
  }

  const commitMessage = await generateCommitMessage(gitDiff);
  if (!commitMessage) {
    console.error("Failed to generate commit message");
    process.exit(1);
  }

  // List files to be committed
  const [files, filesErr] = await tryExec($`git diff --name-status`.text(), "Failed to list files");
  if (filesErr) {
    console.error(filesErr);
    process.exit(1);
  }

  console.log(`Commit message: "${commitMessage}"`);
  console.log(`The following changes will be committed: \n ${files.trim()}"`);

  const answer = await getUserConfirmation("Are you sure you want to commit and push these changes to main?", [
    "yes",
    "no",
  ]);

  if (answer.toLowerCase() === "yes") {
    // Add changes
    const [_, addErr] = await tryExec($`git add .`, "Failed to add files");
    if (addErr) {
      console.error(addErr);
      process.exit(1);
    }

    // Commit changes with AI generated message
    const [__, commitErr] = await tryExec($`git commit -m "${commitMessage}"`, "Failed to commit changes");
    if (commitErr) {
      console.error(commitErr);
      process.exit(1);
    }

    // Push changes
    const [___, pushErr] = await tryExec($`git push`, "Failed to push changes");
    if (pushErr) {
      console.error(pushErr);
      process.exit(1);
    }

    console.log("Successfully added, committed and pushed changes!");
  } else {
    console.log("Action cancelled.");
  }
}

if (require.main === module) {
  fastPush();
}
