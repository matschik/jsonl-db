import { createReadStream } from "node:fs";
import { access, appendFile, rename, writeFile, rm } from "node:fs/promises";
import { createInterface } from "node:readline";
import { temporaryFileTask } from "tempy";

function isSingleJson(o) {
  return typeof o === "object" && o !== null && !Array.isArray(o);
}

export default function jsonlFile(path) {
  function getRl() {
    return createInterface({
      input: createReadStream(path),
      crlfDelay: Infinity,
    });
  }

  async function isEmptyFile() {
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

  async function ensureFileAndGetPrefix() {
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

  async function addText(line) {
    const prefix = await ensureFileAndGetPrefix();
    await appendFile(path, prefix + line);
  }

  async function addManyText(lines) {
    const prefix = await ensureFileAndGetPrefix();
    await appendFile(path, prefix + lines.join("\n"));
  }

  return {
    async add(o) {
      if (!isSingleJson(o)) {
        throw new Error("add() only accepts a single json object");
      }
      return addText(JSON.stringify(o));
    },
    async addMany(os) {
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
    async first() {
      const rl = getRl();

      let firstLine;
      for await (const line of rl) {
        firstLine = line;
        break;
      }

      return JSON.parse(firstLine);
    },
    async last() {
      const rl = getRl();

      let lastLine;
      for await (const line of rl) {
        lastLine = line;
      }

      return JSON.parse(lastLine);
    },
    async read(onLine) {
      const rl = getRl();
      for await (const line of rl) {
        const canEnd = await onLine(JSON.parse(line));
        if (canEnd) {
          break;
        }
      }
    },
    async readByBatch(onBatch, batchSize) {
      const rl = getRl();

      let batch = [];
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
    async findWhere(attribute, value) {
      let found;
      await this.read((line) => {
        if (line[attribute] === value) {
          found = line;
          return true;
        }
        return false;
      });
      return found;
    },
    async findMatch(matchFn) {
      let found = [];
      await this.read(async (line) => {
        if (await matchFn(line)) {
          found.push(line);
        }
      });
      return found;
    },
    async count() {
      const rl = getRl();

      let lineCount = 0;
      for await (const _line of rl) {
        lineCount++;
      }

      return lineCount;
    },
    async countMatch(matchFn) {
      let lineCount = 0;
      await this.read(async (line) => {
        if (await matchFn(line)) {
          lineCount++;
        }
      });
      return lineCount;
    },
    async updateWhere(attribute, value, updateFn) {
      await temporaryFileTask(async (tmpPath) => {
        const tmpFile = jsonlFile(tmpPath);
        await this.read(async (line) => {
          if (line[attribute] === value) {
            const updatedLine = await updateFn(line);
            await tmpFile.add(updatedLine);
          } else {
            await tmpFile.add(line);
          }
        });

        await rename(tmpPath, path);
      });
    },
    async updateMatch(matchFn, updateFn) {
      await temporaryFileTask(async (tmpPath) => {
        const tmpFile = jsonlFile(tmpPath);
        await this.read(async (line) => {
          if (await matchFn(line)) {
            const updatedLine = await updateFn(line);
            await tmpFile.add(updatedLine);
          } else {
            await tmpFile.add(line);
          }
        });

        await rename(tmpPath, path);
      });
    },
    async deleteWhere(attribute, value) {
      await temporaryFileTask(async (tmpPath) => {
        const tmpFile = jsonlFile(tmpPath);
        await this.read(async (line) => {
          if (line[attribute] !== value) {
            await tmpFile.add(line);
          }
        });

        await rename(tmpPath, path);
      });
    },
    async deleteMatch(matchFn) {
      await temporaryFileTask(async (tmpPath) => {
        const tmpFile = jsonlFile(tmpPath);
        await this.read(async (line) => {
          if (!(await matchFn(line))) {
            await tmpFile.add(line);
          }
        });

        await rename(tmpPath, path);
      });
    },
    async deleteFile() {
      await rm(path);
    },
  };
}

async function safePathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    } else {
      throw error;
    }
  }
}
