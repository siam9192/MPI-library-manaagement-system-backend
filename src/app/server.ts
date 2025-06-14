import mongoose from 'mongoose';
import envConfig from './config/env.config';
import app from './app';
import systemSettingService from './modules/SystemSetting/system-setting.service';
import cacheService from './cache/cache.service';
import schedulers from './schedulers';
import reservationService from './modules/Reservation/reservation.service';
import axios from 'axios';
import nodeMailerService from './modules/NodeMailer/node-mailer.service';

async function main() {
  try {
    const connection = await mongoose.connect(envConfig.url.database as string);
    await systemSettingService.initSettings();
    // schedulers();

    app.listen(5000, () => {
      console.log('Server is connected');
    });
  } catch (error) {
    console.log(error);
  }
}

main();
