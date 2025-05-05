import AppError from "../../Errors/AppError";
import bycryptHelpers from "../../helpers/bycryptHelpers";
import httpStatus from "../../shared/http-status";
import User from "../User/user.model";
import { ICreateStudentRegistrationRequestPayload } from "./auth.interface";

class AuthServices {
 async createStudentRegistrationRequestIntoDB  (
  payload: ICreateStudentRegistrationRequestPayload
)  {
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
  requestExpireAt.setDate(requestExpireAt.getDate() + 7); // 7-day expiry for registration request

  const verificationExpireAt = new Date();
  verificationExpireAt.setMinutes(verificationExpireAt.getMinutes() + 10); // 10-minute expiry for email verification

  // Step 5: Start MongoDB transaction session
  const session = await startSessios();
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
    const hashedOtp = await bcryptHash(otp);

    // Step 8: Create email verification entry
    const [createdEmailVerification] = await EmailVerification.create(
      [
        {
          email: payload.email,
          otp: hashedOtp,
          request: createdRequest._id,
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
      email: payload.email,
    };

    const token = await jwtHelpers.generateToken(
      tokenPayload,
      envConfig.jwt.registrationVerificationTokenSecret as string,
      envConfig.jwt.refreshTokenExpireTime as string
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
};

}