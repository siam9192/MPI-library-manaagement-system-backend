import { startSession } from 'mongoose';
import bycryptHelpers from '../../helpers/bycryptHelpers';
import { EUserRole } from '../User/user.interface';
import { EAdministratorLevel, IAdministrator } from './administrator.interface';
import Administrator from './administrator.model';
import User from '../User/user.model';
import { EGender } from '../../types/model.type';
import { throwInternalError } from '../../helpers';

class AdministratorService {
  async createSuperAdmin() {
    const administrator = await Administrator.findOne({
      level: EAdministratorLevel.SUPER_ADMIN,
    });
    if (administrator) {
      return;
    }

    const password = await bycryptHelpers.hash('123456');
    const userData = {
      email: 'ahsiam999@gmail.com',
      password,
      role: EUserRole.SUPER_ADMIN,
    };
    const session = await startSession();
    session.startTransaction();
    try {
      const [createdUser] = await User.create([userData], { session });
      const profileData = {
        user: createdUser._id,
        fullName: 'Arafat Hasan siam',
        gender: EGender.MALE,
        profilePhotoUrl:
          'https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
        level: EAdministratorLevel.SUPER_ADMIN,
        contactInfo: {
          emailAddress: 'ahsiam999@gmail.com',
          phoneNumber: '01623885483',
        },
      };

      const created = await Administrator.create([profileData], { session });
      await session.commitTransaction();
      return created;
    } catch (error) {
      await session.abortTransaction();
      throwInternalError();
    } finally {
      await session.endSession();
    }
  }
}

export default new AdministratorService();
