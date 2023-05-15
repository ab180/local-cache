import restoreImpl from "./restoreImpl";

async function run(): Promise<void> {
    await restoreImpl();
}

run();

export default run;
