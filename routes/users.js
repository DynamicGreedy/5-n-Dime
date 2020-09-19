const router = require('express').Router();

router.get('/' , (req , res) => res.render('index'));
// Register Page
router.get('/formregister',(req, res) => res.render('formregister'));
// Login Page
router.get('/formlogin', (req, res) => res.render('formlogin'));
module.exports = router;