'use strict';

const promiseFinally = require('promise.prototype.finally');
const Database = require('./database');
const userData = require('./users.json');
const courseData = require('./courses.json')

const enableLogging = process.env.DB_ENABLE_LOGGING === 'true';
const userDatabase = new Database(userData, enableLogging);
const coursesDatabase = new Database(courseData, enableLogging);

promiseFinally.shim();

userDatabase.init()
  .catch(err => console.error(err))
  .finally(() => process.exit());

coursesDatabase.init()
  .catch(err => console.error(err))
  .finally(() => process.exit());
