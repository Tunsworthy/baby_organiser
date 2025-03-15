const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const { auth } = require('express-openid-connect');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const foodInventoryRouter = require('./routes/foodInventory');
const menusRouter = require('./routes/menus');
const alertsRouter = require('./routes/alerts');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, '..', 'public')));
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://localhost:3001',
  clientID: 'rRbySYSeHQPiTedrjBGbTKyvABu82LV4',
  issuerBaseURL: 'https://dev-qwl2rniklk4aqonr.au.auth0.com'
};

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true  }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(auth(config));
app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});
//app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/foodinventory', foodInventoryRouter);
app.use('/menus',menusRouter);
app.use('/alerts',alertsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
