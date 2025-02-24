import { $ } from "bun";
import { tryExec } from "../../utils/tryExec";
import { getUserConfirmation } from "../../utils/get-user-confirmation";

(async () => {
  // Check for changes
  const [status, statusErr] = await tryExec($`git status --porcelain`, "Failed to check git status");
  if (statusErr) {
    console.error(statusErr);
    process.exit(1);
  }

  if (status.stdout.length === 0) {
    console.log("No changes to clear");
    process.exit(1);
  }

  // List files to be cleared
  const [files, filesErr] = await tryExec($`git ls-files --others --exclude-standard`, "Failed to list files");
  if (filesErr) {
    console.error(filesErr);
    process.exit(1);
  }

  const filesOutput = files.stdout.toString().trim();
  if (filesOutput.length === 0) {
    console.log("No untracked files to clear");
  } else {
    console.log("The following untracked files will be cleared:");
    console.log(filesOutput);
  }

  // Confirm action
  const answer = await getUserConfirmation(
    "Are you sure you want to clear all changes and untracked files? This action is irreversible.",
    ["yes", "no"]
  );

  if (answer.toLowerCase() === "no") {
    console.log("Action cancelled.");
    return;
  }

  // Clean untracked files
  const [clean, cleanErr] = await tryExec($`git clean -fd`, "Failed to clean untracked files");
  if (cleanErr) {
    console.error(cleanErr);
    process.exit(1);
  }

  // Reset changes
  const [reset, resetErr] = await tryExec($`git reset --hard`, "Failed to reset changes");
  if (resetErr) {
    console.error(resetErr);
    process.exit(1);
  }

  console.log("Successfully cleared all changes and untracked files!");
})();
