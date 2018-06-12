'use strict';

/**
 * @package mongoose-paginate
 * @param {Object} [query={}]
 * @param {Object} [options={}]
 * @param {Object|String} [options.select]
 * @param {Object|String} [options.sort]
 * @param {Array|Object|String} [options.populate]
 * @param {Boolean} [options.lean=false]
 * @param {Boolean} [options.leanWithId=true]
 * @param {Number} [options.offset=0] - Use offset or page to set skip position
 * @param {Number} [options.page=1]
 * @param {Number} [options.limit=10]
 * @param {Function} [callback]
 * @returns {Promise}
 */

function paginate(query, options, callback) {
  if (options.deleted) {
    return this.paginateWithDeleted(query, options, callback);
  }
  query = query || {};
  options = Object.assign({}, paginate.options, options);
  let select = options.select;
  let sort = options.sort;
  let populate = options.populate;
  let lean = options.lean || false;
  let leanWithId = options.leanWithId ? options.leanWithId : true;
  let limit = options.limit ? options.limit : 10;
  let page, offset, skip, promises, reQuery = {};
  if (options.offset) {
    offset = options.offset;
    skip = offset;
  } else if (options.page) {
    page = options.page;
    skip = (page - 1) * limit;
  } else {
    page = 1;
    offset = 0;
    skip = offset;
  }

  for (var key in query) {
      reQuery[key] = new RegExp(query[key], 'i');
  }

  if (limit) {
    let docsQuery = this.find(reQuery)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(lean);
    if (populate) {
      [].concat(populate).forEach((item) => {
        docsQuery.populate(item);
      });
    }
    promises = {
      docs: docsQuery.exec(),
      count: this.count(reQuery).exec()
    };
    if (lean && leanWithId) {
      promises.docs = promises.docs.then((docs) => {
        docs.forEach((doc) => {
          doc.id = String(doc._id);
        });
        return docs;
      });
    }
  }
  promises = Object.keys(promises).map((x) => promises[x]);
  return Promise.all(promises).then(([docs, count]) => {
    let result = {
      docs: docs,
      total: count,
      limit: limit
    };
    if (offset !== undefined) {
      result.offset = offset;
    }
    if (page !== undefined) {
      result.page = page;
      result.pages = Math.ceil(count / limit) || 1;
    }
    if (typeof callback === 'function') {
      return callback(null, result);
    }
    return Promise.resolve(result);
  });
}


function paginateWithDeleted(query, options, callback) {
  query = query || {};
  options = Object.assign({}, paginate.options, options);
  let select = options.select;
  let sort = options.sort;
  let populate = options.populate;
  let lean = options.lean || false;
  let leanWithId = options.leanWithId ? options.leanWithId : true;
  let limit = options.limit ? options.limit : 10;
  let page, offset, skip, promises;
  if (options.offset) {
    offset = options.offset;
    skip = offset;
  } else if (options.page) {
    page = options.page;
    skip = (page - 1) * limit;
  } else {
    page = 1;
    offset = 0;
    skip = offset;
  }
  if (limit) {
    let docsQuery = this.findWithDeleted(query)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(lean);
    if (populate) {
      [].concat(populate).forEach((item) => {
        docsQuery.populate(item);
      });
    }
    promises = {
      docs: docsQuery.exec(),
      count: this.countWithDeleted(query).exec()
    };
    if (lean && leanWithId) {
      promises.docs = promises.docs.then((docs) => {
        docs.forEach((doc) => {
          doc.id = String(doc._id);
        });
        return docs;
      });
    }
  }
  promises = Object.keys(promises).map((x) => promises[x]);
  return Promise.all(promises).then(([docs, count]) => {
    let result = {
      docs: docs,
      total: count,
      limit: limit
    };
    if (offset !== undefined) {
      result.offset = offset;
    }
    if (page !== undefined) {
      result.page = page;
      result.pages = Math.ceil(count / limit) || 1;
    }
    if (typeof callback === 'function') {
      return callback(null, result);
    }
    return Promise.resolve(result);
  });
}

/**
 * @param {Schema} schema
 */

module.exports = function(schema) {
  schema.statics.paginate = paginate;
  schema.statics.paginateWithDeleted = paginateWithDeleted;
};

module.exports.paginate = paginate;
module.exports.paginateWithDeleted = paginateWithDeleted;
