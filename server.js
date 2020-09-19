const express = require('express');
const bodyParser = require('body-parser');
const path=require('path');
const app = express();
const port = process.env.PORT || 7000;
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
require('dotenv').config();
let urlencodedParser = bodyParser.urlencoded({ extended: false });
// Passport Config
require('./config/passport')(passport);
mongoose.set('useFindAndModify', false);
const uri = process.env.mongodburl;
mongoose.connect(uri,{ useNewUrlParser: true,useUnifiedTopology: true,useFindAndModify: false});

app.set('view engine' , 'ejs');
let Shopowner=require('./models/Shopowner');
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname + '/public')));

// Express session
app.use(
    session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    })
  );

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.post('/filterpincode',function(req,res)
{
      Shopowner.find({pincode:req.body.pincode},function(err,data)
      {
          if(err)
          {
              process.exit(1);
          }
          let set=new Set();
          for(let i=0;i<data.length;i++)
          {
            set.add(data[i].area);
          }
          let pcode={
            pc:req.body.pincode
          };
          let val=Array.from(set);
          val.sort();

          res.render('index-1',{val:val,pcode:pcode,user:req.user});
      })
});

// area filter code
app.post('/filterarea',function(req,res)
{
      Shopowner.find({pincode:req.body.pincode,area:req.body.area},function(err,data)
      {
          if(err)
          {
              process.exit(1);
          }
          res.render('shopslist',{data:data,user:req.user});
      })
});

app.use('/', require('./routes/users.js'));
app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
});
