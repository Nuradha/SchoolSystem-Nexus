const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const config = require('./config/database')

mongoose.connect('mongodb://localhost/nodekb');
let db = mongoose.connection;

db.once('open',function(){
  console.log('server connectedd');
});

db.on('error',function(err){
  console.log(err);
});

const app = express();

//let Student = require('./models/student');
let Assignment = require('./models/assignment');

app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'public')));


app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));

app.use(require('connect-flash')());
app.use(function(req,res,next){
  res.locals.messages = require('express-messages')(req,res);
  next();
});


app.use(expressValidator({
  errorFormatter: function(params,msg,value){
    var namespace = params.split('.')
    , root = namespace.shift()
    , formParam = root;

    while(namespace.length){
      formParam += '['+ namespace.shift() +']';
    }
    return{
      param:formParam,
      msg:msg,
      value:value
    };
  }
}));

require('./config/passport')(passport);

app.use(passport.initialize());
app.use(passport.session());

app.get('/add/teacher',function(req,res){
  res.render('add_teacher');
});

app.get('/add/student',function(req,res){
  res.render('add_student');
});

app.get('/add/management',function(req,res){
  res.render('add_management');
});

app.post('/add/teacher',function(req,res){
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  //const passwordRepeat = req.body.passwordRepeat;

  req.checkBody('username','name is required').notEmpty();
  req.checkBody('email','email is required').notEmpty();
  //req.checkBody('email','email is incorrect').isEmail();
  req.checkBody('password','password is required').notEmpty();
  //req.checkBody('passwordRepeat','passwordRepeat is required').notEmpty();
  //req.checkBody('passwordRepeat','passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();

  if(errors){
    res.render('add_teacher',{
      errors:errors
    });
  }else{
      let student = new Student({
        username:username,
        email:email,
        password:password
      });
      Student.createStudent(student, function(err, user){
			  if(err) throw err;
			  console.log(student);
	    });

      res.redirect('/add/student');
  }

});


app.get('/user/logincheck',function(req,res){
  res.render('logincheck');
});

app.get('/menu',function(req,res){
  res.render('index');
});

app.get('/',ensureAuthenticated,function(req,res){
  if(req.user.type=="Student"){
    res.render('index');
  }else if(req.user.type=="Teacher"){
    res.render('teacher/teacher');
  }else if(req.user.type=="Principal"){
    res.render('principal/principal');
  }else{
    res.render();
  }
});

let assignments = require('./routes/assignments');
app.use('/assignments',assignments);

let users = require('./routes/users');
app.use('/users',users);

let leaves = require('./routes/leaves');
app.use('/leaves',leaves);

let schemes = require('./routes/schemes');
app.use('/schemes',schemes);

let circulars = require('./routes/circulars');
app.use('/circulars',circulars);

let marks = require('./routes/marks');
app.use('/marks',marks);

let reports = require('./routes/reports');
app.use('/reports',reports);

let timetable = require('./routes/timetable');
app.use('/timetable',timetable);

let payment = require('./routes/payments');
app.use('/payment',payment);

let approvedmarks = require('./routes/approvedmarks');
app.use('/approvedmarks',approvedmarks);

let myresults = require('./routes/myresults');
app.use('/myresults',myresults);

let material = require('./routes/material');
app.use('/material',material);

function ensureAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }else{
    req.logout();
    req.flash('success','You are now logged out');
    res.redirect('/users/login');
  }
}

app.listen(3000,function(){
    console.log("Server started on port 3000");
});
