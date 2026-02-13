import { Router } from 'express'
import controller from './controller.js'
import { isAuthorized } from '../../middleware/index.js'
// import paymentMethodRoute from './paymentMethods/router'
// import { protect } from '../../utils'

const router = Router()

router
  .post('/reset-password/:token', controller.resetPassword)
  .post('/signup', controller.signUp)
  .post('/signin', controller.signIn)
  .post('/forgot-password', controller.forgotPassword)
  .post('/verify-reset-token/:token', controller.verifyResetToken)
  .post('/verify-email/:token', controller.verifyEmail)
  .post('/verify-token', isAuthorized, controller.verifyToken)
  .post('/change-password', isAuthorized, controller.changePassword)
  .post('/refresh-token', controller.verifyRefreshToken)
  .post('/create-checkout-session', isAuthorized, controller.createCheckoutSession)
  .post('/create-portal-session', isAuthorized, controller.createPortalSession)
  .post('/company-subscription', isAuthorized, controller.companySubscription)
  .post('/webhook/subscription', controller.subscriptions)
  .post('/team-signup', isAuthorized, controller.teamSignUp)
  .get('/company-users', isAuthorized, controller.getCompanyUsers)
  .patch('/update-user-roles', isAuthorized, controller.updateUserRoles)
  .post('/delete-user-roles', isAuthorized, controller.deleteUserRoles)
  .patch('/company-user-status', isAuthorized, controller.companyUserStatus)
  .delete('/delete-company-user/:userId', isAuthorized, controller.deleteCompanyUser)
  .post('/resend-verify-email-team', isAuthorized, controller.emailVerificationResendTeam)
  .post('/resend-email', controller.emailResend)
  .post('/stripe-customer-details-update', isAuthorized, controller.stripeCustomerDetailsUpdate)






export default router
