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
                    if(data[0].items.length == 1) {
                        const response = fast2sms.sendMessage({authorization: process.env.API_KEY , message: "You have been added to the queue successfully. It's your turn. You can leave for the shop now. In case you are not able to reach the shop within 7 minutes from the time of receiving this message, your registration will be cancelled. Regards, Team 5-&-DIME" , numbers: [req.body.phonenumber]});
                    }
                    else if(data[0].items.length == 2) {
                        const response = fast2sms.sendMessage({authorization: process.env.API_KEY , message: "You have been added to the queue successfully. You can leave for the shop 7 minutes later from the time of receiveing this message. In case you are not able to reach the shop within 14 minutes, your registration will be cancelled. Regards, Team 5-&-DIME" , numbers: [req.body.phonenumber]});
                    }
                    else {
                        var exptime = (data[0].length - 1) * 7;
                        const response = fast2sms.sendMessage({authorization: process.env.API_KEY , message: `You have been added to the queue successfully. Your expected time is ${exptime} minutes from now. You will be notified once again about the exact time. Regards, Team 5-&-DIME` , numbers: [req.body.phonenumber]});
                    }
                    res.render('shopsearch',{data:data,user:req.user});
                }
                catch(err) {
                    console.log(err);
                    process.exit(1);
                }
            })
        }
   });
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
