import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import bycryptHelpers from '../../helpers/bycryptHelpers';
import httpStatus from '../../shared/http-status';
import User from '../User/user.model';
import {
  IChangePasswordPayload,
  ICreateStudentRegistrationRequestPayload,
  IManagementLoginPayload,
  IRegisterManagementAccountPayload,
  IStudentLoginPayload,
  IStudentRegistrationRequestTokenPayload,
} from './auth.interface';
import systemSettingService from '../SystemSetting/system-setting.service';
import StudentRegistrationRequest from '../StudentRegistrationRequest/studentRegistrationRequest.model';
import { generateNumericOTP, objectId } from '../../helpers';
import jwtHelpers from '../../helpers/jwtHelpers';
import envConfig from '../../config/env.config';
import EmailVerificationRequest from '../EmailVerificationRequest/email-verification-request.model';
import { Student } from '../Student/student.model';
import { EUserRole, EUserStatus } from '../User/user.interface';
import { IAuthUser } from '../../types';
import { JwtPayload } from 'jsonwebtoken';
import ManagementAccountRegistrationRequest from '../ManagementAccountRegistrationRequest/management-account-registration-request.model';
import {
  EManagementAccountRegistrationRequestRole,
  EManagementAccountRegistrationRequestStatus,
} from '../ManagementAccountRegistrationRequest/management-account-registration-request.interface';
import authValidations from './auth.validation';
import Administrator from '../Administrator/administrator.model';
import Librarian from '../Librarian/librarian.model';
import { EAdministratorLevel, IAdministrator } from '../Administrator/administrator.interface';
import notificationService from '../Notification/notification.service';
import { ENotificationCategory, ENotificationType } from '../Notification/notification.interface';
import { EEmailVerificationRequestStatus } from '../EmailVerificationRequest/email-verification-request.interface';
import Notification from '../Notification/notification.model';

class AuthService {
  async createStudentRegistrationRequestIntoDB(payload: ICreateStudentRegistrationRequestPayload) {
    const systemSettings = await systemSettingService.getCurrentSettings();

    // Step 1: Check if the roll number already exists
    const existingUserByRoll = await User.findOne({ roll: payload.roll });
    if (existingUserByRoll) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This student is already registered');
    }

