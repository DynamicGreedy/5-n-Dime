const express = require('express');
const bodyParser = require('body-parser');
const path=require('path');
const port = process.env.PORT || 3000;
app.use('/', require('./routes/users.js'));
app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
});
