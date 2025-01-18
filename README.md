# jsonl-db 📚

jsonl-db is an open source library for working with JSON files in the JSON Lines format (JSONL), a convenient and compact representation of structured data 📊.

## Features

- **Adding Data ➕**  
  Easily append single or multiple JSON objects to a JSONL file.

- **Updating Data 🔄**  
  Modify specific data elements in the file based on conditions or attributes.

- **Deleting Data ❌**  
  Remove specific records or the entire file with simple methods.

- **Querying Data 🔍**  
  Search and retrieve data based on attribute values or custom conditions.

- **Batch Reading 📖**  
  Process the file in smaller, manageable batches for efficiency.

- **First and Last Records**  
  Quickly access the first or last JSON object in the file.

- **Count Matching**  
  Count the number of records meeting specific criteria.

- **Flexible API**  
  Intuitive and user-friendly methods for interacting with JSONL files.

- **File Management**  
  Supports operations like file deletion and creation if it doesn’t exist.

- **No dependency**

Example: users.jsonl
```jsonl
{"id": 1, "name": "Alice", "email": "alice@example.com", "age": 25, "isActive": true}
{"id": 2, "name": "Bob", "email": "bob@example.com", "age": 30, "isActive": false}
{"id": 3, "name": "Charlie", "email": "charlie@example.com", "age": 28, "isActive": true}
{"id": 4, "name": "Diana", "email": "diana@example.com", "age": 22, "isActive": true}
{"id": 5, "name": "Ethan", "email": "ethan@example.com", "age": 35, "isActive": false}
{"id": 6, "name": "Fiona", "email": "fiona@example.com", "age": 27, "isActive": true}
{"id": 7, "name": "George", "email": "george@example.com", "age": 31, "isActive": false}
{"id": 8, "name": "Hannah", "email": "hannah@example.com", "age": 24, "isActive": true}
{"id": 9, "name": "Ian", "email": "ian@example.com", "age": 29, "isActive": true}
{"id": 10, "name": "Julia", "email": "julia@example.com", "age": 26, "isActive": false}
```
## Requirements ⚙️

- Node.js v18 or higher

## Installation 💻

Install jsonl-db with your favorite Node package manager like npm / pnpm / yarn.

```
npm install jsonl-db
```

## Usage 🛠️

To use jsonl-db in your project, import it.
Use the `jsonlFile` function instance. It takes one argument, the path to the file to create or operate on.

```javascript
import jsonlFile from "jsonl-db";

const myJsonlFile = jsonlFile("./data.jsonl");
```

### Add data ➕

```javascript
myJsonlFile.add({ name: "John", age: 27 });
```

The `add` method adds a single JSON object to the end of the file.
It creates the file if it does not exists.

```javascript
myJsonlFile.addMany([
  { name: "John", age: 27 },
  { name: "Jane", age: 31 },
]);
```

The `addMany` method adds an array of JSON objects to the end of the file.
It creates the file if it does not exist.

### Read data 📖

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

### Update data 🔄

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

### Delete data ❌

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

Here's an example of what a contributing section might look like in a jsonl-db README:

## Contributing 🤝

Contributions are welcome and encouraged! To contribute to jsonl-db, please follow these steps:

1. Fork the repository.
2. Create a new feature branch: `git checkout -b my-feature-branch`
3. Make your changes and write tests for them 🧪.
4. Ensure that all tests pass: `npm test` ✅
5. Commit your changes with a descriptive commit message 📝.
6. Push your feature branch to your fork: `git push origin my-feature-branch` 🚀
7. Submit a pull request 💌

Please ensure that any contributions you make adhere to the project's coding standards and are properly documented. If you're unsure about anything, don't hesitate to ask for clarification or guidance 🙋‍♂️.

## License 📝

jsonl-db is licensed under the [MIT License](https://opensource.org/licenses/MIT).
