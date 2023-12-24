import "dotenv/config"
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import findOrCreate from "mongoose-findorcreate";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";



const app = express();

const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret:"Our Secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/Authentication");
// mongoose.set("useCreateIndex", true);
const userSchema = new mongoose.Schema({ 
    // username: String,
    password: String,
    googleId: String, 
    secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser((user, cb)=> {
    process.nextTick(function() {
      return cb(null, user.id);
    });
  });
  
  passport.deserializeUser(async (id, cb)=> {
    const user = await User.findById(id).exec();
    return cb(null, user);
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id, username:profile.displayName}, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req, res)=>{
    res.render("home.ejs");
});
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/secrets");
  });
app.get("/register", (req, res)=>{
    res.render("register.ejs");
});
app.get("/login", (req, res)=>{
    res.render("login.ejs");
});
app.get("/secrets", async (req, res)=>{
    await User.find({"secret":{$ne:null}}).exec().then((users)=>{
        res.render("secrets.ejs", {usersWithSecrets: users});
    }).catch((err)=>{
        console.log(err);
        res.render("secrets.ejs");
    });
});
app.get("/submit", (req, res)=>{
    if(req.isAuthenticated())res.render("submit.ejs");
    else res.redirect("/login");
});
app.post("/submit", async(req, res)=>{
    User.findById(req.user.id).then((user)=>{
        user.secret=req.body.secret;
        user.save().then(()=>{
            res.redirect("/secrets");
        }).catch((err)=>{
            console.log(err);
            res.redirect("/secrets");
        });
    }).catch((err)=>{
        console.log(err);
        res.redirect("/secrets");
    })
});
app.post("/register", async (req, res)=>{
    User.register({username:req.body.username, active: false}, req.body.password, (err, user)=> {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            });
        }
    });
});
app.post("/login", async (req, res)=>{
    const user= new User({
        username: req.body.username,
        password: req.body.password
    });
    req.logIn(user, (err)=>{
        if(err){
            console.log();
            res.redirect("/login");
        }
        else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            });   
        }
    });
});
app.get("/logout", (req, res)=>{
    req.logout((err)=> {
        if (err){
            console.log(err);
            res.redirect("/secrets");
        }
        res.redirect("/");
      });
});
app.get("/submit", (req, res)=>{
    res.render("submit.ejs");
});
app.post("/submit", (req, res)=>{

});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });