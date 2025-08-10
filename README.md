# jsonl-db 📚

**Simple, lightweight database alternative using JSON files**

Stop over-engineering your projects! jsonl-db gives you a database-like experience using simple JSON files. Perfect for prototypes, small projects, or when you just need to get things done quickly without the complexity of traditional databases.

## Why jsonl-db? 🤔

- **🚀 Get started in seconds** - No setup, no configuration, no complex schemas
- **📁 Uses familiar JSON files** - Your data stays in human-readable format
- **⚡ Zero dependencies** - Lightweight and fast
- **🔄 Full CRUD operations** - Add, read, update, delete with simple methods
- **🔍 Powerful querying** - Search and filter your data easily
- **💡 Perfect for** - Prototypes, small apps, data processing, testing, learning

## What is JSONL? 📖

**JSONL (JSON Lines)** is a simple format where each line contains a valid JSON object. Think of it as a database table where each row is a JSON object on its own line.

**Example:**
```jsonl
{"id": 1, "name": "Alice", "age": 25}
{"id": 2, "name": "Bob", "age": 30}
{"id": 3, "name": "Charlie", "age": 28}
```

**Benefits:**
- ✅ Easy to read and debug
- ✅ Simple to append new records
- ✅ No complex parsing needed
- ✅ Works with standard text tools
- ✅ Human-editable

## Quick Start 🚀

### Installation
```bash
npm install jsonl-db
```

### Basic Usage
```javascript
import jsonlFile from "jsonl-db";

// Create or connect to a JSONL file
const users = jsonlFile("./users.jsonl");

// Add a user
users.add({ name: "John", age: 27, email: "john@example.com" });

// Find a user
const john = await users.findWhere("name", "John");

// Update a user
users.updateWhere("name", "John", (user) => {
  user.age = 28;
  return user;
});

// Delete a user
users.deleteWhere("name", "John");
```

## Core Features ✨

### Data Operations
- **➕ Add** - Single records or batches
- **📖 Read** - Line by line or in batches
- **🔄 Update** - By condition or custom logic
- **❌ Delete** - Specific records or entire file

### Querying
- **🔍 Find** - First match or all matches
- **📊 Count** - Total records or filtered counts
- **⚡ Fast Access** - First and last records
- **🎯 Flexible** - Custom conditions and filters

### File Management
- **📁 Auto-create** - Files created automatically
- **🗑️ Clean deletion** - Remove files when needed
- **💾 Persistent** - Data survives restarts

## Real-World Examples 🌟

### User Management
```javascript
const users = jsonlFile("./users.jsonl");

// Add multiple users
users.addMany([
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" },
  { id: 3, name: "Charlie", role: "user" }
]);

// Find all admins
const admins = await users.findMatch(user => user.role === "admin");

// Count active users
const activeCount = await users.countMatch(user => user.isActive);
```

### Logging System
```javascript
const logs = jsonlFile("./app.log");

// Add log entry
logs.add({
  timestamp: new Date().toISOString(),
  level: "info",
  message: "User logged in",
  userId: 123
});

// Get recent logs
const recentLogs = await logs.findMatch(log => 
  new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
);
```

### Configuration Store
```javascript
const config = jsonlFile("./config.jsonl");

// Store settings
config.add({ key: "theme", value: "dark" });
config.add({ key: "language", value: "en" });

// Get setting
const theme = await config.findWhere("key", "theme");
```

## When to Use jsonl-db 🎯

**Perfect for:**
- 🚀 **Prototypes** - Get your idea working fast
- 📱 **Small apps** - Personal projects, simple tools
- 🧪 **Testing** - Mock data, test scenarios
- 📊 **Data processing** - ETL jobs, data analysis
- 🎓 **Learning** - Understand database concepts
- 🔧 **Configuration** - App settings, user preferences

**Consider alternatives when:**
- 📈 **Large datasets** - Millions of records
- 👥 **Multiple users** - Concurrent access needed
- 🔒 **Complex security** - Advanced permissions required
- 🚀 **High performance** - Sub-millisecond queries needed

## Requirements ⚙️

- Node.js v18 or higher

## Bundle Formats 📦

Multiple formats available for different environments:
- **ESM** (`.js`) - Modern ES modules
- **CommonJS** (`.cjs`) - Traditional Node.js
- **TypeScript** (`.d.ts`) - Full type support

## API Reference 📚

### Core Methods

#### Adding Data
```javascript
// Single record
users.add({ name: "John", age: 27 });

// Multiple records
users.addMany([
  { name: "John", age: 27 },
  { name: "Jane", age: 31 }
]);
```

#### Reading Data
```javascript
// Read all records
users.read(line => console.log(line));

// Read in batches
users.readByBatch(batch => console.log(batch), 100);

// Get first/last record
const first = await users.first();
const last = await users.last();

// Find specific record
const user = await users.findWhere("name", "John");

// Find with custom condition
const adults = await users.findMatch(user => user.age >= 18);
```

#### Updating Data
```javascript
// Update by condition
users.updateWhere("name", "John", user => {
  user.age = 28;
  return user;
});

// Update with custom logic
users.updateMatch(
  user => user.age > 30,
  user => {
    user.isSenior = true;
    return user;
  }
);
```

#### Deleting Data
```javascript
// Delete by condition
users.deleteWhere("name", "John");

// Delete with custom logic
users.deleteMatch(user => user.age > 100);

// Delete entire file
users.deleteFile();
```

#### Counting Records
```javascript
// Total count
const total = await users.count();

// Count with condition
const adults = await users.countMatch(user => user.age >= 18);
```

## Contributing 🤝

We love contributions! Here's how to help:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b my-feature`
3. **Make** your changes and add tests
4. **Test** everything: `npm test`
5. **Commit** with clear messages
6. **Push** and submit a pull request

## License 📝

MIT License - feel free to use in any project!

---

**Ready to simplify your data storage?** Start with jsonl-db and focus on building features, not database complexity! 🚀
