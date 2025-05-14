import { ISystemSetting, IUpdateSystemSettingPayload } from './system-setting.interface';
import { SystemSetting } from './system-setting.model';

class SystemSettingService {
  async initSettings() {
    const setting = await SystemSetting.findOne({ isActive: true });
    // Create new setting if active setting not exist
    if (!setting) {
      return await SystemSetting.create({
        maxBorrowDays: 14,
        maxBorrowItems: 5,
        lateFeePerDay: 5,
        borrowRequestExpiryDays: 3,
        reservationExpiryDays: 2,
        lostReputationOnCancelReservation: 10,
        studentRegistrationRequestExpiryDays: 7,
        managementRegistrationRequestExpiryDays: 10,
        emailVerificationExpiryMinutes: 30,
        isActive: true,
      });
    }
  }
  async getCurrentSettings() {
    // Fetch current settings  setting if active setting not exist then create new and return it
    const settings = (await SystemSetting.findOne({ isActive: true })) || this.initSettings();
    return settings as ISystemSetting;
  }

  async updateSystemSetting(payload: IUpdateSystemSettingPayload) {
    return await SystemSetting.findOneAndUpdate({ isActive: true }, payload, { new: true });
  }
}

export default new SystemSettingService();
