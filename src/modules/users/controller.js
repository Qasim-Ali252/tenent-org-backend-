import { nanoid } from 'nanoid'
import mongoose from 'mongoose'
import { UserModel } from './model.js'
import {
  validateSignUpInputs,
  validateSignInInputs,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateResetToken,
  validateCheckoutSession,
  validatePortalSession,
  validateResendEmailVerify,
  validateCreateOrder,
  validateSubscription,
  validateTeamSignUp,
  validateUpdateUserRole,
  validateDeleteUserRole,
  validateCompanyUserStatus,
  validateDeleteCompanyUser,
  validateEmailVerificationResend,
  validateEmailResend,
  validateStripeCustomerUpdate
} from './validation.js'


import {
  createUser,
  getUserByConditions,
  updateUser,
  getUserByCompanyDetail,
  getAllUsersByConditionsByRole,
  countUsersByCondition,
  updateUserByCondition,
  deleteUserById,


} from './services.js'

import { apiError, generateToken, generateRefreshToken, generateUniqueUsername, generateEmailVerificationToken, verifyJwtToken, portalSession, getStripeOrderDetails } from '../../utils/index.js'
import { MESSEGES } from '../../constants/index.js'
import { config } from '../../config/index.js'

import { createCompany, updateCompany, getCompanyByConditions } from './companies/service.js'
import { sendVerificationEmail, createStripeCustomer, checkoutSession, stirpeCustomerUpdate } from '../../utils/index.js'
import { getSubscriptionByConditions, createSubscription } from './subscription/service.js'
import { getRolesByConditions, updateRolesByconditions } from './roles-permissions/service.js'


export const signUp = async (
  req,
  res,
  next,
) => {
  try {

    const username = await generateUniqueUsername(req.body.fullName)
    const validationResult = validateSignUpInputs(req.body)

    if (validationResult?.error)
      return next(apiError.badRequest(validationResult?.msg, 'signUp'))

    const resetToken = nanoid(100);
    const resetTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry time

    const user = await createUser({ ...req.body, username, resetTokenExpiry, resetToken }, next)

    if (!user) throw next(apiError.badRequest(MESSEGES.USER_CREATION_FAILED, 'signup'))

    await sendVerificationEmail(user, resetToken, "accountVerification", next)

    const company = await createCompany({
      name: '',
    }, next)

    await updateUser({ companyId: company._id, userId: user._id }, next)


    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.EMAIL_SENT, data: { email: req.body?.email } })

  } catch (error) {
    console.log(error)
    return next(apiError.internal(error, 'signup'))
  }
}

export const signIn = async (
  req,
  res,
  next,
) => {
  try {
    let { password, username } = req.body

    const validationResult = validateSignInInputs(req.body)

    if (validationResult?.error) {
      return next(apiError.badRequest(validationResult?.msg, 'signin'))
    }

    let existingUser = await getUserByCompanyDetail({ $or: [{ email: username }, { username }] }, '-__v', true)

    if (!existingUser) {
      return next(
        apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'signin'),
      )
    }

    if (!existingUser?.accountVerificationMethods?.isEmailVerified)
      return next(
        apiError.badRequest(MESSEGES.EMAIL_NOT_VERIFIED, 'signin'),
      )

    if (!existingUser?.isAccountEnable)
      return next(
        apiError.badRequest(MESSEGES.ACCOUNT_NOT_ACTIVE, 'signin'),
      )

    const match = await existingUser?.checkPassword(password)

    if (!match) return next(
      apiError.badRequest(MESSEGES.PASSWORD_INVALID, 'signin'),
    )

    existingUser = existingUser.toObject({ getters: true });


    const company = await getCompanyByConditions({ _id: new mongoose.Types.ObjectId(existingUser?.companyId) })

    if (!company?.stripeCustomerId) {
      const stripeResponse = await createStripeCustomer(existingUser?.fullName, existingUser?.email)
      await updateCompany(company._id, { stripeCustomerId: stripeResponse?.id })
    }

    const token = await generateToken({ username: existingUser?.username, email: existingUser?.email })
    const refreshToken = await generateRefreshToken({ username: existingUser?.username, email: existingUser?.email })

    existingUser.companyDetail = existingUser?.companyId;

    delete existingUser.companyDetail?.id
    delete existingUser?.companyId;
    delete existingUser.password;
    delete existingUser?.rolesId?.id;

    return res
      .status(201)
      .send({ isSucess: true, message: MESSEGES.SIGNIN_SUCCESSFULL, token, refreshToken, data: { ...existingUser } })
  } catch (error) {
    console.log(error)
    return next(apiError.internal(error, 'signup'))
  }
}

