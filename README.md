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
import { jsonlDir } from "jsonl-db";

// Create a database directory
const db = jsonlDir("./data");

// Create a users collection
const users = db.file("users");

// Add a user
await users.add({ name: "John", age: 27, email: "john@example.com" });

// Find a user
const john = await users.findOne(user => user.name === "John");

// Update a user
const updatedUsers = await users.update(
  user => user.name === "John",
  user => ({ ...user, age: 28 })
);

// Delete a user
const remainingUsers = await users.delete(user => user.name === "John");
```

## Core Features ✨

### Data Operations
- **➕ Add** - Single records or batches
- **📖 Read** - Find first match or all matches
- **🔄 Update** - By condition with custom logic
- **❌ Delete** - Specific records with conditions

### Querying
- **🔍 Find** - First match or all matches
- **📊 Count** - Total records in collection
- **⚡ Fast Access** - Efficient batch processing
- **🎯 Flexible** - Custom conditions and filters

### File Management
- **📁 Auto-create** - Files created automatically
- **🗂️ Organized** - Directory-based structure
- **💾 Persistent** - Data survives restarts

## Real-World Examples 🌟

### User Management
```javascript
const db = jsonlDir("./data");
const users = db.file("users");

// Add multiple users
await users.add([
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" },
  { id: 3, name: "Charlie", role: "user" }
]);

// Find all admins
const admins = await users.find(user => user.role === "admin");

// Count total users
const userCount = await users.count();
```

### Logging System
```javascript
const db = jsonlDir("./logs");
const appLogs = db.file("app");

// Add log entry
await appLogs.add({
  timestamp: new Date().toISOString(),
  level: "info",
  message: "User logged in",
  userId: 123
});

// Get recent logs
const recentLogs = await appLogs.find(log => 
  new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
);
```

### Configuration Store
```javascript
const db = jsonlDir("./config");
const settings = db.file("app-settings");

// Store settings
await settings.add({ key: "theme", value: "dark" });
await settings.add({ key: "language", value: "en" });

// Get setting
const theme = await settings.findOne(setting => setting.key === "theme");
```

### Multi-Entity Application
```javascript
const db = jsonlDir("./app-data");

// Different collections for different entities
const users = db.file("users");
const products = db.file("products");
const orders = db.file("orders");

// Work with users
await users.add({ name: "John", email: "john@example.com" });

// Work with products
await products.add({ name: "Laptop", price: 999.99 });

// Work with orders
await orders.add({ userId: 1, productId: 1, quantity: 2 });
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

- Node.js v22 or higher

Multiple formats available for different environments:
- **ESM** (`.js`) - Modern ES modules
- **CommonJS** (`.cjs`) - Traditional Node.js
- **TypeScript** (`.d.ts`) - Full type support

## API Reference 📚

### Core API

#### Creating a Database
```javascript
import { jsonlDir } from "jsonl-db";

// Create a database in a directory
const db = jsonlDir("./data");

// Create collections (files) for different entities
const users = db.file("users");
const products = db.file("products");
```

#### Adding Data
```javascript
// Single record
await users.add({ name: "John", age: 27 });

// Multiple records
await users.add([
  { name: "John", age: 27 },
  { name: "Jane", age: 31 }
]);
```

#### Reading Data
```javascript
// Find first match
const user = await users.findOne(user => user.name === "John");

// Find all matches
const adults = await users.find(user => user.age >= 18);

// Count total records
const total = await users.count();
```

#### Updating Data
```javascript
// Update with custom logic
const updatedUsers = await users.update(
  user => user.age > 30,
  user => ({ ...user, isSenior: true })
);
```

#### Deleting Data
```javascript
// Delete with condition
const remainingUsers = await users.delete(user => user.age > 100);
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
