import mongoose from 'mongoose';
import { apiError } from './apiErrorHandler.js';
import { MESSAGES, APP_STATUS } from '../constants/index.js';


class GlobalService {
 

  constructor(Model) {
    if (!Model) {
      throw new Error('A valid Model is required to initialize GlobalService.');
    }
    this.Model = Model;
    this.tenantField = 'tenantId';
    this.hasTenantField = false;

    // Check if the model schema has a tenantId field
    if (Model.schema && Model.schema.paths && Model.schema.paths[this.tenantField]) {
      this.hasTenantField = true;
    }
  }

 

  _enforceTenant(query, tenantId, bypass = false) {
    if (this.hasTenantField) {
      if (!tenantId && !bypass) {
        // If tenantId is null/undefined, allow query without tenant filter
        // This allows multi-tenant models to work without tenant context
        return query;
      }
      if (!bypass && tenantId) {
        return { ...query, [this.tenantField]: tenantId };
      }
    }
    return query;
  }

  

  _isInvalidObjectId(id) {
    return !mongoose.Types.ObjectId.isValid(id);
  }

 

  async getById(id, options = {}, tenantId = null, bypass = false) {
    if (this._isInvalidObjectId(id)) {
      throw apiError.badRequest(MESSAGES.INVALID_ID || 'Invalid ID format');
    }

    let queryObj = { _id: id };
    queryObj = this._enforceTenant(queryObj, tenantId, bypass);

    const { select, populate } = options;
    const query = this.Model.findOne(queryObj);

    if (select) query.select(select);
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((p) => query.populate(p));
      } else {
        query.populate(populate);
      }
    }

    const document = await query;
    return document ? document.toJSON() : null;
  }




  async getByIds(ids, options = {}, tenantId = null, bypass = false) {
    if (!Array.isArray(ids)) {
      throw apiError.badRequest('IDs must be an array');
    }

    if (ids.some((id) => this._isInvalidObjectId(id))) {
      throw apiError.badRequest(MESSAGES.INVALID_IDS || 'Invalid ID format in array');
    }

    const { select, populate } = options;
    let queryObj = { _id: { $in: ids } };
    queryObj = this._enforceTenant(queryObj, tenantId, bypass);

    const query = this.Model.find(queryObj);

    if (select) query.select(select);
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((p) => query.populate(p));
      } else {
        query.populate(populate);
      }
    }

    const documents = await query;
    return documents.length ? documents.map((doc) => doc.toJSON()) : [];
  }

  

  async getOneByConditions(condition, options = {}, tenantId = null, bypass = false) {
    let queryObj = this._enforceTenant(condition, tenantId, bypass);
    const { select, populate } = options;

    const query = this.Model.findOne(queryObj);

    if (select) query.select(select);
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((p) => query.populate(p));
      } else {
        query.populate(populate);
      }
    }

    const document = await query;
    return document ? document.toJSON() : null;
  }

 

  async getAll(filters = {}, options = {}, tenantId = null, bypass = false) {
    const { limit, skip, sort, select, populate } = options;
    const queryObj = this._enforceTenant(filters, tenantId, bypass);

    const query = this.Model.find(queryObj);

    if (select) query.select(select);
    if (sort) query.sort(sort);
    if (limit) query.limit(limit);
    if (skip) query.skip(skip);
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((p) => query.populate(p));
      } else {
        query.populate(populate);
      }
    }

    const documents = await query;
    return documents.length ? documents.map((doc) => doc.toJSON()) : [];
  }

  

  async getAllWithPagination(filters = {}, page = 1, limit = 10, options = {}, tenantId = null, bypass = false) {
    const skip = (page - 1) * limit;
    const queryObj = this._enforceTenant(filters, tenantId, bypass);

    const [documents, total] = await Promise.all([
      this.getAll(queryObj, { ...options, skip, limit }, tenantId, bypass),
      this.countDocuments(queryObj, tenantId, bypass)
    ]);

    return {
      data: documents,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  

  async create(data, options = {}) {
    const document = new this.Model(data);
    await document.save();

    const { populate } = options;
    if (populate) {
      if (Array.isArray(populate)) {
        await document.populate(populate);
      } else {
        await document.populate(populate);
      }
    }

    return document.toJSON();
  }

  

  async createMany(dataArray, options = {}) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw apiError.badRequest('Input must be a non-empty array');
    }

    const createdDocuments = [];
    for (const data of dataArray) {
      const doc = await this.create(data, options);
      createdDocuments.push(doc);
    }

    return createdDocuments;
  }

  

  async update(id, updateFields, options = {}, tenantId = null, bypass = false) {
    if (this._isInvalidObjectId(id)) {
      throw apiError.badRequest(MESSAGES.INVALID_ID || 'Invalid ID format');
    }

    let queryObj = { _id: id };
    queryObj = this._enforceTenant(queryObj, tenantId, bypass);

    const { populate } = options;

    let document = await this.Model.findOneAndUpdate(
      queryObj,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!document) {
      throw apiError.notFound(`${this.Model.modelName} not found`);
    }

    if (populate) {
      if (Array.isArray(populate)) {
        await document.populate(populate);
      } else {
        await document.populate(populate);
      }
    }

    return document.toJSON();
  }

  

  async updateMany(ids, updateFieldsArray, options = {}, tenantId = null, bypass = false) {
    if (!Array.isArray(ids) || !Array.isArray(updateFieldsArray)) {
      throw apiError.badRequest('IDs and updateFields must be arrays');
    }

    if (ids.length !== updateFieldsArray.length) {
      throw apiError.badRequest('IDs and updateFields arrays must have the same length');
    }

    if (ids.some((id) => this._isInvalidObjectId(id))) {
      throw apiError.badRequest(MESSAGES.INVALID_IDS || 'Invalid ID format in array');
    }

    let queryObj = { _id: { $in: ids } };
    queryObj = this._enforceTenant(queryObj, tenantId, bypass);

    const bulkOps = ids.map((id, index) => ({
      updateOne: {
        filter: { ...queryObj, _id: id },
        update: { $set: updateFieldsArray[index] }
      }
    }));

    await this.Model.bulkWrite(bulkOps);

    let documents = await this.Model.find(queryObj);
    if (options.populate) {
      if (Array.isArray(options.populate)) {
        await Promise.all(options.populate.map(p => this.Model.populate(documents, p)));
      } else {
        await this.Model.populate(documents, options.populate);
      }
    }

    return documents.map(doc => doc.toJSON());
  }



  async deleteOne(id, tenantId = null, bypass = false) {
    if (this._isInvalidObjectId(id)) {
      throw apiError.badRequest(MESSAGES.INVALID_ID || 'Invalid ID format');
    }

    let queryObj = { _id: id };
    queryObj = this._enforceTenant(queryObj, tenantId, bypass);

    const existingDoc = await this.Model.findOne(queryObj, { _id: 1 }).lean();

    if (!existingDoc) {
      throw apiError.notFound(`${this.Model.modelName} not found`);
    }

    const result = await this.Model.updateOne(queryObj, {
      $set: { status: APP_STATUS.ARCHIVED }
    });

    return result.modifiedCount || 1;
  }

  

  async deleteMany(ids, tenantId = null, bypass = false) {
    if (!Array.isArray(ids)) {
      throw apiError.badRequest('IDs must be an array');
    }

    if (ids.some((id) => this._isInvalidObjectId(id))) {
      throw apiError.badRequest(MESSAGES.INVALID_IDS || 'Invalid ID format in array');
    }

    let queryObj = { _id: { $in: ids } };
    queryObj = this._enforceTenant(queryObj, tenantId, bypass);

    const existingDocs = await this.Model.find(queryObj, { _id: 1 }).lean();
    const existingIds = existingDocs.map((doc) => doc._id.toString());

    const missingIds = ids.filter((id) => !existingIds.includes(id.toString()));

    if (missingIds.length > 0) {
      throw apiError.badRequest(`Some ${this.Model.modelName} records not found`);
    }

    const result = await this.Model.updateMany(queryObj, {
      $set: { status: APP_STATUS.ARCHIVED }
    });

    return result.modifiedCount || ids.length;
  }

 

  async hardDeleteOne(id, tenantId = null, bypass = false) {
    if (this._isInvalidObjectId(id)) {
      throw apiError.badRequest(MESSAGES.INVALID_ID || 'Invalid ID format');
    }

    let queryObj = { _id: id };
    queryObj = this._enforceTenant(queryObj, tenantId, bypass);

    const document = await this.Model.findOneAndDelete(queryObj);

    if (!document) {
      throw apiError.notFound(`${this.Model.modelName} not found`);
    }

    return document.toJSON();
  }

  

  async hardDeleteMany(ids, tenantId = null, bypass = false) {
    if (!Array.isArray(ids)) {
      throw apiError.badRequest('IDs must be an array');
    }

    if (ids.some((id) => this._isInvalidObjectId(id))) {
      throw apiError.badRequest(MESSAGES.INVALID_IDS || 'Invalid ID format in array');
    }

    let queryObj = { _id: { $in: ids } };
    queryObj = this._enforceTenant(queryObj, tenantId, bypass);

    const result = await this.Model.deleteMany(queryObj);

    return result.deletedCount;
  }

 

  async countDocuments(filters = {}, tenantId = null, bypass = false) {
    const queryObj = this._enforceTenant(filters, tenantId, bypass);
    return await this.Model.countDocuments(queryObj);
  }

 
  async exists(filters = {}, tenantId = null, bypass = false) {
    const queryObj = this._enforceTenant(filters, tenantId, bypass);
    const count = await this.Model.countDocuments(queryObj).limit(1);
    return count > 0;
  }

  
  
  async populateDocuments(documents, populate) {
    try {
      if (!this.Model) {
        throw new Error('Model is not defined.');
      }

      if (Array.isArray(populate)) {
        await this.Model.populate(documents, populate);
      } else {
        await this.Model.populate(documents, populate);
      }
      return documents;
    } catch (error) {
      throw new Error(`Failed to populate documents: ${error.message}`);
    }
  }
}

export default GlobalService;