export const resendEmailVerify = async (
  req,
  res,
  next,
) => {
  try {

    const validationResult = validateResendEmailVerify(req.body)

    if (validationResult?.error)
      return next(apiError.badRequest(validationResult?.msg, 'signUp'))

    const resetToken = nanoid(100);
    const resetTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry time

    const user = await createUser({ ...req.body, username, resetTokenExpiry, resetToken }, next)

    if (!user) throw next(apiError.badRequest(MESSEGES.USER_CREATION_FAILED, 'signup'))

    await sendVerificationEmail(user, resetToken, "accountVerification", next)

    const company = await createCompany({
      name: '',
    }, next)

    await updateUser({ companyId: company._id, userId: user._id }, next)


    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.EMAIL_SENT, data: { email: req.body?.email } })

  } catch (error) {
    console.log(error)
    return next(apiError.internal(error, 'signup'))
  }
}

export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token;
    const type = req.query.type
    const user = await getUserByConditions({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

    if (!user) {
      return next(
        apiError.badRequest(type === 'team' ? MESSEGES.COMPANY_USER_EMAIL_VERIFICATION_FAILED : MESSEGES.EMAIL_VERIFICATION_FAILED, 'resetTokenVerify'),
      )
    }
    user.accountVerificationMethods.isEmailVerified = true;
    user.isAccountEnable = true

    if (type === 'team') {
      await user.save();
      const token = `${config.frontEndUrl}auth/reset-password/?token=${user.resetToken}&type=team`
      return res.json({ isSuccess: true, message: MESSEGES.VERIFICATION_SUCCESSFULL, token });
    }

    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ isSuccess: true, message: MESSEGES.VERIFICATION_SUCCESSFULL });
  } catch (error) {
    console.log(error)
    return next(apiError.internal(error, 'verifyToken'))
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const validationResult = validateForgotPassword(req.body)
    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'forgotPassword'))

    const { username } = req.body
    let user = await getUserByCompanyDetail({ $or: [{ email: username }, { username }] }, '-__v')

    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'forgotPassword'),
      )
    }

    const resetToken = nanoid(100);
    const resetTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry time

    await updateUser({ userId: user._id, resetToken, resetTokenExpiry })

    await sendVerificationEmail(user, resetToken, "accountForgotPassword", next)

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.EMAIL_SENT, data: { email: req.body?.username } })

  } catch (error) {
    console.log(error)
    return next(apiError.internal(error, 'forgotPassword'))
  }
}

export const verifyResetToken = async (req, res, next) => {
  try {
    const token = req.params.token;

    const user = await UserModel.findOne({ resetToken: token });
    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'resetTokenVerify'),
      )
    }

    if (user.resetTokenExpiry < Date.now()) {
      return next(
        apiError.badRequest(MESSEGES.VARIFICATION_TOKEN_EXPIRE, 'resetTokenVerify'),
      )
    }

    const resetToken = nanoid(100);
    const resetTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry time

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;

    await user.save();
    res.json({ isSuccess: true, message: MESSEGES.TOKEN_VERIFY_SUCCESS });
  } catch (error) {
    console.log(error)
    return next(apiError.internal(error, 'verifyResetToken'))
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const token = req.params?.token || ""
    const validationResult = validateResetPassword({ ...req.body, token })
    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'forgotPassword'))

    const user = await getUserByConditions({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'resetTokenVerify'),
      )
    }

    await updateUser({ userId: user._id, password: req.body.password })

    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.isEmailVerified = true;

    await user.save();

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.PASSWORD_RESET_SUCCESS })

  } catch (error) {
    console.log(error)
    return next(apiError.internal(error, 'forgotPassword'))
  }
}