    // Step 2: Check if the email is already used
    const existingUserByEmail = await User.findOne({ email: payload.email });
    if (existingUserByEmail) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This email is already used, try another one');
    }

    // Step 3: Hash password
    const hashedPassword = await bycryptHelpers.hash(payload.password);

    // Step 4: Calculate expiry dates

    const requestExpireAt = new Date();
    requestExpireAt.setDate(
      requestExpireAt.getDate() + systemSettings.registrationPolicy.studentRequestExpiryDays
    ); // 7-day expiry for registration request

    const verificationExpireAt = new Date();
    verificationExpireAt.setMinutes(
      verificationExpireAt.getMinutes() + systemSettings.security.emailVerificationExpiryMinutes
    ); // 10-minute expiry for email verification

    // Step 5: Start MongoDB transaction session
    const session = await startSession();
    session.startTransaction();

    try {
      // Step 6: Create the student registration request
      const [createdRequest] = await StudentRegistrationRequest.create(
        [
          {
            fullName: payload.fullName,
            gender: payload.gender,
            roll: payload.roll,
            email: payload.email,
            department: payload.departmentId,
            semester: payload.semester,
            shift: payload.shift,
            session: payload.session,
            password: hashedPassword,
            expireAt: requestExpireAt,
          },
        ],
        { session }
      );

      if (!createdRequest) {
        throw new Error('Failed to create registration request');
      }

      // Step 7: Generate OTP and hash it
      const otp = generateNumericOTP().toString();
      console.log('Generated OTP:', otp); // Only for development — remove in production
      const hashedOtp = await bycryptHelpers.hash(otp);

      // Step 8: Create email verification entry
      const [createdEmailVerification] = await EmailVerificationRequest.create(
        [
          {
            email: payload.email,
            otp: hashedOtp,
            expireAt: verificationExpireAt,
          },
        ],
        { session }
      );

      if (!createdEmailVerification) {
        throw new Error('Failed to create email verification');
      }

      // Step 9: Generate verification token
      const tokenPayload = {
        verificationId: createdEmailVerification._id,
        requestId: createdRequest._id,
        email: payload.email,
      };

      const token = await jwtHelpers.generateToken(
        tokenPayload,
        envConfig.jwt.registrationVerificationTokenSecret as string,
        `${systemSettings.security.emailVerificationExpiryMinutes.toString()}m`
      );

      // Step 10: Commit the transaction
      await session.commitTransaction();
      await session.endSession();
      return { token };
    } catch (error) {
      // Rollback transaction and throw error

      await session.abortTransaction();
      await session.endSession();
      throw new AppError(httpStatus.BAD_REQUEST, 'Something went wrong');
    }
  }

  async resendEmailVerificationOTP(token: string) {
    // Decode the JWT token
    let decodedPayload: IStudentRegistrationRequestTokenPayload;
    try {
      decodedPayload = jwtHelpers.verifyToken(
        token,
        envConfig.jwt.registrationVerificationTokenSecret as string
      ) as IStudentRegistrationRequestTokenPayload;

      if (!decodedPayload) throw new Error();
    } catch (error) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid token');
    }

    const systemSettings = await systemSettingService.getCurrentSettings();

    //  Retrieve the verification document and populate the request
    const verification = await EmailVerificationRequest.findById(decodedPayload.verificationId);
    if (!verification) {
      throw new AppError(httpStatus.NOT_FOUND, 'Verification request not found');
    }
    // Check if already verified
    if (verification.status === EEmailVerificationRequestStatus.VERIFIED) {
      throw new AppError(httpStatus.NOT_FOUND, 'Email is already verified');
    }

    //  Check if OTP has expired
    if (new Date(verification.expireAt).getTime() < Date.now()) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Your OTP request has expired');
    }

    //  Generate new OTP
    const newOtp = generateNumericOTP().toString();
    const hashedOtp = await bycryptHelpers.hash(newOtp);

    // Extend OTP expiration by another 10 minutes
    const newExpireAt = new Date();
    newExpireAt.setMinutes(
      newExpireAt.getMinutes() + systemSettings.security.emailVerificationExpiryMinutes
    );

    // Step:8 Update replace OTP,Expire At in document
    const updateResultStatus = await EmailVerificationRequest.updateOne(
      {
        _id: verification._id,
      },
      { otp: hashedOtp, expireAt: newExpireAt }
    );

    if (!updateResultStatus.modifiedCount) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }

    // Step 9: Reissue  verification token
    const tokenPayload = {
      verificationId: verification._id,
      email: verification.email,
    };

    const newToken = await jwtHelpers.generateToken(
      tokenPayload,
      envConfig.jwt.registrationVerificationTokenSecret as string,
      `${systemSettings.security.emailVerificationExpiryMinutes.toString()}m`
    );

    return {
      token: newToken,
    };
  }

  async verifyStudentRegistrationRequestUsingOTP(payload: { token: string; otp: string }) {
    //  Decode the JWT token
    let decodedPayload: IStudentRegistrationRequestTokenPayload;
    try {
      decodedPayload = jwtHelpers.verifyToken(
        payload.token,
        envConfig.jwt.registrationVerificationTokenSecret as string
      ) as IStudentRegistrationRequestTokenPayload;

      if (!decodedPayload) throw new Error();
    } catch (error) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid token');
    }

    // Retrieve the verification document and populate the request
    const verification = await EmailVerificationRequest.findById(decodedPayload.verificationId);

    if (!verification) {
      throw new AppError(httpStatus.NOT_FOUND, 'Verification Request not found');
    }

    //  Check if already verified
    if (verification.status === EEmailVerificationRequestStatus.VERIFIED) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Email is already verified');
    }

    //  Check if OTP has expired
    if (new Date(verification.expireAt).getTime() < Date.now()) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Your OTP request has expired');
    }

    const registrationRequest = await StudentRegistrationRequest.findById(decodedPayload.requestId);
    if (!registrationRequest)
      throw new AppError(httpStatus.NON_AUTHORITATIVE_INFORMATION, 'Invalid info');
    //  Check if roll number is already registered
    const existingUserByRoll = await User.findOne({ roll: registrationRequest.roll });
    if (existingUserByRoll) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This student is already registered');
    }

    //  Check if email is already used
    const existingUserByEmail = await User.findOne({ email: verification.email });
    if (existingUserByEmail) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This email is already used, try another one');
    }

    // Validate OTP
    const isOtpValid = await bycryptHelpers.compare(payload.otp, verification.otp);
    if (!isOtpValid) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Wrong OTP!');
    }

    //  Start database transaction
    const session = await startSession();
    session.startTransaction();

    try {
      // Update verification status
      const updateVerificationStatus = await EmailVerificationRequest.updateOne(
        { _id: verification._id },
        { status: EEmailVerificationRequestStatus.VERIFIED }
      );

      if (!updateVerificationStatus.modifiedCount) {
        throw new Error('Failed to update verification status');
      }

      // Update registration request status
      const updateRequestStatus = await StudentRegistrationRequest.updateOne(
        { _id: registrationRequest._id },
        { isEmailVerified: true },
        { session }
      );

      if (!updateRequestStatus.modifiedCount) {
        throw new Error('Failed to update request status');
      }
      // Commit transaction
      await session.commitTransaction();
      await session.endSession();
      return null;
    } catch (error) {
      // Rollback transaction on error
      console.log(error);
      await session.abortTransaction();
      await session.endSession();
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Verification process failed');
    }
  }

  async registerManagementAccount(token: string, payload: IRegisterManagementAccountPayload) {
    //  Decode the JWT token
    let decodedPayload: IStudentRegistrationRequestTokenPayload;
    try {
      decodedPayload = jwtHelpers.verifyToken(
        token,
        envConfig.jwt.registrationVerificationTokenSecret as string
      ) as IStudentRegistrationRequestTokenPayload;

      if (!decodedPayload) throw new Error();
    } catch (error) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid request');
    }

    //Fetch request by secret
    const request = await ManagementAccountRegistrationRequest.findOne({
      status: EManagementAccountRegistrationRequestStatus.PENDING,
    }).populate('by');

    // Checking request existence also Validate payload here using zod
    if (!request) {
      throw new AppError(httpStatus.NOT_FOUND, 'Maybe this link is expired,used or not exist');
    }

    const existingUserByEmail = await User.findOne({ email: request.email });
    if (existingUserByEmail) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'The provided email is already in use.');
    }

    if (Object.values(EManagementAccountRegistrationRequestRole).includes(request.role as any)) {
      authValidations.AdministratorAccountRegistrationValidation.parse(payload);
    } else {
      authValidations.LibrarianAccountRegistrationValidation.parse(payload);
    }

    const by = request.by as any as IAdministrator;
    // Step 3: Start database transaction
    const session = await startSession();
    session.startTransaction();

    try {
      // Step 5: Update request status
      const updateRequestStatus = await ManagementAccountRegistrationRequest.updateOne(
        { _id: request._id },
        { status: EManagementAccountRegistrationRequestStatus.SUCCESSFUL, index: 0 },
        { session }
      );

      // Check request update status
      if (!updateRequestStatus.modifiedCount) {
        throw new Error('Failed to update verification status');
      }

      // Create user

      const hashedPassword = await bycryptHelpers.hash(payload.password);

      const [createdUser] = await User.create(
        [
          {
            email: request.email,
            password: hashedPassword,
            role: request.role,
          },
        ],
        { session }
      );

      if (!createdUser) throw new Error('');
      // Create profile base on role
      let createdProfile;
      if (Object.values(EAdministratorLevel).includes(request.role as any)) {
        [createdProfile] = await Administrator.create(
          [
            {
              user: createdUser._id,
              fullName: payload.fullName,
              profilePhotoUrl: payload.profilePhotoUrl,
              gender: payload.gender,
              contactInfo: payload.contactInfo,
              level: request.role,
            },
          ],
          { session }
        );
      } else {
        [createdProfile] = await Librarian.create(
          [
            {
              user: createdUser._id,
              fullName: payload.fullName,
              profilePhotoUrl: payload.profilePhotoUrl,
              gender: payload.gender,
              about: payload.about,
              contactInfo: payload.contactInfo,
            },
          ],
          { session }
        );
      }

      if (!createdProfile) throw new Error();
      await notificationService.notify(
        createdUser._id.toString(),
        {
          message: "Hey welcome,Thanks for joining MPI library. We're glad to have you here!",
          type: ENotificationType.SYSTEM,
        },
        session
      );

      Notification.create({
        user: by.user,
        category: ENotificationCategory.MANAGEMENT_ACCOUNT_REGISTRATION,
        type: ENotificationType.INFO,
        title: 'Management registration success',
        message: `The request to register a management account with the "${request.role}" role for "${request.email}" has been successfully registered.`,
      });

      // Commit transaction
      await session.commitTransaction();
      await session.endSession();
      return null;
    } catch (error) {
      console.log(error);
      // Rollback transaction on error
      await session.abortTransaction();
      await session.endSession();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Sorry registration failed.Something went wrong'
      );
    }
  }

  async studentLogin(loginPayload: IStudentLoginPayload) {
    // Find the user by roll number and ensure the role is STUDENT
    const user = await User.findOne({
      roll: loginPayload.roll,
      role: EUserRole.STUDENT,
    }).select('_id password role');

    // Throw an error if the user is not found
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'Account not found');
    }

    // Check if the account is blocked
    if (user.status === EUserStatus.BLOCKED) {
      throw new AppError(httpStatus.FORBIDDEN, 'Access denied: account is blocked');
    }

    // Compare the provided password with the stored hashed password
    const isMatchPassword = await bycryptHelpers.compare(loginPayload.password, user.password);
    if (!isMatchPassword) {
      throw new AppError(httpStatus.NOT_FOUND, 'Wrong password!');
    }
    const student = await Student.findOne({ user: user._id }).select('_id');
    if (!student) throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, '');

    // Prepare the token payload
    const tokenPayload = {
      userId: user._id,
      profileId: student._id,
      role: user.role,
    };

    // Generate access token
    const accessToken = await jwtHelpers.generateToken(
      tokenPayload,
      envConfig.jwt.accessTokenSecret as string,
      envConfig.jwt.accessTokenExpireTime as string
    );

    // Generate refresh token
    const refreshToken = await jwtHelpers.generateToken(
      tokenPayload,
      envConfig.jwt.refreshTokenSecret as string,
      envConfig.jwt.refreshTokenExpireTime as string
    );

    await user.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    // Return the tokens
    return {
      accessToken,
      refreshToken,
    };
  }

  async managementLogin(loginData: IManagementLoginPayload) {
    // Find the user by email and ensure the role is not STUDENT
    const user = await User.findOne({
      email: loginData.email,
      role: {
        $in: [...Object.values(EAdministratorLevel), EUserRole.LIBRARIAN],
      },
    }).select('_id email password role');

    // Throw an error if the user is not found
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'Account not found');
    }

    // Check if the account is blocked
    if (user.status === EUserStatus.BLOCKED) {
      throw new AppError(httpStatus.FORBIDDEN, 'Access denied: account is blocked');
    }

    // Compare the provided password with the stored hashed password
    const isMatchPassword = await bycryptHelpers.compare(loginData.password, user.password);

    if (!isMatchPassword) {
      throw new AppError(httpStatus.NOT_FOUND, 'Wrong password!');
    }

    let profileId;

    if (user.role === EUserRole.LIBRARIAN) {
      profileId = (await Librarian.findOne({ _id: user._id }).lean())!._id;
    } else {
      profileId = (await Administrator.findOne({ _id: user._id }).lean())!._id;
    }

    // Prepare the token payload
    const tokenPayload = {
      userId: user._id,
      profileId,
      role: user.role,
    };

    // Generate access token
    const accessToken = await jwtHelpers.generateToken(
      tokenPayload,
      envConfig.jwt.accessTokenSecret as string,
      envConfig.jwt.accessTokenExpireTime as string
    );

    // Generate refresh token
    const refreshToken = await jwtHelpers.generateToken(
      tokenPayload,
      envConfig.jwt.refreshTokenSecret as string,
      envConfig.jwt.refreshTokenExpireTime as string
    );

    await user.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    // Return the tokens
    return {
      accessToken,
      refreshToken,
    };
  }

  async changePassword(authUser: IAuthUser, payload: IChangePasswordPayload) {
    // Step 1: Find the user by ID and include the password field
    const user = await User.findById(authUser.userId, { password: true });

    // Step 2: Check if user exists
    if (!user) {
      throw new AppError(httpStatus.BAD_REQUEST, 'User not found.');
    }

    // Step 3: Compare old password
    const isPasswordMatch = await bycryptHelpers.compare(payload.oldPassword, user.password);
    if (!isPasswordMatch) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Incorrect current password.');
    }

    // Step 4: Hash the new password
    const newHashedPassword = await bycryptHelpers.hash(payload.newPassword);

    // Step 5: Update the password
    const updateResult = await User.updateOne(
      { _id: objectId(authUser.userId) },
      { password: newHashedPassword }
    );

    if (!updateResult.modifiedCount) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update password.');
    }

    const notifyData = {
      message: 'Your password has been changed successfully',
      type: ENotificationType.SUCCESS,
    };
    notificationService.notify(authUser.userId, notifyData);

    // Step 6: Return success (can be null or a success message)
    return null;
  }

  async getNewAccessToken(refreshToken: string) {
    try {
      // Step 1: Ensure refresh token exists
      if (!refreshToken) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is required.');
      }

      // Step 2: Verify and decode the token
      const decoded = jwtHelpers.verifyToken(
        refreshToken,
        envConfig.jwt.refreshTokenSecret as string
      ) as JwtPayload & IAuthUser;

      if (!decoded || !decoded.userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid refresh token.');
      }
      // Step 3: Create a new access token
      const newAccessToken = await jwtHelpers.generateToken(
        {
          userId: decoded.userId,
          profileId: decoded.profileId,
          role: decoded.role,
        },
        envConfig.jwt.accessTokenSecret as string,
        envConfig.jwt.accessTokenExpireTime as string
      );

      // Step 4: Return both tokens
      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired refresh token.');
    }
  }
}

export default new AuthService();
