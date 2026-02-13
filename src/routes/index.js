import express from 'express'
import users from '../modules/users/router.js'
import roles from '../modules/users/roles-permissions/router.js'
import organizationSettings from '../modules/settings/organization-settings/router.js'
import branches from '../modules/branches/router.js'

export default (app) => {
    const apiV1Router = express.Router()
    apiV1Router.use('/users', users)
    apiV1Router.use('/users', roles)
    apiV1Router.use('/organization-settings', organizationSettings)
    apiV1Router.use('/branches', branches)
    app.use('/api/v1', apiV1Router)
}