export const verifyToken = async (req, res, next) => {
  try {
    return res.json({ isSuccess: true, message: MESSEGES.TOKEN_VERIFY_SUCCESS });
  } catch (error) {
    console.log(error)
    return next(apiError.badRequest('token not valid', 'verifyToken'))
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const validationResult = validateChangePassword(req.body)
    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'changePassword'))

    const { newPassword, password } = req.body

    const user = await getUserByConditions({ _id: req.userId });

    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'changePassword'),
      )
    }

    const match = await user?.checkPassword(password)

    if (!match) return next(
      apiError.badRequest(MESSEGES.PASSWORD_INVALID, 'signin'),
    )
    await updateUser({ userId: user._id, password: newPassword })

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.PASSWORD_RESET_SUCCESS })

  } catch (error) {
    console.log(error)
    return next(apiError.internal(error, 'forgotPassword'))
  }
}

export const verifyRefreshToken = async (req, res, next) => {
  try {
    const validationResult = validateResetToken(req.body)
    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'changePassword'))

    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(apiError.badRequest(MESSEGES.AUTHORIZATION_TOKEN_NOT_FOUND, 'verifyRefreshToken'))
    }

    const decodeRefreshToken = await verifyJwtToken(refreshToken)

    if (decodeRefreshToken?.exp < Math.floor(Date.now() / 1000)) {
      return next(apiError.badRequest(MESSEGES.REFRESH_TOKEN_EXPIRED, 'verifyRefreshToken'))
    }

    const user = await getUserByConditions({ email: decodeRefreshToken?.email });

    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'verifyRefreshToken'),
      )
    }

    const token = await generateToken({ username: user?.username, email: user?.email })

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.NEW_TOKEN_GENERATE_SUCCESS, token })

  } catch (error) {
    console.log(error.message)
    return next(apiError.badRequest(error?.message === 'jwt expired' ? MESSEGES.REFRESH_TOKEN_EXPIRED : MESSEGES.TOKEN_NOT_VERIFIED, 'verifyRefreshToken'))
  }
}

export const createCheckoutSession = async (req, res, next) => {
  try {
    const validationResult = validateCheckoutSession(req.body)
    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'createCheckoutSession'))

    const companyData = await getCompanyByConditions({ _id: req.companyId })


    const sessionURL = await checkoutSession(req.body.lookupKey, { customer: companyData.stripeCustomerId, customer_email: req.user.email })

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.STRIPE_PAYMENT_SUCCESS, sessionURL })

  } catch (error) {
    console.log(error, 'createCheckoutSession')
    return next(apiError.internal(error, 'createCheckoutSession'))
  }
}

export const createPortalSession = async (req, res, next) => {
  try {
    const validationResult = validatePortalSession(req.body)
    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'createPortalSession'))

    const portalURL = await portalSession(req?.body?.customerId)

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.STRIPE_PAYMENT_SUCCESS, portalURL })

  } catch (error) {
    return next(apiError.internal(error, 'createPortalSession'))
  }
}

