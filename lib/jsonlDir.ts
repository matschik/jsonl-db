import { type JsonObject, createJsonlFile } from "./jsonl"
import path from "node:path";

export function jsonlDir(dirPath: string) {
    return {
        file(entityName: string) {
            const filePath = path.join(dirPath, entityName + ".jsonl");
            const jsonlFile = createJsonlFile(filePath);
            return {
                async add(data: JsonObject | JsonObject[]): Promise<void> {
                    if (Array.isArray(data)) {
                        if (data.length === 0) {
                            return;
                        }
                        return jsonlFile.appendText(data.map((jsonObject) => JSON.stringify(jsonObject)));
                    }

                    if (isSingleJson(data)) {
                        return jsonlFile.appendText([JSON.stringify(data)]);
                    }

                    throw new Error("add() only accepts a single json object or an array of json objects");
                },
                async findOne(matchFn: (data: JsonObject) => boolean): Promise<JsonObject | undefined> {
                    let found: JsonObject | undefined;
                    let canEnd = false;
                     await jsonlFile.read((batch) => {
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
                async find(matchFn: (data: JsonObject) => boolean): Promise<JsonObject[]> {
                    let found: JsonObject[] = [];
                    await jsonlFile.read((batch) => {
                        for (const jsonObject of batch) {
                            if (matchFn(jsonObject)) {
                                found.push(jsonObject);
                            }
                        }
                        return false;
                    });
                    return found;
                },
                async update(matchFn: (data: JsonObject) => boolean, updateFn: (data: JsonObject) => JsonObject): Promise<JsonObject[]> {
                    let updated: JsonObject[] = [];
                    await jsonlFile.read((batch) => {  
                        for (const jsonObject of batch) {
                            if (matchFn(jsonObject)) {
                                updated.push(updateFn(jsonObject));
                            }
                        }
                        return false;
                    });
                    return updated;
                },
                async delete(matchFn: (data: JsonObject) => boolean): Promise<JsonObject[]> {
                    let deleted: JsonObject[] = [];
                    await jsonlFile.read((batch) => {
                        for (const jsonObject of batch) {
                            if (!matchFn(jsonObject)) {
                                deleted.push(jsonObject);
                            }
                        }
                        return false;
                    });
                    return deleted;
                },
                async count() {
                    return await jsonlFile.count();
                }
            }
        }
    }
}

function isSingleJson(o: any): o is JsonObject {
    return typeof o === "object" && o !== null && !Array.isArray(o);
}

