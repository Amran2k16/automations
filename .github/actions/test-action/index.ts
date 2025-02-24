import core from "@actions/core";

async function main(){
    try {
        const name = core.getInput('name');
        console.log(`Hello, ${name}! This is a custom GitHub Action.`);
        core.setOutput("message", `Welcome, ${name}!`);
    } catch (error:any) {
        core.setFailed(error.message);
    }
}

main();