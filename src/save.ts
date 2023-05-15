import saveImpl from "./saveImpl";

async function run(): Promise<void> {
    await saveImpl();
}

run();

export default run;