export const subscriptions = async (req, res, next) => {
  try {
    const { previous_attributes, object } = req?.body?.data || {}

    const company = await getCompanyByConditions({ stripeCustomerId: object.customer })

    if (!company) {
      return next(
        apiError.badRequest(MESSEGES.COMPANY_NOT_FOUND, 'subscriptions'),
      )
    }

    if (req?.body?.type === "customer.subscription.created") {
      let requiedFields = {
        billingCycleStartDate: previous_attributes.current_period_start,
        billingCycleEndDate: previous_attributes.current_period_end,
        stripeSubscriptionId: object.id,
        planId: object.plan.id,
      }

      const validationResult = validateSubscription(requiedFields)

      requiedFields.billingCycleStartDate = new Date(previous_attributes.current_period_start * 1000)
      requiedFields.billingCycleEndDate = new Date(previous_attributes.current_period_end * 1000)


      if (validationResult.error)
        return next(apiError.badRequest(validationResult?.msg, 'subscriptions'))

      const subscriptionExists = await getSubscriptionByConditions({ companyId: company._id, stripeSubscriptionId: requiedFields.stripeSubscriptionId })

      if (subscriptionExists) {
        return next(
          apiError.badRequest(MESSEGES.SUBSCRIPTION_ALREADY_EXISTS, 'subscriptions'),
        )
      }

      const subscription = await createSubscription({ ...requiedFields, companyId: company._id, status: true })
      if (!subscription)
        return next(
          apiError.badRequest(MESSEGES.SUBSCRIPTION_CREATED_FAILED, 'subscriptions'),
        )

      company.status = true;
      await company.save();

      return res
        .status(201)
        .send({ isSuccess: true, message: MESSEGES.SUBSCRIPTION_CREATED_SUCCESS, subscription })
    }
    else if (req?.body?.type === "customer.subscription.deleted") {

      const subscription = await getSubscriptionByConditions({ companyId: company._id })

      if (!subscription) {
        return next(
          apiError.badRequest(MESSEGES.SUBSCRIPTION_NOT_EXIST, 'subscriptions'),
        )
      }

      subscription.status = false
      company.status = false;
      await subscription.save()
      await company.save();

      return res
        .status(201)
        .send({ isSuccess: true, message: MESSEGES.SUBSCRIPTION_CREATED_FAILED })
    }


  } catch (error) {
    console.log(error, 'subscriptions')
    return next(apiError.internal(error, 'subscriptions'))
  }
}

export const companySubscription = async (req, res, next) => {
  try {
    const validationResult = validateCreateOrder(req.body)

    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'createOrder'))

    const stripeUserData = await getStripeOrderDetails(req?.body?.sessionId)

    if (!stripeUserData) return next(
      apiError.badRequest(MESSEGES.SUBSCRIPTION_RETRIVED_FAILED, 'createOrder'),
    )

    let subscriptionObj = {
      billingCycleStartDate: stripeUserData.current_period_start,
      billingCycleEndDate: stripeUserData.current_period_end,
      stripeSubscriptionId: stripeUserData.id,
      planId: stripeUserData.plan.id,
    }

    const company = await getCompanyByConditions({ stripeCustomerId: stripeUserData.customer })
    const subscription = await getSubscriptionByConditions({ companyId: company?._id, stripeSubscriptionId: stripeUserData.id })

    if (!subscription && stripeUserData?.status === 'active') {
      await createSubscription({ ...subscriptionObj, companyId: company?._id, status: true })
      company.status = true
      await company.save()
      return res
        .status(201)
        .send({ isSuccess: true, data: company, messsage: MESSEGES.COMPANY_DATA_CREATED })

    } else if (stripeUserData?.status === 'active') {
      company.status = true
      subscription.status = true
      await company.save()
      await subscription.save()

      return res
        .status(201)
        .send({ isSuccess: true, data: company, message: MESSEGES.COMPANY_DATA_UPDATED })
    }


  } catch (error) {
    console.log(error, 'createPortalSession')
    return next(apiError.internal(error, 'createPortalSession'))
  }
}

