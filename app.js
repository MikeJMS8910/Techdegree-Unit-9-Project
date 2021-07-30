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

'use strict';

function authenticateUser(req) { //user authentication function
  let message = ""
  const credentials = req.headers;
  if (credentials.emailaddress) {
    (async () => {
      try {
        const user = await User.findOne({ where: {emailAddress: credentials.emailaddress} });
        if (user) {
          const authenticated = bcrypt
            .compareSync(credentials.password, user.password);
          if (authenticated) {
            console.log(`Authentication successful for email address: ${user.emailAddress}`);
      
            // Store the user on the Request object.
            req.currentUser = user;
          } else {
            message = `Authentication failure for email address: ${user.emailAddress}`;
          }
        } else {
          message = `User not found for email address: ${credentials.emailaddress}`;
        }
      } catch(error){ 
        console.log("error: "+error)
      }
    })();
  } else {
    message = 'Auth header not found';
  }

  if(message !== "") {
    console.log("returned false")
    return false
  } else {
    console.log("returned true")
    return true
  }
}

// for making sure that an id exists
function findById(id) {
  for(let x = 0; x < courseJson.length; x++) {
    console.log(id)
    if(courseJson[x].id == id) {
      console.log("x: "+x)
      return [true, x]
    }
  }
  return [false]
}

app.use(bodyParser.urlencoded({
  extended: true
}));

let User = class User extends Sequelize.Model {} //sets up the user Model
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
  User.hasMany(models.Course);
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
app.get('/api/users',(req, res, next) => {
  if(authenticateUser(req)) {
    refreshValues()
    res.json(userJson)
    res.sendStatus(200)
  } else {
    res.status(401).json({ message: 'Access Denied' });
  }
});

// validation wasnt working for some reason so I put it in a function
function checkValues(from, req) {
  if(from == "user") {
    let good = true;
    let message;
    if(req.body.firstName == null || req.body.firstName == "") {
      good = false;
      message = "first name is empty"
    } else if(req.body.lastName == null || req.body.lastName == "") {
      good = false;
      message = "last name is empty"
    } else if(req.body.emailAddress == null || req.body.emailAddress == "") {
      good = false;
      message = "email address is empty"
    } else if(req.body.password == null || req.body.password == "") {
      good = false;
      message = "password is empty"
    }
    return [good, message]
  } else {
    let good = true;
    let message;
    if(req.body.title == null || req.body.title == "") {
      good = false;
      message = "title is empty"
    } else if(req.body.description == null || req.body.description == "") {
      good = false;
      message = "description is empty"
    }
    return [good, message]
  }
}

// post route to create users
app.post('/api/users', async (req, res) => {
  let bodyValues = req.body
  let newUserValues;
  const plain = req.body.password;
  const other = 'password';
  if(checkValues("user", req)[0]) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(plain , salt, function(err, hash) {
        bodyValues.password = hash;
        (async () => {
          await sequelize.sync({ logging: true, force: false });
          
          try {
            newUserValues = await User.create(bodyValues);
            refreshValues()
          } catch(error) {
            res.status(500).json({ message: "Error: "+error })
          }
        })();
      });
    });
    userJson.push(newUserValues)
    res.redirect(201, "/")
  } else {
    res.status(400).json({ message: checkValues("user", req)[1] });
  }
});

// gets all courses
app.get('/api/courses', (req, res) => {
  refreshValues()
  res.json(courseJson)
  res.status(200)
});

// gets specific courses
app.get('/api/courses/:id', (req, res) => {
  if(findById(req.params.id)[0]) {
    res.json(courseJson[findById(req.params.id)[1]])
    res.status(200)
  } else{
    res.status(404).json({ message: "The given id does not exsist" })
  }
});

//creates courses
app.post('/api/courses',(req, res) => {
  if(authenticateUser(req)) {
    let bodyValues = req.body
    let newCourseValues;
    console.log("checkValues: "+checkValues("courses", req))
    if(checkValues("course", req)[0]) {
      (async () => {
        await sequelize.sync({ force: false }); 
        try { 
            newCourseValues = await Course.create(bodyValues); 
            refreshValues()
        } catch(error) {
          res.status(500).json({ message: 'Error: '+error })
        }
      })();
      userJson.push(newCourseValues)
      res.redirect(201, "/")
    } else {
      res.status(400).json({ message: checkValues("course", req)[1] });
    }
  } else {
    res.status(401).json({ message: 'Access Denied' });
  }
});

// updates courses
app.put('/api/courses/:id',(req, res) => {
  if(authenticateUser(req)) {
    if(findById(req.params.id)[0]) {
      let courseToUpdate;
      let changeId = courseJson[findById(req.params.id)[1]].id;
      (async () => {
        await sequelize.sync({ logging: true, force: false });
   
        try {
          console.log("changeId: "+changeId)
          courseToUpdate = await Course.findByPk(changeId)
          console.log("course to update: "+courseToUpdate)
          courseToUpdate.update(req.body)

          refreshValues()
        } catch(error) {
          res.status(500).json({ message: "Error: "+error })
        }
      })();
      refreshValues()
      res.status(204)
      res.json()
    } else {
      res.status(404).json({ message: "The given id does not exsist" })
    }
  } else {
    res.status(401).json({ message: 'Access Denied' });
  }
});

// deletes courses
app.delete('/api/courses/:id',(req, res) => {
  if(authenticateUser(req)) {
    if(findById(req.params.id)[0]) {
      Course.destroy({
        where: {
          id: courseJson[findById(req.params.id)[1]].id
        }
      })
      refreshValues()
      res.status(204)
      res.json()
    } else {
      res.status(404).json({ message: "The given id does not exsist" })
    }
  } else {
    res.status(401).json({ message: 'Access Denied' });
  }
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
