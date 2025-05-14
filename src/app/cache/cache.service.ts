import fs from 'fs';
import { isValidObjectId } from 'mongoose';
import path from 'path';

class CacheService {
  static pathName = path.join(process.cwd(), 'src', 'app', 'cache', 'files', 'new-book-ids.txt');
  async cacheNewBookId(id: string) {
    fs.appendFileSync(CacheService.pathName, id + '\n');
  }

  async getCachedNewBookIds() {
    const isFileExist = fs.existsSync(CacheService.pathName);

    if (!isFileExist) return [];
    const data = fs.readFileSync(CacheService.pathName, 'utf-8');
    const ids = data.split(/\r?\n/).filter((_) => isValidObjectId(_));
    return ids;
  }
  async deleteFile() {
    fs.unlinkSync(CacheService.pathName);
  }
}

export default new CacheService();
