import { createReadStream } from "node:fs";
import { createInterface, Interface } from "node:readline";
import fs from "node:fs/promises";

export interface JsonObject {
    [key: string]: any;
}

export type OnBatchCallback<T extends JsonObject = JsonObject> = (batch: T[]) => boolean | Promise<boolean>;
export type OnLineCallback<T extends JsonObject = JsonObject> = (line: T) => void | boolean | Promise<void | boolean>;

export function createJsonlFile<T extends JsonObject = JsonObject>(filePath: string) {
    async function ensure(){
        let fileIsEmpty = false;
        if (!(await safePathExists(filePath))) {
            await fs.writeFile(filePath, "");
            fileIsEmpty = true;
        } else {
            fileIsEmpty = await isEmptyFile(filePath);
        }
    
        const linePrefix = fileIsEmpty ? "" : "\n";
        return linePrefix;
    }

    async function read(onBatch: OnBatchCallback<T>, batchSize: number = 1000) {
        if (!(await safePathExists(filePath))) {
            return; // File doesn't exist, nothing to read
        }

        const rl = getRl(filePath);

        let batch: T[] = [];
        let canEndGlobal = false;

        try {
            for await (const line of rl) {
                if (line.trim() === "") continue; // Skip empty lines
                
                try {
                    const parsed = JSON.parse(line);
                    batch.push(parsed);
                } catch (parseError) {
                    console.warn(`Warning: Skipping invalid JSON line: ${line.substring(0, 100)}...`);
                    continue;
                }

                if (batch.length === batchSize) {
                    const canEnd = await onBatch(batch);
                    if (canEnd) {
                        canEndGlobal = true;
                        break;
                    }
                    batch = [];
                }
            }

            if (batch.length > 0 && !canEndGlobal) {
                await onBatch(batch);
            }
        } finally {
            rl.close();
        }
    }

    async function readLineByLine(onLine: OnLineCallback<T>) {
        if (!(await safePathExists(filePath))) {
            return; // File doesn't exist, nothing to read
        }

        const rl = getRl(filePath);

        try {
            for await (const line of rl) {
                if (line.trim() === "") continue; // Skip empty lines
                
                try {
                    const parsed = JSON.parse(line);
                    const result = await onLine(parsed);
                    if (result === true) {
                        break; // Stop reading
                    }
                } catch (parseError) {
                    console.warn(`Warning: Skipping invalid JSON line: ${line.substring(0, 100)}...`);
                    continue;
                }
            }
        } finally {
            rl.close();
        }
    }

    return {
        read,
        readLineByLine,
        ensure,
        async appendText(lines: string[]): Promise<void> {
            if (lines.length === 0) return;
            
            const linePrefix = await ensure();
            await fs.appendFile(filePath, linePrefix + lines.join("\n"));
        },
        
        async append(data: T | T[]): Promise<void> {
            const lines = Array.isArray(data) ? data : [data];
            const jsonLines = lines.map(obj => JSON.stringify(obj));
            await this.appendText(jsonLines);
        },
        
        async delete(): Promise<void> {
            if (await safePathExists(filePath)) {
                await fs.rm(filePath);
            }
        },
        
        async count(): Promise<number> {
            if (!(await safePathExists(filePath))) {
                return 0;
            }
            
            let lineCount = 0;
            await read((batch) => {
                lineCount += batch.length;
                return false;
            });
            return lineCount;
        },
        
        async isEmpty(): Promise<boolean> {
            return await isEmptyFile(filePath);
        },
        
        async clear(): Promise<void> {
            await fs.writeFile(filePath, "");
        },
        
        async getPath(): Promise<string> {
            return filePath;
        },
        
        async exists(): Promise<boolean> {
            return await safePathExists(filePath);
        }
    }
}

async function isEmptyFile(filePath: string): Promise<boolean> {
    if (!(await safePathExists(filePath))) {
        return true;
    }
    
    try {
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
            return true;
        }
    } catch {
        return true;
    }
    
    const rl = getRl(filePath);
    let isEmpty = true;
    
    try {
        for await (const _line of rl) {
            if (_line.trim() !== "") {
                isEmpty = false;
                break;
            }
        }
    } finally {
        rl.close();
    }
    
    return isEmpty;
}

async function safePathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error: any) {
        if (error.code === "ENOENT") {
            return false;
        } else {
            throw error;
        }
    }
}

function getRl(filePath: string): Interface {
    return createInterface({
        input: createReadStream(filePath),
        crlfDelay: Infinity,
    });
}