export const teamSignUp = async (
  req,
  res,
  next,
) => {
  try {
    const username = await generateUniqueUsername(req.body.fullName)
    const validationResult = validateTeamSignUp(req.body)

    if (validationResult?.error)
      return next(apiError.badRequest(validationResult?.msg, 'signUp'))

    const resetToken = nanoid(100);
    const resetTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry time

    const roles = await getRolesByConditions({ _id: req.body.role })

    if (!roles) throw next(apiError.badRequest(MESSEGES.ROLES_NOT_FOUND, 'signup'))

    let user = await getUserByConditions({ email: req.body.email });

    if (!user) {
      user = await createUser({ ...req.body, password: 'staticPassword', isAccountEnable: false, username, resetTokenExpiry, resetToken, companyId: req.companyId, roleId: roles._id, accountType: 'user' }, next)
    } else {
      await updateUser({ userId: new mongoose.Types.ObjectId(user._id), resetTokenExpiry, resetToken })
    }

    if (!user) throw next(apiError.badRequest(MESSEGES.USER_CREATION_FAILED, 'signup'))

    await sendVerificationEmail(user, resetToken, "accountTeamEmailVerification", next)

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.EMAIL_SENT, data: { email: req.body?.email } })

  } catch (error) {
    console.log(error)
    return next(apiError.internal(error, 'signup'))
  }
}

export const getCompanyUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const isAccountEnable = req.query?.isAccountActive || '';

    const roleCondition = isAccountEnable ? {
      companyId: req.companyId,
      _id: { $ne: req.user._id },
      isAccountEnable
    } : {
      companyId: req.companyId,
      _id: { $ne: req.user._id }
    }

    const totalUsersCount = await countUsersByCondition(roleCondition)
    const totalPages = Math.ceil(totalUsersCount / limit);
    const skip = (page - 1) * limit;

    const users = await getAllUsersByConditionsByRole(roleCondition, skip, limit)

    if (!users) throw next(apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'signup'));

    return res.status(200).send({
      isSuccess: true,
      message: MESSEGES.COMPANY_GET_USER_SUCCESS,
      data: users.map(user => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        accountType: user.accountType,
        isAccountEnable: user.isAccountEnable,
        role: user.roleId ? user.roleId.name : null,
        roleId: user?.roleId?._id || null,
        isEmailVerified: user?.accountVerificationMethods?.isEmailVerified
      })),
      totalPages,
      currentPage: page,
      totalUsersCount
    });

  } catch (error) {
    console.log(error);
    return next(apiError.internal(error, 'signup'));
  }
};

export const updateUserRoles = async (req, res, next) => {
  try {
    const validationResult = validateUpdateUserRole(req.body)
    if (validationResult?.error)
      return next(apiError.badRequest(validationResult?.msg, 'updateRoles'))

    const isOwner = await getUserByConditions({ _id: req.userId })
    const isAdministrator = await getRolesByConditions({ _id: new mongoose.Types.ObjectId(isOwner.roleId) })

    if (!(isOwner?.accountType === 'owner' || isAdministrator?.name === 'Administrator')) return next(
      apiError.badRequest(MESSEGES.ONLY_OWNER_AND_ADMINISTRATOR_CAN_UPDATE_ROLE, 'updateRoles'),
    )
    let user;
    if (req.body.role) {
      const role = await getRolesByConditions({ _id: new mongoose.Types.ObjectId(req.body?.role) })

      if (!role) {
        return next(
          apiError.badRequest(MESSEGES.ROLES_NOT_FOUND, 'updateRoles'),
        )
      }

      user = await updateUserByCondition({ email: req.body?.email, roleId: { $ne: new mongoose.Types.ObjectId(req.body?.role) } }, { fullName: req?.body?.fullName, email: req?.body?.email, roleId: req?.body?.role });
    }

    user = await updateUserByCondition({ email: req.body?.email }, { fullName: req?.body?.fullName, email: req?.body?.email });


    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_NOT_FOUND_OR_ROLE_SAME, 'updateRoles'),
      )
    }

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.ROLES_UPDATED_SUCCESS, data: { email: req.body?.email } })

  } catch (error) {
    console.log(error);
    return next(apiError.internal(error, 'signup'));
  }
};

