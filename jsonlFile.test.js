import { describe, afterEach, test, expect } from "vitest";
import jsonlFile from "./jsonlFile.js";

describe("jsonlFile", () => {
  const file = jsonlFile("test.jsonl");

  afterEach(async () => {
    // Clean up test file after each test
    await file.deleteFile();
  });

  test("add() should add a single JSON object to file", async () => {
    await file.add({ name: "Alice", age: 25 });
    const count = await file.count();
    expect(count).toBe(1);
  });

  test("addMany() should add a multiple JSON objects to file", async () => {
    await file.addMany([
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ]);
    const count = await file.count();
    expect(count).toBe(2);
  });

  test("read() should iterate over each line in file", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });

    const lines = [];
    await file.read((line) => {
      lines.push(line);
      return false;
    });

    expect(lines).toEqual([
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ]);
  });

  test("read() should iterate over each line in file", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });

    const lines = [];
    await file.read((line) => {
      lines.push(line);
      return false;
    });

    expect(lines).toEqual([
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ]);
  });

  test("readByBatch() should iterate over batches of lines in file", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });
    await file.add({ name: "Charlie", age: 35 });

    const batches = [];
    await file.readByBatch((batch) => {
      batches.push(batch);
      return false;
    }, 2);

    expect(batches).toEqual([
      [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
      ],
      [{ name: "Charlie", age: 35 }],
    ]);
  });

  test("findWhere() should find first line where attribute matches value", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });

    const line = await file.findWhere("name", "Bob");
    expect(line).toEqual({ name: "Bob", age: 30 });
  });

  test("findMatch() should find all lines that match given function", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });
    await file.add({ name: "Charlie", age: 35 });

    const lines = await file.findMatch((line) => line.age >= 30);
    expect(lines).toEqual([
      { name: "Bob", age: 30 },
      { name: "Charlie", age: 35 },
    ]);
  });

  test("count() should return the number of lines in file", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });

    const count = await file.count();
    expect(count).toBe(2);
  });

  test("countMatch() should return the number of lines that match given function", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });
    await file.add({ name: "Charlie", age: 35 });

    const count = await file.countMatch((line) => line.age >= 30);
    expect(count).toBe(2);
  });

  test("updateWhere() should update first line where attribute matches value", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });

    await file.updateWhere("name", "Bob", (line) => ({ ...line, age: 35 }));

    const line = await file.findWhere("name", "Bob");
    expect(line).toEqual({ name: "Bob", age: 35 });
  });

  test("updateMatch() should update all lines that match given function", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });
    await file.add({ name: "Charlie", age: 35 });

    await file.updateMatch(
      (line) => line.age >= 30,
      (line) => ({ ...line, age: line.age + 5 })
    );

    const lines = await file.findMatch((line) => line.age > 30);
    expect(lines).toEqual([
      { name: "Bob", age: 35 },
      { name: "Charlie", age: 40 },
    ]);
  });

  test("deleteWhere() should delete first line where attribute matches value", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });

    await file.deleteWhere("name", "Bob");

    const count = await file.count();
    expect(count).toBe(1);

    const line = await file.findWhere("name", "Bob");
    expect(line).toBeUndefined();
  });

  test("deleteMatch() should delete all lines that match given function", async () => {
    await file.add({ name: "Alice", age: 25 });
    await file.add({ name: "Bob", age: 30 });
    await file.add({ name: "Charlie", age: 35 });

    await file.deleteMatch((line) => line.age > 30);

    const count = await file.count();
    expect(count).toBe(2);

    const lines = await file.findMatch((line) => line.age > 30);
    expect(lines).toEqual([]);
  });

  test("first() should return the first line in file", async () => {
    await file.add({ name: "Alice" });
    await file.add({ name: "Bob" });

    const firstLine = await file.first();
    expect(firstLine).toEqual({ name: "Alice" });
  });

  test("last() should return the last line in file", async () => {
    await file.add({ name: "Alice" });
    await file.add({ name: "Bob" });

    const lastLine = await file.last();
    expect(lastLine).toEqual({ name: "Bob" });
  });
});
