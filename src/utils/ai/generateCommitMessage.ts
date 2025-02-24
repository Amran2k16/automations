import OpenAI from "openai";

export const generateCommitMessage = async (gitDiff: string): Promise<string> => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemMessage = `
You are a helpful assistant that writes clear and informative git commit messages.
Guidelines:
 - Start with a concise title (under 50 characters) with no quotes or backticks.
 - Follow the title with a blank line and then a detailed body.
 - The body may include bullet points (each starting with a dash) for key changes.
 - Use present tense, focusing on what and why, not how.
 - Ensure the entire message is under 400 characters.
Examples:
Add user login

- Update authentication service
- Improve error handling for login

Fix header bug

- Correct alignment in header component
- Remove unnecessary styling properties
  `.trim();

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: `Write a commit message for these changes:\n${gitDiff}` },
    ],
    model: "gpt-4o-mini",
  });

  return completion.choices[0].message.content ?? "No message generated";
};
