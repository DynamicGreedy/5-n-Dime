const express = require('express');
const bodyParser = require('body-parser');
const path=require('path');
const app = express();
const port = process.env.PORT || 7000;
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const fast2sms = require('fast-two-sms');
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
    let pincode = req.body.pincode;
    let errors=[];
    if (!pincode)
    {
        errors.push({ msg: 'Please enter all fields' });
    }
    if(pincode.length != 6) errors.push({msg: "Please enter a valid pincode"});
    if (errors.length > 0) {
        res.render('index', {
            errors,
            pincode,
        });
    }
    else{
      Shopowner.find({pincode:req.body.pincode},function(err,data)
      {
          if(err)
          {
            errors.push({ msg: 'Not able to process the Pincode you entered' });
            res.render('index', {
                errors,
            pincode,

            });
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
    }
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

// final filter
app.post('/finalfilter',function(req,res)
{
      Shopowner.find({pincode:req.body.pincode,area:req.body.area,shopname:req.body.shopname},function(err,data)
      {
          if(err)
          {
              process.exit(1);
          }
          res.render('shopsearch',{data:data,user:req.user});
      })
});

app.post('/addqueuepage',urlencodedParser, function(req,res){
    let phoneNumbers = req.body.phonenumber;
    let items= req.body.listofitems;
    let errors=[];
    if (!phoneNumbers || !items)
    {
        errors.push({ msg: 'Please fill in all the fields' });
    }
    if(phoneNumbers.length !=10)
    {
        errors.push({ msg: 'Please fill valid phone number' });
    }
    for(var i=0;i<phoneNumbers.length;i++)
    {
        if(phoneNumbers[i]<'0' || phoneNumbers[i]>'9')
        {
            errors.push({ msg: 'Please fill valid phone number' });
            break;
        }
    }
    if (errors.length > 0) {
        Shopowner.find({pincode:req.body.pincode,area:req.body.area,shopname:req.body.shopname},function(err,data)
        {
            res.render('shopsearch',{data:data,
                errors,
                user:req.user});
        });
        
    }
    else{
    Shopowner.findOneAndUpdate({pincode:req.body.pincode,area:req.body.area,shopname:req.body.shopname},
    {
        $push: {phoneNumbers:req.body.phonenumber,items:req.body.listofitems}
    },
    function(err, docs)
    {
        if(err)
        {
            res.json(err);
        }
        else
        {
            Shopowner.find({pincode:req.body.pincode,area:req.body.area,shopname:req.body.shopname},function(err,data)
            {
                // if(err)
                // {
                //     process.exit(1);
                // }
                try {
                    var timenow = new Date();
                    var reachtime = timenow.getMinutes + ((data.length - 1) * 7);
                    console.log(reachtime);
                    console.log(data);
                    const response = fast2sms.sendMessage({authorization: process.env.API_KEY , message: "Dummy message by fast2sms" , numbers: [req.body.phonenumber]});
                    res.render('shopsearch',{data:data,user:req.user});
                }
                catch(err) {
                    console.log(err);
                    process.exit(1);
                }
            })
        }
   });
}
});

//editing about of shopowner
app.post('/editabout',urlencodedParser,function(req,res){
    let newobj={
       aboutshop:req.body.newaboutshop
    };
    Shopowner.findOneAndUpdate({pincode:req.body.pincode,area:req.body.area,shopname:req.body.shopname},
    newobj,
    function(err, docs)
    {
        if(err)
        {
            res.json(err);
        }
        else
        {
            Shopowner.find({pincode:req.body.pincode,area:req.body.area,shopname:req.body.shopname},function(err,data)
            {
                if(err)
                {
                    process.exit(1);
                }
                res.render('myshop',{data:data,user:req.user});
            })
        }
   });
});

//reducing count of customers
app.post('/reducecount',urlencodedParser,function(req,res){
  console.log(req.body);
    Shopowner.findOneAndUpdate({pincode:req.body.pincode,area:req.body.area,shopname:req.body.shopname},
    {
        $pop: {phoneNumbers:-1,items:-1}
    },
    function(err, docs)
    {
        if(err)
        {
            res.json(err);
        }
        else
        {
          Shopowner.find({pincode:req.body.pincode,area:req.body.area,shopname:req.body.shopname},function(err,data)
          {
              if(err)
              {
                  process.exit(1);
              }
              
              res.render('myshop',{data:data,user:req.user});
          })
        }
   });
});

app.use('/', require('./routes/users.js'));
app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
});
