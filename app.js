'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');
const Sequelize = require('sequelize');
var bodyParser = require('body-parser')
let userJson = require('./seed/users')
let courseJson = require('./seed/courses')
const fs = require('fs');
const { emitWarning } = require('process');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'fsjstd-restapi.db'
});

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// setup morgan which gives us http request logging
app.use(morgan('dev'));

app.use(bodyParser.urlencoded())

class User extends Sequelize.Model {} //sets up the user Model
User.init({
  firstName: {
    type: Sequelize.STRING, 
    allowNull: true
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: true
  },
  emailAddress: {
    type: Sequelize.STRING,
    allowNull: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, { sequelize });
User.associate = (models) => {
  User.hasMany(models.Course, {
    foreignKey: {
      name: 'id',
      allowNull: false
    }
  });
};

class Course extends Sequelize.Model {} //sets up the course Model
Course.init({
  title: {
    type: Sequelize.STRING,
    allowNull: true
  },
  description : {
    type: Sequelize.TEXT,
    allownull: true
  },
  estimatedTime : {
    type: Sequelize.STRING,
    allowNull: true
  },
  materialsNeeded : {
    type: Sequelize.STRING,
    allowNull: true
  }
}, { sequelize });
Course.associate = (models) => {
  Course.belongsTo(models.User);
};

// authenticate the connection to the database, and put all of the values into a json file
function refreshValues() {
  console.log("values are being refreshed");
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('Connection has been established successfully.');

      const users = await User.findAll()
      let userValues = users.map(user => user.get({ plain: true }))
      userJson = userValues;

      const courses = await Course.findAll()
      let courseValues = courses.map(course => course.get({ plain: true }))
      courseJson = courseValues;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  })();
}

refreshValues()


// get route to get all of the users
app.get('/api/users', (req, res, next) => {
  res.json(userJson)
  res.sendStatus(200)
});

// post route to create users
app.post('/api/users', (req, res) => {
  let newUserValues;
  const plain = req.query.password;
  const other = 'password';
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(plain , salt, function(err, hash) {
      (async () => {
        await sequelize.sync({ logging: true, force: false });
        
        try {
          newUserValues = await User.create({ firstName: `${req.query.firstName}`, lastName: `${req.query.lastName}`, emailAddress: `${req.query.emailAddress}`, password: `${hash}`});
          refreshValues()
        } catch(error) {
  
        }
      })();
    });
  });
  userJson.push(newUserValues)
  res.redirect(201, "/")
});

// gets all courses
app.get('/api/courses', (req, res) => {
  res.json(courseJson)
  res.status(200)
});

// gets specific courses
app.get('/api/courses/:id', (req, res) => {
  res.json(courseJson.courses[req.params.id - 1])
  res.status(200)
});

//creates courses
app.post('/api/courses', (req, res) => {
  /*sequelize.transaction(function(t) {
    var options = { raw: true, transaction: t }
  
    sequelize
      .query('SET FOREIGN_KEY_CHECKS = 0', null, options)
      .then(function() {
        return sequelize.query('truncate table myTable', null, options)
      })
      .then(function() {
        return sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, options)
      })
      .then(function() {
        return t.commit()
      })
  }) */
  console.log("raw req.query: "+req.query.title)
  let newCourseValues;
  (async () => {
    await sequelize.sync({ logging: true, force: false });
   
    try {
      console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
      //newCourseValues = await Course.create({ title: `${req.query.title}`, description: `${req.query.description}`, estimatedTime: `${req.query.estimatedTime}`, materialsNeeded: `${req.query.materialsNeeded}`});
      newCourseValues = await Course.create({ title: "TitleCourse", description: "DescriptionCourse", estimatedTime:"EstimatedTimeCourse", materialsNeeded: "MaterialsNeededCourse"});
    } catch(error) {
      console.log("error"+error)
    }
  })();
  console.log("newCourseValues"+newCourseValues)
  refreshValues()
  courseJson.push(newCourseValues)
  res.redirect(201, "/")  
});

// updates courses
app.put('/api/courses/:id', (req, res) => {

});

// deletes courses
app.delete('/api/courses/:id', (req, res) => {
  Course.destroy({
    where: {
      id: req.params.id
    }
  })
  res.status(204)
});

// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

// start listening on our port
const server = app.listen(app.get('port'), () => {
  console.log(`Express server is listening on port ${server.address().port}`);
});
