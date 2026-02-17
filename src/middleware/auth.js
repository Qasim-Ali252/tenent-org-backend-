import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { UserModel } from '../modules/users/model.js'

import { apiError, verifyJwtToken } from '../utils/index.js'
import { MESSEGES } from '../constants/index.js'
import { getUserByConditions } from '../modules/users/services.js'

const isAuthorized = async (req, res, next) => {
    try {
        const bearer = req?.headers?.authorization;
        if (!bearer) {
            res.status(401);
            return next(apiError.badRequest(MESSEGES.AUTHORIZATION_INVALID, 'isAuthorized'))
        }

        const token = bearer.split(' ')[1] || ''

        if (!token) {
            res.status(401);
            return next(apiError.badRequest(MESSEGES.AUTHORIZATION_TOKEN_NOT_FOUND, 'isAuthorized'))
        }

        const decodeUser = await verifyJwtToken(token)

        if (!decodeUser) {
            res.status(401);
            return next(apiError.badRequest(MESSEGES.TOKEN_NOT_VERIFIED, 'isAuthorized'))
        }

        // Check token type (should be 'access' not 'refresh')
        if (decodeUser.type !== 'access') {
            res.status(401);
            return next(apiError.badRequest('Invalid token type', 'isAuthorized'))
        }

        const email = decodeUser?.email

        const user = await getUserByConditions({ email })

        if (!user) {
            res.status(401);
            return next(apiError.badRequest(MESSEGES.USERNAME_NOT_FOUND, 'isAuthorized'))
        }

        // Check if account is enabled
        if (!user.isAccountEnable) {
            res.status(403);
            return next(apiError.badRequest('Account is disabled', 'isAuthorized'))
        }

        req.userId = new mongoose.Types.ObjectId(user?._id)
        req.companyId = user.companyId ? new mongoose.Types.ObjectId(user.companyId) : null
        req.user = user

        next()
    } catch (error) {
        console.log(error, 'error in isAuthorized')
        res.status(401);
        return next(apiError.badRequest(error?.message === 'jwt expired' ? MESSEGES.TOKEN_EXPIRED : MESSEGES.TOKEN_INVALID, 'isAuthorized'))
    }
};

export default isAuthorized;
