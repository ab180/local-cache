import * as e from "@actions/exec";

class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
        Object.setPrototypeOf(this, ValidationError.prototype)
    }
}

export const checkPaths = (paths: string[]): void => {
    if (!paths || paths.length === 0) {
        throw new ValidationError(
            `Path Validation Error: At least one directory or file path is required`
        );
    }
};

export const checkKey = (key: string): void => {
    if (key.length > 512) {
        throw new ValidationError(
            `Key Validation Error: ${key} cannot be larger than 512 characters.`
        );
    }
    const regex = /^[^/]+$/;
    if (!regex.test(key)) {
        throw new ValidationError(
            `Key Validation Error: ${key} cannot contain slash.`
        );
    }
};

export const exec = async (
    command: string,
    cwd?: string
): Promise<{ stdout: string; stderr: string }> => {
    const { stdout, stderr } = await e.getExecOutput(command, [], { cwd: cwd });
    return { stdout, stderr };
};
