import mongoose from 'mongoose';
import envConfig from './config/env.config';
import app from './app';
import systemSettingService from './modules/SystemSetting/system-setting.service';
import cacheService from './cache/cache.service';

async function main() {
  try {
    const connection = await mongoose.connect(envConfig.url.database as string);
    await systemSettingService.initSettings();

    app.listen(5000, () => {
      console.log('Server is connected');
    });
  } catch (error) {
    console.log(error);
  }
}

main();
