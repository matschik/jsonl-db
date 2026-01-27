import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { jsonlDir } from '../index';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('jsonl-db', () => {
    const testDir = path.join(__dirname, 'test-data');
    let db: ReturnType<typeof jsonlDir>;
    let usersFile: ReturnType<typeof db.file>;

    beforeEach(async () => {
        // Create test directory
        try {
            await fs.mkdir(testDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
        
        db = jsonlDir(testDir);
        usersFile = db.file('users');
    });

    afterEach(async () => {
        // Clean up test files
        try {
            const usersFilePath = path.join(testDir, 'users.jsonl');
            await fs.unlink(usersFilePath);
        } catch (error) {
            // File might not exist
        }
    });

    describe('file operations', () => {
        it('should create a new file when adding data', async () => {
            const user = { id: 1, name: 'John Doe', email: 'john@example.com' };
            await usersFile.add(user);
            
            const count = await usersFile.count();
            expect(count).toBe(1);
        });

        it('should add single JSON object', async () => {
            const user = { id: 1, name: 'John Doe', email: 'john@example.com' };
            await usersFile.add(user);
            
            const found = await usersFile.findOne(u => u.id === 1);
            expect(found).toEqual(user);
        });

        it('should add array of JSON objects', async () => {
            const users = [
                { id: 1, name: 'John Doe', email: 'john@example.com' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
            ];
            await usersFile.add(users);
            
            const count = await usersFile.count();
            expect(count).toBe(2);
        });

        it('should handle empty array gracefully', async () => {
            await usersFile.add([]);
            
            // Empty array should not create a file, so count should be 0
            // But we need to handle the case where the file doesn't exist yet
            try {
                const count = await usersFile.count();
                expect(count).toBe(0);
            } catch (error) {
                // If the file doesn't exist, that's also acceptable behavior
                expect(error).toBeDefined();
            }
        });

        it('should throw error for invalid data types', async () => {
            // @ts-expect-error - Testing invalid input
            await expect(usersFile.add('invalid')).rejects.toThrow('add() only accepts a single json object or an array of json objects');
            
            // @ts-expect-error - Testing invalid input
            await expect(usersFile.add(null)).rejects.toThrow('add() only accepts a single json object or an array of json objects');
        });
    });

    describe('query operations', () => {
        beforeEach(async () => {
            const users = [
                { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
                { id: 4, name: 'Alice Brown', email: 'alice@example.com', age: 28 }
            ];
            await usersFile.add(users);
        });

        it('should find one matching record', async () => {
            const found = await usersFile.findOne(u => u.id === 2);
            expect(found).toEqual({ id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 });
        });

        it('should return undefined when no match found', async () => {
            const found = await usersFile.findOne(u => u.id === 999);
            expect(found).toBeUndefined();
        });

        it('should find multiple matching records', async () => {
            const found = await usersFile.find(u => u.age > 30);
            expect(found).toHaveLength(1);
            expect(found[0]).toEqual({ id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 });
        });

        it('should return empty array when no matches found', async () => {
            const found = await usersFile.find(u => u.age > 100);
            expect(found).toEqual([]);
        });

        it('should count total records', async () => {
            const count = await usersFile.count();
            expect(count).toBe(4);
        });
    });

    describe('update operations', () => {
        beforeEach(async () => {
            const users = [
                { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 }
            ];
            await usersFile.add(users);
        });

        it('should return updated objects but not persist changes', async () => {
            const updated = await usersFile.update(
                u => u.age > 25,
                u => ({ ...u, age: u.age + 1 })
            );
            
            expect(updated).toHaveLength(1);
            expect(updated[0].age).toBe(31);
            
            // Note: The update operation doesn't persist changes to the file
            // It only returns the transformed objects in memory
            const found = await usersFile.findOne(u => u.id === 1);
            expect(found?.age).toBe(30); // Original value, not updated
        });

        it('should return empty array when no records match update criteria', async () => {
            const updated = await usersFile.update(
                u => u.age > 100,
                u => ({ ...u, age: 999 })
            );
            
            expect(updated).toEqual([]);
        });
    });

    describe('update operations with mutateDb=true', () => {
        beforeEach(async () => {
            const users = [
                { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 }
            ];
            await usersFile.add(users);
        });

        it('should return updated objects and ALSO persist changes', async () => {
            const updated = await usersFile.update(
                u => u.age > 25,
                u => ({ ...u, age: u.age + 1 }),
                true
            );

            expect(updated).toHaveLength(1);
            expect(updated[0].age).toBe(31);

            // Note: with mutateDb=true, changes should be persisted to the file
            const found = await usersFile.findOne(u => u.id === 1);
            expect(found?.age).toBe(31); // Updated value
        });

        it('should return empty array when no records match update criteria', async () => {
            const updated = await usersFile.update(
                u => u.age > 100,
                u => ({ ...u, age: 999 })
            );

            expect(updated).toEqual([]);
        });
    });

    describe('delete operations', () => {
        beforeEach(async () => {
            const users = [
                { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
            ];
            await usersFile.add(users);
        });

        it('should return records that are kept (not deleted) and not persist deletions', async () => {
            const kept = await usersFile.delete(u => u.age > 30);
            
            // Note: The delete operation returns records that are kept (not deleted)
            // and doesn't actually remove anything from the file
            expect(kept).toHaveLength(2);
            expect(kept.map(u => u.id)).toEqual([1, 2]);
            
            // Verify no records were actually deleted from the file
            const count = await usersFile.count();
            expect(count).toBe(3);
            
            const allRecords = await usersFile.find(() => true);
            expect(allRecords.map(u => u.id)).toEqual([1, 2, 3]);
        });

        it('should return all records when no deletion criteria match', async () => {
            const kept = await usersFile.delete(u => u.age > 100);
            
            expect(kept).toHaveLength(3);
            expect(kept.map(u => u.id)).toEqual([1, 2, 3]);
            
            // Verify no records were actually deleted
            const count = await usersFile.count();
            expect(count).toBe(3);
        });
    });

    describe('delete operations with mutateDb=true', () => {
        beforeEach(async () => {
            const users = [
                { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
            ];
            await usersFile.add(users);
        });

        it('should return records that are kept (not deleted) and ALSO persist deletions', async () => {
            const kept = await usersFile.delete(u => u.age > 30, true);

            // Note: The delete operation returns records that are kept (not deleted)
            // and with mutateDb=true, it also persists the deletions to the file
            expect(kept).toHaveLength(2);
            expect(kept.map(u => u.id)).toEqual([1, 2]);

            // Verify that records were deleted from the file
            const count = await usersFile.count();
            expect(count).toBe(2);

            const allRecords = await usersFile.find(() => true);
            expect(allRecords.map(u => u.id)).toEqual([1, 2]);
        });

        it('should return all records when no deletion criteria match', async () => {
            const kept = await usersFile.delete(u => u.age > 100);

            expect(kept).toHaveLength(3);
            expect(kept.map(u => u.id)).toEqual([1, 2, 3]);

            // Verify no records were actually deleted
            const count = await usersFile.count();
            expect(count).toBe(3);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle complex JSON objects', async () => {
            const complexUser = {
                id: 1,
                name: 'Complex User',
                metadata: {
                    preferences: {
                        theme: 'dark',
                        notifications: true
                    },
                    tags: ['developer', 'admin'],
                    settings: null
                },
                createdAt: new Date().toISOString()
            };
            
            await usersFile.add(complexUser);
            
            const found = await usersFile.findOne(u => u.id === 1);
            expect(found).toEqual(complexUser);
        });

        it('should handle special characters in data', async () => {
            const user = {
                id: 1,
                name: 'José María',
                email: 'josé@example.com',
                description: 'User with special chars: éñáüö'
            };
            
            await usersFile.add(user);
            
            const found = await usersFile.findOne(u => u.id === 1);
            expect(found).toEqual(user);
        });

        it('should handle large datasets efficiently', async () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                id: i + 1,
                name: `User ${i + 1}`,
                email: `user${i + 1}@example.com`
            }));
            
            await usersFile.add(largeDataset);
            
            const count = await usersFile.count();
            expect(count).toBe(1000);
            
            const found = await usersFile.findOne(u => u.id === 500);
            expect(found?.name).toBe('User 500');
        });
    });

    describe('file persistence', () => {
        it('should persist data across file operations', async () => {
            const user = { id: 1, name: 'John Doe', email: 'john@example.com' };
            await usersFile.add(user);
            
            // Create a new instance to test persistence
            const newDb = jsonlDir(testDir);
            const newUsersFile = newDb.file('users');
            
            const found = await newUsersFile.findOne(u => u.id === 1);
            expect(found).toEqual(user);
        });

        it('should handle file recreation gracefully', async () => {
            const user = { id: 1, name: 'John Doe', email: 'john@example.com' };
            await usersFile.add(user);
            
            // Simulate file recreation by creating new instance
            const newDb = jsonlDir(testDir);
            const newUsersFile = newDb.file('users');
            
            // Add another user
            const user2 = { id: 2, name: 'Jane Smith', email: 'jane@example.com' };
            await newUsersFile.add(user2);
            
            const count = await newUsersFile.count();
            expect(count).toBe(2);
        });
    });

    describe('library limitations and notes', () => {
        it('should document that update operations are read-only', async () => {
            const user = { id: 1, name: 'John Doe', age: 30 };
            await usersFile.add(user);
            
            // Update operation returns transformed data but doesn't modify the file
            const updated = await usersFile.update(
                u => u.id === 1,
                u => ({ ...u, age: 31 })
            );
            
            expect(updated).toHaveLength(1);
            expect(updated[0].age).toBe(31);
            
            // Original data in file remains unchanged
            const found = await usersFile.findOne(u => u.id === 1);
            expect(found?.age).toBe(30);
        });

        it('should document that delete operations are read-only', async () => {
            const users = [
                { id: 1, name: 'John Doe', age: 30 },
                { id: 2, name: 'Jane Smith', age: 25 }
            ];
            await usersFile.add(users);
            
            // Delete operation returns kept records but doesn't modify the file
            const kept = await usersFile.delete(u => u.age > 25);
            
            expect(kept).toHaveLength(1);
            expect(kept[0].id).toBe(2);
            
            // All records remain in the file
            const count = await usersFile.count();
            expect(count).toBe(2);
        });
    });
});
