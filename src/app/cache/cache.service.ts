import fs from 'fs';
import { isValidObjectId } from 'mongoose';
import path from 'path';
import { objectId } from '../helpers';

class CacheService {
  static recentAddedBookIdFilePath = path.join(
    process.cwd(),
    'src',
    'app',
    'cache',
    'files',
    'recent-added-book-ids.txt'
  );
  static deletedBookIdFilePath = path.join(
    process.cwd(),
    'src',
    'app',
    'cache',
    'files',
    'deleted-book-ids.txt'
  );

  private writeToFile(filePath: string, id: string) {
    try {
      fs.appendFileSync(filePath, `${id}\n`);
    } catch (error) {
      console.error(`Failed to write ID to ${filePath}:`, error);
    }
  }

  private readIdsFromFile(filePath: string): string[] {
    try {
      if (!fs.existsSync(filePath)) return [];
      const data = fs.readFileSync(filePath, 'utf-8');
      return data.split(/\r?\n/).filter((id) => isValidObjectId(id));
    } catch (error) {
      console.error(`Failed to read from ${filePath}:`, error);
      return [];
    }
  }

  private deleteFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }

  // Recent Added Book ID Methods
  cacheRecentAddedBookId(id: string) {
    this.writeToFile(CacheService.recentAddedBookIdFilePath, id);
  }

  getCachedRecentAddedBookIds(): any[] {
    return this.readIdsFromFile(CacheService.recentAddedBookIdFilePath).map((id) => objectId(id));
  }

  deleteRecentAddedBookFile() {
    this.deleteFile(CacheService.recentAddedBookIdFilePath);
  }

  // Deleted Book ID Methods
  cacheDeletedBookId(id: string) {
    this.writeToFile(CacheService.deletedBookIdFilePath, id);
  }

  getCachedDeletedBookIds(): any[] {
    return this.readIdsFromFile(CacheService.deletedBookIdFilePath).map((id) => objectId(id));
  }

  deleteDeletedBookFile() {
    this.deleteFile(CacheService.deletedBookIdFilePath);
  }
}

export default new CacheService();
