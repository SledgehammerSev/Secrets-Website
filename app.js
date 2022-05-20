//jshint esversion:6
//Required Apps
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

//Express app
const app = express();

//settings for express, ejs, bodyparser
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

//Mongoose Connection
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//userDB Schema
const userSchema = new mongoose.Schema( {
    email: String,
    password: String
});

//Mongoose database Encryption
var secret = process.env.SECRET;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

//userDB Model
const User = new mongoose.model("User", userSchema);

//GET Route - Home
app.get("/", function(req, res){
    res.render("home");
});

//GET Route - Login
app.get("/login", function(req, res){
    res.render("login");
});

//GET Route - Register
app.get("/register", function(req, res){
    res.render("register");
});

//POST Route - Register
app.post("/register", function(req, res){
 const newUser = new User({
    email: req.body.username,
    password: req.body.password,
    });
    newUser.save(function(err){
        if (err){
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});

//POST Route - Login
app.post("/login", function(req, res){
 const username = req.body.username;
 const password = req.body.password;

 User.findOne({email: username}, function(err, foundUser){
     if (err) {
         console.log(err);
     } else {
         if (foundUser) {
             if (foundUser.password === password) {
                res.render("secrets");
             }
         }
     }
 })
});



//App Listener
app.listen(3000, function () {
    console.log("Server started on port 3000");
});