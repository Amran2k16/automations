import { $ } from "bun";
import { tryExec } from "../../utils/tryExec";
import { getUserConfirmation } from "../../utils/get-user-confirmation";

// This function is used to update the git submodule.
// It gets user confirmation before proceeding.
export async function updateSubmodule() {
  // Check for submodule status
  const [status, statusErr] = await tryExec($`git submodule status`.text(), "Failed to check submodule status");
  if (statusErr) {
    console.error(statusErr);
    process.exit(1);
  }

  console.log(`Current submodule status: \n${status.trim()}`);

  const answer = await getUserConfirmation("Are you sure you want to update the submodule?", ["yes", "no"]);

  if (answer.toLowerCase() === "yes") {
    // Update submodule
    const [_, updateErr] = await tryExec($`git submodule update --init --recursive`, "Failed to update submodule");
    if (updateErr) {
      console.error(updateErr);
      process.exit(1);
    }

    console.log("Successfully updated the submodule!");
  } else {
    console.log("Action cancelled.");
  }
}

if (require.main === module) {
  updateSubmodule();
}
