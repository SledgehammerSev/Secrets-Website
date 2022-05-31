//jshint esversion:6
//Required Apps
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

//Express app
const app = express();

//settings for express, ejs, bodyparser
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

//settings for express-session
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

//settings for passport
app.use(passport.initialize());
app.use(passport.session());

//Mongoose Connection
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//userDB Schema
const userSchema = new mongoose.Schema( {
    email: String,
    password: String,
    googleId: String,
    secret: String
});

//Plugins
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//userDB Model
const User = new mongoose.model("User", userSchema);
//passport for cookies and session
passport.use(User.createStrategy());
// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    done(null, user.id); 
});
// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

//Google oAuth 2.0 Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


//GET Route - Home
app.get("/", function(req, res){
    res.render("home");
});

//GET Route - Google Auth
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })
);

//GET Route - Google Auth to secrets
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

//GET Route - Login
app.get("/login", function(req, res){
    res.render("login");
});

//GET Route - Register
app.get("/register", function(req, res){
    res.render("register");
});

//GET Route - Secrets
app.get("/secrets", function(req, res){
    User.find({"secret": {$ne:null}}, function(err, foundUsers){
        if (err){
            console.log(err);
        } else {
            if (foundUsers){
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    });
});

//GET Route - Submit
app.get("/submit", function(req, res){
    if (req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login")
    }
});

//POST Route - Submit
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) { 
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});

//GET Route - Logout
app.get("/logout", function(req, res){
    req.logout(function(err){
        if (err) { return next (err); }
        res.redirect("/");
    });
});

//POST Route - Register
app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
            });
        }
    });
});

//POST Route - Login
app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
});



//App Listener
app.listen(3000, function () {
    console.log("Server started on port 3000");
});