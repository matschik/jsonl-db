import { createReadStream } from "node:fs";
import { access, appendFile, rename, writeFile, rm } from "node:fs/promises";
import { createInterface, Interface } from "node:readline";
import { temporaryFileTask } from "./lib/temporaryFileTask.js";

// Type definitions
export interface JsonObject {
  [key: string]: any;
}

export type OnLineCallback = (line: JsonObject) => boolean | Promise<boolean>;
export type OnBatchCallback = (batch: JsonObject[]) => boolean | Promise<boolean>;
export type MatchFunction = (line: JsonObject) => boolean | Promise<boolean>;
export type UpdateFunction = (line: JsonObject) => JsonObject | Promise<JsonObject>;

export interface JsonlFileInstance {
  add(o: JsonObject): Promise<void>;
  addMany(os: JsonObject[]): Promise<void>;
  first(): Promise<JsonObject>;
  last(): Promise<JsonObject>;
  read(onLine: OnLineCallback): Promise<void>;
  readByBatch(onBatch: OnBatchCallback, batchSize: number): Promise<void>;
  findWhere(attribute: string, value: any): Promise<JsonObject | undefined>;
  findMatch(matchFn: MatchFunction): Promise<JsonObject[]>;
  count(): Promise<number>;
  countMatch(matchFn: MatchFunction): Promise<number>;
  updateWhere(attribute: string, value: any, updateFn: UpdateFunction): Promise<void>;
  updateMatch(matchFn: MatchFunction, updateFn: UpdateFunction): Promise<void>;
  deleteWhere(attribute: string, value: any): Promise<void>;
  deleteMatch(matchFn: MatchFunction): Promise<void>;
  deleteFile(): Promise<void>;
}

function isSingleJson(o: any): o is JsonObject {
  return typeof o === "object" && o !== null && !Array.isArray(o);
}

export default function jsonlFile(path: string): JsonlFileInstance {
  function getRl(): Interface {
    return createInterface({
      input: createReadStream(path),
      crlfDelay: Infinity,
    });
  }

  async function isEmptyFile(): Promise<boolean> {
    if (!(await safePathExists(path))) {
      return true;
    }
    const rl = getRl();
    let isEmpty = true;
    for await (const _line of rl) {
      isEmpty = false;
      break;
    }
    return isEmpty;
  }

  async function ensureFileAndGetPrefix(): Promise<string> {
    let fileIsEmpty = false;
    if (!(await safePathExists(path))) {
      await writeFile(path, "");
      fileIsEmpty = true;
    } else {
      fileIsEmpty = await isEmptyFile();
    }

    const prefix = fileIsEmpty ? "" : "\n";
    return prefix;
  }

  async function addText(line: string): Promise<void> {
    const prefix = await ensureFileAndGetPrefix();
    await appendFile(path, prefix + line);
  }

  async function addManyText(lines: string[]): Promise<void> {
    const prefix = await ensureFileAndGetPrefix();
    await appendFile(path, prefix + lines.join("\n"));
  }

  return {
    async add(o: JsonObject): Promise<void> {
      if (!isSingleJson(o)) {
        throw new Error("add() only accepts a single json object");
      }
      return addText(JSON.stringify(o));
    },
    async addMany(os: JsonObject[]): Promise<void> {
      if (!Array.isArray(os)) {
        throw new Error("addMany() only accepts an array of json objects");
      }
      if (os.length === 0) {
        return;
      }
      if (!os.every(isSingleJson)) {
        throw new Error("addMany() only accepts an array of json objects");
      }
      return addManyText(os.map((o) => JSON.stringify(o)));
    },
    async first(): Promise<JsonObject> {
      const rl = getRl();

      let firstLine: string | undefined;
      for await (const line of rl) {
        firstLine = line;
        break;
      }

      if (!firstLine) {
        throw new Error("File is empty");
      }

      return JSON.parse(firstLine);
    },
    async last(): Promise<JsonObject> {
      const rl = getRl();

      let lastLine: string | undefined;
      for await (const line of rl) {
        lastLine = line;
      }

      if (!lastLine) {
        throw new Error("File is empty");
      }

      return JSON.parse(lastLine);
    },
    async read(onLine: OnLineCallback): Promise<void> {
      const rl = getRl();
      for await (const line of rl) {
        const canEnd = await onLine(JSON.parse(line));
        if (canEnd) {
          break;
        }
      }
    },
    async readByBatch(onBatch: OnBatchCallback, batchSize: number): Promise<void> {
      const rl = getRl();

      let batch: JsonObject[] = [];
      let canEndGlobal = false;

      for await (const line of rl) {
        batch.push(JSON.parse(line));

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
    },
    async findWhere(attribute: string, value: any): Promise<JsonObject | undefined> {
      let found: JsonObject | undefined;
      await this.read((line) => {
        if (line[attribute] === value) {
          found = line;
          return true;
        }
        return false;
      });
      return found;
    },
    async findMatch(matchFn: MatchFunction): Promise<JsonObject[]> {
      let found: JsonObject[] = [];
      await this.read(async (line) => {
        if (await matchFn(line)) {
          found.push(line);
        }
        return false;
      });
      return found;
    },
    async count(): Promise<number> {
      const rl = getRl();

      let lineCount = 0;
      for await (const _line of rl) {
        lineCount++;
      }

      return lineCount;
    },
    async countMatch(matchFn: MatchFunction): Promise<number> {
      let lineCount = 0;
      await this.read(async (line) => {
        if (await matchFn(line)) {
          lineCount++;
        }
        return false;
      });
      return lineCount;
    },
    async updateWhere(attribute: string, value: any, updateFn: UpdateFunction): Promise<void> {
      await temporaryFileTask(async (tmpPath) => {
        const tmpFile = jsonlFile(tmpPath);
        await this.read(async (line) => {
          if (line[attribute] === value) {
            const updatedLine = await updateFn(line);
            await tmpFile.add(updatedLine);
          } else {
            await tmpFile.add(line);
          }
          return false;
        });

        await rename(tmpPath, path);
      });
    },
    async updateMatch(matchFn: MatchFunction, updateFn: UpdateFunction): Promise<void> {
      await temporaryFileTask(async (tmpPath) => {
        const tmpFile = jsonlFile(tmpPath);
        await this.read(async (line) => {
          if (await matchFn(line)) {
            const updatedLine = await updateFn(line);
            await tmpFile.add(updatedLine);
          } else {
            await tmpFile.add(line);
          }
          return false;
        });

        await rename(tmpPath, path);
      });
    },
    async deleteWhere(attribute: string, value: any): Promise<void> {
      await temporaryFileTask(async (tmpPath) => {
        const tmpFile = jsonlFile(tmpPath);
        await this.read(async (line) => {
          if (line[attribute] !== value) {
            await tmpFile.add(line);
          }
          return false;
        });

        await rename(tmpPath, path);
      });
    },
    async deleteMatch(matchFn: MatchFunction): Promise<void> {
      await temporaryFileTask(async (tmpPath) => {
        const tmpFile = jsonlFile(tmpPath);
        await this.read(async (line) => {
          if (!(await matchFn(line))) {
            await tmpFile.add(line);
          }
          return false;
        });

        await rename(tmpPath, path);
      });
    },
    async deleteFile(): Promise<void> {
      await rm(path);
    },
  };
}

async function safePathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return false;
    } else {
      throw error;
    }
  }
}
