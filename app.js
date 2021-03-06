var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('hbs');
const fs = require('fs');

var indexRouter = require('./routes/index');
var splitVideosRouter = require('./routes/splitVideos');
var combineVideosRouter = require('./routes/combineVideos');

const template_path = path.join(__dirname, "./templates/views"); 
const partials_path = path.join(__dirname, "./templates/partials"); 

var app = express();

// view engine setup
app.set('view engine', 'hbs');
app.set('views', template_path);
hbs.registerPartials(partials_path);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var dir = './api/public/static';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}
// app.use('/', indexRouter);
app.use('/', splitVideosRouter);
app.use('/', combineVideosRouter);

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
  // res.render('error');
});

module.exports = app;
