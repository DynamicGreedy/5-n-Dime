const router = require('express').Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { forwardAuthenticated } = require('../config/auth');
const { ensureAuthenticated } = require('../config/auth');
const User = require('../models/User');
const Shopowner = require('../models/Shopowner');

router.get('/' , (req , res) => res.render('index' , {user: req.user}));

// Register Page
router.get('/formregister', forwardAuthenticated , (req, res) => res.render('formregister'));
router.post('/formregister', (req, res) => {
    const { name, email, phone, gender, age, password, password2 } = req.body;
    
    let errors = [];

    // Check required fields
    if(!name || !email || !phone || !gender || !age || !password || !password2 ){
        errors.push({msg: 'Please fill in all fields'});
    }

    // check Passwords Match
    if(password!=password2)
    {
        errors.push({msg:' Passwords do not match'});
    }

    //check password length
    if (password.length < 8) {
        errors.push({ msg: 'Password must be at least 8 characters' });
    }

    if (errors.length > 0) {
        res.render('formregister', {
            errors,
            name,
            email,
            phone, 
            gender, 
            age,
            password,
            password2
        });
    }
    else{
        //Validation pass
        User.findOne({email: email}).then(user=>{
            if(user)
            {
                //User exists
                errors.push({msg: 'Email is already registered'});
                res.render('formregister', {
                    errors,
                    name,
                    email,
                    phone, 
                    gender, 
                    age,
                    password,
                    password2
                });
            }
            else
            {
                const newUser = new User({
                    name,
                    email,
                    phone, 
                    gender, 
                    age,
                    password
                });

                // Hash Password
                bcrypt.genSalt(10, (err, salt) =>{
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        // Set password to hashed
                        newUser.password = hash;

                        //Save user
                        newUser.save()
                        .then(user => {
                            req.flash(
                                'success_msg',
                                'You are now registered and can log in'
                              );
                            res.redirect('/formlogin');
                        })
                        .catch(err => console.log(err));
                    });        
                });
            }
        });
    }
});

// Login Page
router.get('/formlogin', forwardAuthenticated , (req, res) => res.render('formlogin'));
router.post('/formlogin', (req, res, next) => {
    
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/formlogin',
      failureFlash: true
    })(req, res, next);
});

//Logout
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

//Add Shop
router.get('/formaddshop',ensureAuthenticated, (req, res) => res.render('formaddshop'));
router.post('/formaddshop',ensureAuthenticated, (req, res) =>{
    // console.log(req.user);
    const { shopname, ownername,  shoptype, donationwant , aboutshop , pincode , area } = req.body;
    // console.log(req.body.ownername);
    // console.log(req.body.shopname);
    // console.log(req.body.shoptype);
    // console.log(req.body.donationwant);
    // console.log(req.body.aboutshop);
    let errors = [];

    if (!shopname || !ownername || !shoptype || !donationwant || !aboutshop || !pincode || !area) 
    {
        errors.push({ msg: 'Please enter all fields' });
    }
    if(pincode.length != 6) errors.push({msg: "Pincode is not valid"});
    if (errors.length > 0) {
        res.render('formaddshop', {
            errors,
            shopname,
            ownername,  
            shoptype,
            donationwant,
            aboutshop,
            pincode,
            area
        });
    }
    else
    {
        Shopowner.findOne({ shopname:shopname }).then(shopowner => 
        {
            if (shopowner) 
            {
                errors.push({ msg: 'Shop name already exists' });
                res.render('formaddshop', {
                    errors,
                    shopname,
                    ownername,
                shoptype,
                donationwant,
                aboutshop,
                pincode,
                area
                });
            } 
            else
            {
                //console.log(req.user);
                req.user.addShop = true;
                req.user.save();
                //console.log(req.user);
                const newShopowner = new Shopowner({
                    email: req.user.email,
                    ownername,
                    shopname,
                    ownername,
                    shoptype,
                    donationwant,
                    aboutshop,
                    pincode,
                    area,
                });
                newShopowner.save().then(shopowner=>{
                    req.flash(
                        'success_msg',
                        'Your shop has been added successfully'
                      );
                    res.redirect('/');
                })
                .catch(err => console.log(err));
            }
        });
    }
});

module.exports = router;