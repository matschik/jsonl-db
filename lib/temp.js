import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

/**
 * Executes a task with a temporary file and ensures the file is cleaned up afterward.
 * @param {Function} task The task function to execute with the temporary file path.
 * @param {Object} [options] Optional settings.
 * @param {string} [options.extension] Optional file extension.
 * @returns {Promise<*>} The result of the task function.
 */
export async function temporaryFileTask(task, { extension = '' } = {}) {
  const tempFilePath = generateTempFilePath(extension);

  try {
    // Run the task with the temporary file path
    const result = await task(tempFilePath);
    return result;
  } finally {
    // Ensure the temporary file is deleted
    try {
      await fs.unlink(tempFilePath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete temporary file: ${tempFilePath}`, err);
      }
    }
  }
}

/**
 * Generates a unique temporary file path.
 * @param {string} [extension=''] Optional file extension.
 * @returns {string} Temporary file path.
 */
function generateTempFilePath(extension = '') {
  const uniqueName = randomBytes(16).toString('hex');
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return join(tmpdir(), `${uniqueName}${ext}`);
}
