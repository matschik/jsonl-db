# json-file

json-file is an open source library for working with JSON files in the JSON Lines format (_JSONL_), a convenient and compact representation of structured data.

This library provides a simple API for adding, updating, deleting and querying data in JSONL files. It also offers methods for reading the files in various ways, such as reading by batch or finding specific data elements.

## Requirements

- Node.js v14 or higher

## Installation

Install json-file with your favorite Node package manager like npm / pnpm / yarn.

```
npm install jsonl-file
```

## Usage

To use json-file in your project, import it as follows:

```javascript
import jsonlFile from "jsonl-file";
```

### Creating a JSONL file

The `jsonlFile` function creates a new JSONL file. It takes one argument, the path to the file to create or operate on.

```javascript
const myJsonlFile = jsonlFile("./data.jsonl");
```

### Adding data

```javascript
myJsonlFile.add({ name: "John", age: 27 });
```

The `add` method adds a single JSON object to the end of the file.

```javascript
myJsonlFile.addMany([
  { name: "John", age: 27 },
  { name: "Jane", age: 31 },
]);
```

The `addMany` method adds an array of JSON objects to the end of the file.

### Reading data

```javascript
myJsonlFile.read((line) => console.log(line));
```

The `read` method reads the file line-by-line and executes a callback function for each provided line. In this example, it simply logs each JSON object to the console.

```javascript
myJsonlFile.readByBatch((batch) => console.log(batch), 500);
```

The `readByBatch` method reads the file in batches of a specified size, and executes a callback function for each batch. In this example, batches of two JSON objects are logged to the console.

```javascript
const firstLine = await myJsonlFile.first();
```

The `first` method returns the first JSON object in the file.

```javascript
const lastLine = await myJsonlFile.last();
```

The `last` method returns the last JSON object in the file.

```javascript
const match = await myJsonlFile.findWhere("name", "John");
```

The `findWhere` method searches the file for the first JSON object where the specified attribute equals the specified value. In this example, the JSON object with "name": "John" is returned.

```javascript
const matches = await myJsonlFile.findMatch(async (line) => {
  return line.age > 30;
});
```

The `findMatch` method searches the file for all JSON objects that match a specified condition. In this example, all JSON objects with "age" greater than 30 are returned.

```javascript
const count = await myJsonlFile.count();
```

The `count` method returns the number of JSON objects in the file.

```javascript
const count = await myJsonlFile.countMatch(async (line) => {
  return line.age > 30;
});
```

The `countMatch` method returns the number of JSON objects in the file that match a specified condition.

### Updating data

```javascript
myJsonlFile.updateWhere("name", "John", async (line) => {
  line.age = 28;
  return line;
});
```

The `updateWhere` method searches the file for JSON objects where the specified attribute equals the specified value, and updates those objects using a provided update function.

```javascript
myJsonlFile.updateMatch(
  async (line) => {
    return line.age > 30;
  },
  async (line) => {
    line.isOlderThan30 = true;
    return line;
  }
);
```

The `updateMatch` method searches the file for all JSON objects that match a specified condition, and updates those objects using a provided update function.

### Deleting data

```javascript
myJsonlFile.deleteWhere("name", "John");
```

The `deleteWhere` method searches the file for JSON objects where the specified attribute equals the specified value, and removes those objects from the file.

```javascript
myJsonlFile.deleteMatch(async (line) => {
  return line.age > 30;
});
```

The `deleteMatch` method searches the file for all JSON objects that match a specified condition, and removes those objects from the file.

```javascript
myJsonlFile.deleteFile();
```

The `deleteFile` method removes the entire file.

## License

json-file is licensed under the [MIT License](https://opensource.org/licenses/MIT).
