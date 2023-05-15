import * as core from "@actions/core";
import * as crypto from "crypto";

import { Events, Inputs } from "./constants";
import * as actionUtils from "./utils/actionUtils";
import * as utils from "./utils/utils";

// Catch and log any unhandled exceptions.  These exceptions can leak out of the uploadChunk method in
// @actions/toolkit when a failed upload closes the file descriptor causing any in-process reads to
// throw an uncaught exception.  Instead of failing this action, just warn.
process.on("uncaughtException", e => actionUtils.logWarning(e.message));

async function saveImpl(): Promise<void> {
    try {
        if (!actionUtils.isValidEvent()) {
            actionUtils.logWarning(
                `Event Validation Error: The event type ${
                    process.env[Events.Key]
                } is not supported because it's not tied to a branch or tag ref.`
            );
            return;
        }

        const key = core.getInput(Inputs.Key);

        if (!key) {
            actionUtils.logWarning(`Key is not specified.`);
            return;
        }

        const localCachePath = core.getInput(Inputs.LocalCachePath);
        const cachePath = `${localCachePath}/${key}`;
        const paths = actionUtils.getInputAsArray(Inputs.Path, {
            required: true
        });

        await utils.exec(`mkdir -p ${cachePath}/`);
        await utils.exec(`touch ${cachePath}/.partialCache`);
        for (const path of paths) {
            const pathKey = crypto.createHash("md5").update(path).digest("hex");
            await utils.exec(
                `cd "${path}" && tar -czf "/tmp/${pathKey}.tar.gz" .`
            );
            await utils.exec(
                `rsync --checksum "/tmp/${pathKey}.tar.gz" "${cachePath}/${pathKey}.tar.gz"`
            );
            core.info(
                `Cache saved to key: "${path}" -> "${cachePath}/${pathKey}.tar.gz"`
            );
        }
        await utils.exec(`rm ${cachePath}/.partialCache`);
    } catch (error: unknown) {
        actionUtils.logWarning((error as Error).message);
    }
}

export default saveImpl;
