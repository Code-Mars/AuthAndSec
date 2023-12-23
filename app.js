import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const saltRounds=10;
const app = express();

const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/Authentication");
const userSchema = new mongoose.Schema({ 
    username: String,
    password: String 
});
const secret = process.env.SECRET;

const User = mongoose.model("User", userSchema);
app.get("/", (req, res)=>{
    res.render("home.ejs");
});
app.get("/register", (req, res)=>{
    res.render("register.ejs");
});
app.get("/login", (req, res)=>{
    res.render("login.ejs");
});
app.get("/secrets", (req, res)=>{
    res.render("secrets.ejs");
});
app.post("/register", async (req, res)=>{
    bcrypt.hash(req.body.password, saltRounds, async(err, hash)=> {
        const user=new User({username: req.body.username, password: hash});
        await user.save().then(()=>{
            res.render("secrets.ejs");
        }).catch((err)=>{
            console.log(err);
            res.redirect("/register");
        });
    });
});
app.post("/login", async (req, res)=>{
    await User.findOne({username:req.body.username}).then((user)=>{
        bcrypt.compare(req.body.password, user.password, function(err, match) {
            if(match===true)res.render("secrets.ejs");
            else res.redirect("/login");
        });
    }).catch((err)=>{
        console.log(err);
        res.redirect("/login");
    });
});
app.get("/logout", (req, res)=>{
    res.redirect("/login");
});
app.get("/submit", (req, res)=>{
    res.render("submit.ejs");
});
app.post("/submit", (req, res)=>{

});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });