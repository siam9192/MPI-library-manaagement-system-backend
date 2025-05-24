import { startSession } from 'mongoose';
import { ISystemSetting, IUpdateSystemSettingPayload } from './system-setting.interface';

import AuditLog from '../AuditLog/audit-log.model';
import { EAuditLogCategory, ESystemSettingAction } from '../AuditLog/audit-log.interface';
import { IAuthUser } from '../../types';
import { DEFAULT_SYSTEM_SETTING } from '../../utils/constant';
import SystemSetting from './system-setting.model';

class SystemSettingService {
  async initSettings() {
    const setting = await SystemSetting.findOne({ isActive: true });
    // Create new setting if active setting not exist
    if (!setting) {
      return await SystemSetting.create(DEFAULT_SYSTEM_SETTING);
    }
  }
  async getCurrentSettings() {
    // Fetch current settings  setting if active setting not exist then create new and return it
    const settings = (await SystemSetting.findOne({ isActive: true })) || this.initSettings();
    return settings as ISystemSetting;
  }

  async updateSystemSetting(authUser: IAuthUser, payload: IUpdateSystemSettingPayload) {
    const session = await startSession();
    session.startTransaction();

    try {
      const settingUpdateStatus = await SystemSetting.updateOne({ isActive: true }, payload, {
        session,
      });
      if (!settingUpdateStatus.modifiedCount) {
        throw new Error('System setting update failed');
      }

      const systemSetting = await SystemSetting.findOne({ isActive: true });

      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.SYSTEM_SETTING,
            action: ESystemSettingAction.UPDATE,
            description: `Updated system setting `,
            targetId: systemSetting!._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
      await session.commitTransaction();
      return systemSetting;
    } catch (error) {
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }
}

export default new SystemSettingService();