export const deleteUserRoles = async (req, res, next) => {
  try {
    const validationResult = validateDeleteUserRole(req.body)
    if (validationResult?.error)
      return next(apiError.badRequest(validationResult?.msg, 'updateRoles'))

    const isOwner = await getUserByConditions({ _id: req.userId })
    const isAdministrator = await getRolesByConditions({ _id: new mongoose.Types.ObjectId(isOwner.roleId) })

    if (!(isOwner?.accountType === 'owner' || isAdministrator?.name === 'Administrator')) return next(
      apiError.badRequest(MESSEGES.ONLY_OWNER_AND_ADMINISTRATORCAN_DELETE_ROLES, 'updateRoles'),
    )
    const role = await getRolesByConditions({ _id: new mongoose.Types.ObjectId(req.body?.role) })

    if (!role) {
      return next(
        apiError.badRequest(MESSEGES.ROLES_NOT_FOUND, 'updateRoles'),
      )
    }

    const user = await updateUserByCondition({ roleId: new mongoose.Types.ObjectId(req.body?.role) }, { roleId: null });

    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_NOT_FOUND_OR_ROLE_SAME, 'updateRoles'),
      )
    }

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.ROLE_DELETE_SUCCESS, data: {} })

  } catch (error) {
    console.log(error);
    return next(apiError.internal(error, 'signup'));
  }
};

export const companyUserStatus = async (req, res, next) => {
  try {

    const validationResult = validateCompanyUserStatus(req.body)
    if (validationResult?.error)
      return next(apiError.badRequest(validationResult?.msg, 'updateRoles'))

    const isOwner = await getUserByConditions({ _id: req.userId })
    const isAdministrator = await getRolesByConditions({ _id: new mongoose.Types.ObjectId(isOwner.roleId) })

    if (!(isOwner?.accountType === 'owner' || isAdministrator?.name === 'Administrator')) return next(
      apiError.badRequest(MESSEGES.ONLY_OWNER_AND_ADMINISTRATOR_CAN_CHANGE_STATUS, 'updateRoles'),
    )

    //  isAccountEnable: { $ne: req.body?.status } FOR LATER

    const user = await updateUserByCondition({ email: req.body?.email, accountType: 'user' }, { isAccountEnable: req.body?.status });

    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_NOT_FOUND_OR_ACOUNT_OWNER, 'updateRoles'),
      )
    }

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.USER_STATUS_UPDATED, data: { email: user.email } })

  } catch (error) {
    console.log(error);
    return next(apiError.internal(error, 'signup'));
  }
};
export const deleteCompanyUser = async (req, res, next) => {
  try {

    const userId = req.params?.userId || req.body?.userId
    const validationResult = validateDeleteCompanyUser({ userId })
    if (validationResult?.error)
      return next(apiError.badRequest(validationResult?.msg, 'deleteCompanyUser'))

    const isOwner = await getUserByConditions({ _id: req.userId })
    const isAdministrator = await getRolesByConditions({ _id: new mongoose.Types.ObjectId(isOwner.roleId) })

    if (!(isOwner?.accountType === 'owner' || isAdministrator?.name === 'Administrator')) return next(
      apiError.badRequest(MESSEGES.ONLY_OWNER_AND_ADMINISTRATOR_CAN_CHANGE_STATUS, 'deleteCompanyUser'),
    )

    const userExist = await getUserByConditions({ _id: req.userId })

    if (!userExist) {
      return next(
        apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'deleteCompanyUser'),
      )
    }

    //  isAccountEnable: { $ne: req.body?.status } FOR LATER

    const user = await deleteUserById({ userId: new mongoose.Types.ObjectId(userId) });

    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_COULD_NOT_DELETE, 'deleteCompanyUser'),
      )
    }

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.USER_DELETED_SUCCESSFULL, data: { id: user._id } })

  } catch (error) {
    console.log(error);
    return next(apiError.internal(error, 'deleteCompanyUser'));
  }
};

