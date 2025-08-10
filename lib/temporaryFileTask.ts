import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

export interface TemporaryFileOptions {
  extension?: string;
}

export type TemporaryFileTask<T = any> = (tempFilePath: string) => Promise<T> | T;

/**
 * Executes a task with a temporary file and ensures the file is cleaned up afterward.
 * @param task The task function to execute with the temporary file path.
 * @param options Optional settings.
 * @returns The result of the task function.
 */
export async function temporaryFileTask<T>(
  task: TemporaryFileTask<T>, 
  { extension = '' }: TemporaryFileOptions = {}
): Promise<T> {
  const tempFilePath = generateTempFilePath(extension);

  try {
    // Run the task with the temporary file path
    const result = await task(tempFilePath);
    return result;
  } finally {
    // Ensure the temporary file is deleted
    try {
      await fs.unlink(tempFilePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete temporary file: ${tempFilePath}`, err);
      }
    }
  }
}

/**
 * Generates a unique temporary file path.
 * @param extension Optional file extension.
 * @returns Temporary file path.
 */
function generateTempFilePath(extension: string = ''): string {
  const uniqueName = randomBytes(16).toString('hex');
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return join(tmpdir(), `${uniqueName}${ext}`);
}
