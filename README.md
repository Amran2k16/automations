# Automations

This repository is a public repository containing tons of automation scripts for my personal and professional projects.
In order to use them properly, clone the repository and ensure that you have a .env.local file in the root of the project.

Different script requires different environment variables, so please refer to the script you want to run for more information.

## How to use

```bash
bun install
bun run dev
```

from the root of the project run `bun run src/path/to/file.ts`

Personally I use vs code runner, this lets me right click on any file and hit run from the root of my project.

## Information

Each automation script is written as an exported function that allows other scripts to also use it. To facilitate running the script directly, I check if the the script is being executed directly and not being imported by another script.

## Git
