import mongoose from 'mongoose';
import envConfig from './config/env.config';
import app from './app';
import systemSettingService from './modules/SystemSetting/system-setting.service';
import cacheService from './cache/cache.service';
import schedulers from './schedulers';
import reservationService from './modules/Reservation/reservation.service';
import axios from 'axios';

async function main() {
  try {
    // const connection = await mongoose.connect(envConfig.url.database as string);
    // await systemSettingService.initSettings();
    schedulers();

    const data = await axios.get(
      'https://btebresulthub-server.vercel.app/results/individual/778124?exam=diploma-in-engineering&regulation=2022'
    );
    console.log(data.data);
    app.listen(5000, () => {
      console.log('Server is connected');
    });
  } catch (error) {
    console.log(error);
  }
}

main();
