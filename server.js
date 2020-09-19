const express = require('express');
const bodyParser = require('body-parser');
const path=require('path');
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine' , 'ejs');

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname + '/public')));

app.use('/', require('./routes/users.js'));
app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
});
