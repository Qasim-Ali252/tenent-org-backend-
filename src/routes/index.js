import express from 'express'
import users from '../modules/users/router.js'
import roles from '../modules/users/roles-permissions/router.js'
import organizationSettings from '../modules/settings/organization-settings/router.js'
import branches from '../modules/branches/router.js'
import tenants from '../modules/tenants/router.js'
import auth from '../modules/auth/authentication/router.js'
import categories from '../modules/menu/categories/router.js'
import products from '../modules/menu/products/router.js'
import employees from '../modules/auth/employees/router.js'
import authUsers from '../modules/auth/users/router.js'
import authRoles from '../modules/auth/roles/router.js'

export default (app) => {
    const apiV1Router = express.Router()
    
    // Authentication routes
    apiV1Router.use('/auth', auth)
    
    // User Management routes
    apiV1Router.use('/employees', employees)
    apiV1Router.use('/users', authUsers)
    apiV1Router.use('/roles', authRoles)
    
    // Other routes
    apiV1Router.use('/users', users)
    apiV1Router.use('/users', roles)
    apiV1Router.use('/tenants', tenants)
    apiV1Router.use('/organization-settings', organizationSettings)
    apiV1Router.use('/branches', branches)
    
    // Menu routes
    apiV1Router.use('/categories', categories)
    apiV1Router.use('/products', products)
    
    app.use('/api/v1', apiV1Router)
}