export const emailVerificationResendTeam = async (req, res, next) => {
  try {
    const { email } = req.body;
    const validationResult = validateEmailVerificationResend(req.body)
    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'emailVerificationResend'))


    const user = await getUserByConditions({ email })

    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'emailVerificationResend'),
      )
    }

    const resetToken = nanoid(100);
    const resetTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry time
    // const resetTokenExpiry = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 day expiry time

    user.resetToken = resetToken
    user.resetTokenExpiry = resetTokenExpiry
    user.save()

    await sendVerificationEmail(user, resetToken, "accountTeamEmailVerification", next)

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.EMAIL_VERIFICATION_LINK })

  } catch (error) {
    console.log(error.message)
    return next(apiError.internal(error?.message, 'emailVerificationResend'))
  }
}

export const emailResend = async (req, res, next) => {
  try {
    const { email } = req.body;
    const type = req.query.type;

    const validationResult = validateEmailResend(req.body)
    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'emailVerificationResend'))

    const user = await getUserByConditions({ email })

    if (!user) {
      return next(
        apiError.badRequest(MESSEGES.USER_DOES_NOT_EXIST, 'emailVerificationResend'),
      )
    }

    const resetToken = nanoid(100);
    const resetTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry time
    // const resetTokenExpiry = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 day expiry time

    user.resetToken = resetToken
    user.resetTokenExpiry = resetTokenExpiry
    user.save()

    let templateType;

    if (type === 'reset-password') {
      templateType = 'accountForgotPassword'
    } else if (type === 'email-verify') {
      templateType = 'accountVerification'

    }

    await sendVerificationEmail(user, resetToken, templateType, next)

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.EMAIL_VERIFICATION_LINK })

  } catch (error) {
    console.log(error.message)
    return next(apiError.internal(error?.message, 'emailVerificationResend'))
  }
}

export const stripeCustomerDetailsUpdate = async (req, res, next) => {
  try {

    const validationResult = validateStripeCustomerUpdate(req.body)
    if (validationResult.error)
      return next(apiError.badRequest(validationResult?.msg, 'stripeCustomerUpdate'))

    const {
      address1,
      address2,
      city,
      postalCode,
      country,
      state
    } = req.body

    const companyData = await getCompanyByConditions({ _id: req.companyId })

    const customerData = await stirpeCustomerUpdate(companyData.stripeCustomerId, {
      line1: address1,
      line2: address2,
      city,
      postal_code: postalCode,
      country,
      state
    })

    if (!customerData)
      return next(
        apiError.badRequest(MESSEGES.COULD_NOT_UPDATE_CUSTOMER_DETAILS, 'emailVerificationResend'),
      )


    await updateCompany(req.companyId, {
      address: {
        address_1: address1,
        address_2: address2,
        city,
        postalCode: postalCode,
        country,
        state
      }
    })

    return res
      .status(201)
      .send({ isSuccess: true, message: MESSEGES.STIPE_CUSTOMER_UPDATE_SUCCESS })

  } catch (error) {
    console.log(error.message)
    return next(apiError.internal(error?.message, 'emailVerificationResend'))
  }
}


export default {
  signUp,
  signIn,
  verifyEmail,
  forgotPassword,
  verifyResetToken,
  verifyToken,
  resetPassword,
  changePassword,
  verifyRefreshToken,
  createCheckoutSession,
  createPortalSession,
  subscriptions,
  companySubscription,
  teamSignUp,
  getCompanyUsers,
  updateUserRoles,
  deleteUserRoles,
  companyUserStatus,
  deleteCompanyUser,
  emailVerificationResendTeam,
  emailResend,
  stripeCustomerDetailsUpdate
}
