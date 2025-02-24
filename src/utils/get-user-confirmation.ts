import { createInterface } from "readline";

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const getUserConfirmation = (message: string, options: string[]): Promise<string> => {
  const formattedOptions = options.join("/");
  return new Promise((resolve) => {
    readline.question(`${message} (${formattedOptions}): `, (answer: string) => {
      resolve(answer);
      readline.close();
    });
  });
};
