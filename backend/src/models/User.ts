import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserRole } from '../utils/roles';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum DoctorVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface IDoctorVerification {
  verificationStatus: DoctorVerificationStatus | string;
  verificationTimestamp?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  status?: AccountStatus | string;
  doctorVerification?: IDoctorVerification;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  toSafeUser(): SafeUser;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  status?: string;
  doctorVerification?: {
    verificationStatus: string;
    verificationTimestamp?: Date;
    verifiedBy?: string;
    rejectionReason?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Prevents accidental exposure in default queries
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PATIENT,
      required: [true, 'User role is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
      index: true,
    },
    doctorVerification: {
      verificationStatus: {
        type: String,
        enum: Object.values(DoctorVerificationStatus),
        default: DoctorVerificationStatus.PENDING,
      },
      verificationTimestamp: {
        type: Date,
      },
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Method to format a safe user object without sensitive fields
UserSchema.methods.toSafeUser = function (): SafeUser {
  const safe: SafeUser = {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive !== undefined ? this.isActive : this.status !== AccountStatus.SUSPENDED,
    status: this.status || (this.isActive === false ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (this.role === UserRole.DOCTOR && this.doctorVerification) {
    safe.doctorVerification = {
      verificationStatus: this.doctorVerification.verificationStatus || DoctorVerificationStatus.PENDING,
      verificationTimestamp: this.doctorVerification.verificationTimestamp,
      verifiedBy: this.doctorVerification.verifiedBy ? this.doctorVerification.verifiedBy.toString() : undefined,
      rejectionReason: this.doctorVerification.rejectionReason,
    };
  }

  return safe;
};

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
