import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { config } from '../../config/index.js'
import { apiError } from '../../utils/index.js'

export const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: false,  // Not required on creation (admin starts with null password)
      default: null,
      minlength: 8
    },
    isPasswordSet: {
      type: Boolean,
      default: false  // false until admin sets their password for the first time
    },
    isTemporaryPassword: {
      type: Boolean,
      default: false  // true if set by admin as temporary
    },
    companyId: {
      type: mongoose.Types.ObjectId,
      ref: 'Company',
      default: null
    },
    roleId:
    {
      type: mongoose.Types.ObjectId,
      ref: 'Roles',
      default: null
    }
    ,
    accountVerificationMethods: {
      isEmailVerified: {
        type: Boolean,
        default: false
      },
      isPhoneVerified: {
        type: Boolean,
        default: false
      }
    },
    accountType: {
      type: String,
      enum: ["user", "owner", "admin", "superadmin"],
      default: "admin",
      lowercase: true
    },
    isAccountEnable: {
      type: Boolean,
      default: true
    },
    resetToken: { type: String, default: "" },
    resetTokenExpiry: { type: Date, default: null },
    accessSharedBy: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      default: []
    }
  },
  { timestamps: true },
)

userSchema.pre('save', async function (next) {
  // Skip hashing if password is not set or not modified
  if (!this.password || !this.isModified('password')) {
    return next();
  }
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});


userSchema.pre('findOneAndUpdate', async function () {
  try {

    if (!this.getUpdate().password) return;
    const salt = await bcrypt.genSalt(config.saltWorkFactor);
    this.getUpdate().password = await bcrypt.hash(
      this.getUpdate().password,
      salt
    );
  } catch (error) {
    throw apiError.internal(error, 'pre findOneAndUpdate hook');
  }
});

userSchema.methods.checkPassword = async function (password) {
  try {
    const same = await bcrypt.compare(password, this.password);
    return same;
  } catch (error) {
    console.log(error, '')
    throw apiError.internal(error, 'checkPassword');
  }
};

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
