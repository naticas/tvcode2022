const express = require("express");
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;
app.use(cors());

app.get('/', function(req, res, next){
    console.log('dirname :', path.join(__dirname+'/android/player.html'))
    res.sendFile(path.join(__dirname+'/android/player.html'));
});

app.listen(PORT, () => console.log(`Example app listening at http://localhost:${PORT}`));