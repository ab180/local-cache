import * as core from "@actions/core";
import * as crypto from "crypto";

import { Events, Inputs } from "./constants";
import * as actionUtils from "./utils/actionUtils";
import * as utils from "./utils/utils";

async function restoreImpl(): Promise<string | undefined> {
    try {
        // Validate inputs, this can cause task failure
        if (!actionUtils.isValidEvent()) {
            actionUtils.logWarning(
                `Event Validation Error: The event type ${
                    process.env[Events.Key]
                } is not supported because it's not tied to a branch or tag ref.`
            );
            return;
        }

        const key = core.getInput(Inputs.Key, { required: true });
        utils.checkKey(key);

        const paths = actionUtils.getInputAsArray(Inputs.Path, {
            required: true
        });
        const failOnCacheMiss = actionUtils.getInputAsBool(
            Inputs.FailOnCacheMiss
        );
        const lookupOnly = actionUtils.getInputAsBool(Inputs.LookupOnly);
        const localCachePath = core.getInput(Inputs.LocalCachePath);
        const cachePath = `${localCachePath}/${key}`;

        const find = await utils.exec(
            `find "${localCachePath}" -maxdepth 1 -name "${key}" -type d`
        );
        const cacheFind = find.stdout ? true : false;

        let cacheHit = false;
        if (cacheFind) {
            const hasPartialCache = await utils.exec(
                `find "${cachePath}" -maxdepth 1 -name .partialCache -type f`
            );
            cacheHit = hasPartialCache.stdout ? false : true;
        } else {
            cacheHit = false;
        }

        if (!cacheHit) {
            if (failOnCacheMiss) {
                throw new Error(
                    `Failed to restore cache entry. Exiting as fail-on-cache-miss is set. Input key: ${key}`
                );
            }
            core.info(`Cache not found for input keys: ${key}.`);

            return;
        }

        if (lookupOnly) {
            core.info(`Cache found and can be restored from key: ${key}`);
        } else {
            // iterate paths
            for (const path of paths) {
                const pathKey = crypto
                    .createHash("md5")
                    .update(path)
                    .digest("hex");
                await utils.exec(`mkdir -p "${path}"`);
                await utils.exec(`tar -xzf "${cachePath}/${pathKey}.tar.gz"`);
                core.info(
                    `Cache restored from key: ${key}/${path} -> ${pathKey}`
                );
            }
        }

        return key;
    } catch (error: unknown) {
        core.setFailed((error as Error).message);
    }
}

export default restoreImpl;
