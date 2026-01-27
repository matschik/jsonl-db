import { type JsonObject, createJsonlFile } from "./jsonl";
import { temporaryFileTask } from "./temporaryFileTask";
import path from "node:path";
import { promises } from "node:fs";

export function jsonlDir(dirPath: string) {
    return {
        file<T extends JsonObject = JsonObject>(entityName: string) {
            const filePath = path.join(dirPath, entityName + ".jsonl");
            const jsonlFile = createJsonlFile<T>(filePath);
            return {
                async add(data: T | T[], mutateDb = true): Promise<T[]> {
                    let itemsToAdd: T[] = [];
                    if (Array.isArray(data)) {
                        if (data.length === 0) {
                            return [];
                        }
                        itemsToAdd = data;
                    } else if (isSingleJson(data)) {
                        itemsToAdd = [data];
                    } else {
                        throw new Error("add() only accepts a single json object or an array of json objects");
                    }
                    if (mutateDb) {
                        // Persistent: append to file
                        await jsonlFile.appendText(itemsToAdd.map(jsonObject => JSON.stringify(jsonObject)));
                    }
                    return itemsToAdd;
                },
                async findOne(matchFn: (data: T) => boolean): Promise<T | undefined> {
                    let found: T | undefined;
                    let canEnd = false;
                    await jsonlFile.read(batch => {
                        for (const jsonObject of batch) {
                            if (matchFn(jsonObject)) {
                                found = jsonObject;
                                canEnd = true;
                                return true;
                            }
                        }
                        return canEnd;
                    });

                    return found;
                },
                async find(matchFn: (data: T) => boolean): Promise<T[]> {
                    let found: T[] = [];
                    await jsonlFile.read(batch => {
                        for (const jsonObject of batch) {
                            if (matchFn(jsonObject)) {
                                found.push(jsonObject);
                            }
                        }
                        return false;
                    });
                    return found;
                },
                async update(matchFn: (data: T) => boolean, updateFn: (data: T) => T, mutateDb = false): Promise<T[]> {
                    let updated: T[] = [];
                    if (mutateDb) {
                        // Persistent: update temporary file, then replace original
                        await temporaryFileTask(
                            async tempPath => {
                                const tempFile = createJsonlFile<T>(tempPath);
                                await jsonlFile.read(async batch => {
                                    const processedBatch = batch.map(jsonObject => {
                                        if (matchFn(jsonObject)) {
                                            const updatedObject = updateFn(jsonObject);
                                            updated.push(updatedObject);
                                            return updatedObject;
                                        }
                                        return jsonObject;
                                    });
                                    await tempFile.append(processedBatch);
                                    return false;
                                });
                                // Atomic rename: replace original with temp file
                                await promises.rename(tempPath, filePath);
                            },
                            { extension: ".jsonl" }
                        );
                        return updated;
                    } else {
                        // Non-persistent: just collect and return
                        await jsonlFile.read(batch => {
                            for (const jsonObject of batch) {
                                if (matchFn(jsonObject)) {
                                    updated.push(updateFn(jsonObject));
                                }
                            }
                            return false;
                        });
                        return updated;
                    }
                },
                async delete(matchFn: (data: T) => boolean, mutateDb = false): Promise<T[]> {
                    let kept: T[] = [];
                    if (mutateDb) {
                        // Persistent: update temporary file, then replace original
                        await temporaryFileTask(
                            async tempPath => {
                                const tempFile = createJsonlFile<T>(tempPath);
                                await jsonlFile.read(async batch => {
                                    const keptBatch = batch.filter(jsonObject => {
                                        if (!matchFn(jsonObject)) {
                                            kept.push(jsonObject);
                                            return true; // keep this item
                                        }
                                        return false; // exclude from kept items
                                    });

                                    if (keptBatch.length > 0) {
                                        await tempFile.append(keptBatch);
                                    }
                                    return false;
                                });
                                // Atomic rename: replace original with temp file
                                await promises.rename(tempPath, filePath);
                            },
                            { extension: ".jsonl" }
                        );
                        return kept;
                    } else {
                        // Non-persistent: just collect and return
                        await jsonlFile.read(batch => {
                            for (const jsonObject of batch) {
                                if (!matchFn(jsonObject)) {
                                    kept.push(jsonObject);
                                }
                            }
                            return false;
                        });
                        return kept;
                    }
                },
                async count() {
                    return await jsonlFile.count();
                }
            };
        }
    };
}

function isSingleJson(o: any): o is JsonObject {
    return typeof o === "object" && o !== null && !Array.isArray(o);
}

