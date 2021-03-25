require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const nodemailer = require("nodemailer");
const {findOneObject,  generateToken, generateRandomNum, errorReport, updateOneObject,formatDate, createObject, findAllObjects, deleteOneObject, updateItemObjectFromForm, filterObj, paginate} = require('./utilities/functions')
// 
const location = require('./utilities/location')
const category = require('./utilities/category')
const type = require("./utilities/typeOfJob");

//
// const home = require('../routes/home')



const session = require("express-session");
const passport = require("passport");

// npm i dotenv express body-parser ejs mongoose nodemailer multer passport-local-mongoose mongoose-findorcreate express-session passport md5 
// 
// models
const fs = require("fs");
const multer = require("multer");
const path = require("path");
// 
const User = require('./models/user');
const Blog = require("./models/blog");
const Contact = require("./models/contactForm");
const EmailList = require("./models/emailList");
const Job = require("./models/jobs");
//   
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.static(__dirname));

// app.use('/', home)

// memory leak fix
app.set('trust proxy', 1);
app.use(
  session({
    secret: process.env.SECRET,//enter secret in .env file
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());


// PRODUCTIONDB
// DEVDB
// MongoDB Connect
mongoose.connect(process.env.PRODUCTIONDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + ".jpg");
  },
});

const upload = multer({ storage: storage });
//
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// AUTH
app
  .route("/login")
  .get((req, res) => {
    // console.log(req.headers.referer)
    // Auto Login
    if(req.user) res.redirect('/')
    else{
        let err, suc=""
        pos = req.headers.referer.split("/").length - 1;
        if (req.headers.referer.split("/")[pos] === "login") {
          err = "Please enter your correct login information.";
        }
        res.render("login", { auth: req.user, err, suc });
    }
  })
  .post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = new User({
      username,
      password,
    });
    req.logIn(user, (err) => {
      if (!err) {
        passport.authenticate("local", {
          failureRedirect: "/login",
          failureMessage: "Please enter your correct login information.",
        })(req, res, () => {
        res.redirect("/dashboard");
        });
      } else {
        res.redirect("/login");
      }
    });
  });
  app
  .get("/logout", (req, res) => {
    req.logOut();
    res.redirect("/login");
  })
  .get("/register", (req, res) => {
    let err,suc = ""
    if(req.headers.referer==='/register')
    err = "Your registration failed, Please try again."
    res.render("register", { auth: req.user, location, err , suc});
  })
  .get("/"+process.env.REGISTERROOT, (req, res) => {
    let err,suc = ""
      res.render("register-root", { auth: req.user, location, err , suc});
  })
  .post("/register", async(req, res) => {
    console.log(req.body)
    const usr = await findOneObject(User,'username',req.body.username)
    if (usr) {
      res.send("User already exist");
      res.redirect("/login");
    } else {
      User.register(
        {
          username: req.body.username,
          alias: req.body.alias,
          phone: req.body.phone,
          gender: req.body.gender,
          highest_level_education: req.body.education,
          location: req.body.location,
          isAdmin: false,
          isRoot: req.body.rumble? req.body.rumble: false,
          dateJoined: new Date()
        },
        req.body.password,
        (err, user) => {
          if (err) {
            res.redirect("/register");// Error redirects to register
          } else {
            passport.authenticate("local")(req, res, () => {
              res.redirect('/dashboard') // Success Auto login
            });
          }
        }
      );
    }
  })
  .get('/dashboard', async (req,res)=>{
    if(req.user){
      try {
        const found = await findOneObject(User,"username",req.user.username)
        const userCount = await findAllObjects(User)
        const jobCount = await findAllObjects(Job)
        const blogCount = await findAllObjects(Blog)
        const counts = {uc: userCount.length, jc:jobCount.length, bc:blogCount.length}
        console.log(counts)
        const index = location.lagos.findIndex(loc => loc.value === found.location)
        found.location = location.lagos[index].display
        res.render('dashboard',{auth: req.user , found, counts})
      } catch (error) {
        console.log(error)        
      }
      
    }else{
      res.redirect('/login')
    }
})
.get('/', async(req,res)=>{
  const posts = await findAllObjects(Job)
    // const p = paginate(posts,5,0 )
    // console.log(p)
    res.render('home',{auth:req.user, posts, location, category, typeOfJob: type, formatDate})
})
.get('/:tk', async (req,res)=>{
          console.log(req.params)
          if(req.params.tk==='all-users'){
            console.log("ALL-USERS")
            if(req.user){
              try {
                const users = await findAllObjects(User)
                const allUsers =users.filter(u => !u.isRoot)
                res.render("user-list",{auth:req.user, allUsers})
              } catch (error) {
                console.log(error)
              }
             
            }else res.redirect('/login')
          }
          else if(req.params.tk==='update'){
            if(req.user){
              try {
                const found = await findOneObject(User,"username",req.user.username)
                res.render('update-user', {auth:req.user, found, location})
              } catch (error) {
                console.log(error)
              }
             
            }else res.redirect('/login')
          }
          else if(req.params.tk==='contact'){
            res.render('contact',{auth: req.user})
          } 
          else if(req.params.tk==='joblist'){ 
            const jobs = await findAllObjects(Job)
            res.render('job-list',{auth: req.user, jobs, typeOfJob:type, location, category})
          } 
          else if(req.params.tk==='part-jobs'){ 
            const jobs = await findAllObjects(Job)
            const part = jobs.filter(j=> j.typeOfJob === 'part')
            res.render('job-list',{auth: req.user, jobs: part, typeOfJob:type, location, category})
          } 
          else if(req.params.tk==='full-jobs'){ 
            const jobs = await findAllObjects(Job)
            const full = jobs.filter(j=> j.typeOfJob === 'full')
            res.render('job-list',{auth: req.user, jobs: full, typeOfJob:type, location, category})
          } 
          else if(req.params.tk==='bloglist'){
            const posts = await findAllObjects(Blog)
            res.render('blog-list',{auth: req.user, posts})
          } 
          else if(req.params.tk.startsWith('all-cat-')){
            const id = req.params.tk.slice(8)
            const jobs = await findAllObjects(Job)
            const filtered = filterObj(jobs,'category',id)
            res.render('job-list',{auth: req.user, jobs: filtered, typeOfJob:type, location, category})
          } 
          else if(req.params.tk.startsWith('emails')){
            
            const emails = await findAllObjects(Contact)
            const unread = emails.filter(em=> em.read === false)
            const emailList = await findAllObjects(EmailList)
            res.render('emails',{auth: req.user, emails,emailList, unread})
          } 
          else if(req.params.tk.startsWith('mailUn')){
            const mail = await findAllObjects(Contact)
            const emails = mail.filter(em=> em.read === false)
            const emailList = await findAllObjects(EmailList)
            res.render('emails',{auth: req.user, emails, emailList, unread:[]})
          } 
          else if(req.params.tk.startsWith('blog')){
            const id = req.params.tk.slice(5)
            console.log(id)
            const post = await findOneObject(Blog, "_id", id)
            res.render('blog-detail',{auth: req.user, post})
          } 
          else if(req.params.tk.startsWith('del-work-exp-')){
            console.log("Del Work Exp")
            const keys = req.params.tk.slice(13)
            const userId = keys.split("-")[0]
            const workId = keys.split("-")[1]
            const user = await findOneObject(User, "_id", userId)
            const nuUser =  await user.work_experience.filter(ex=> Number(ex.id) !== Number(workId)
            )
            user.work_experience = nuUser
            console.log(nuUser)

            await updateOneObject(User,"_id",userId,user)
            res.redirect('/dashboard')
          } 
          else if(req.params.tk.startsWith('del-educ-exp-')){
            console.log("Del Education")
            const keys = req.params.tk.slice(13)
            const userId = keys.split("-")[0]
            const workId = keys.split("-")[1]
            const user = await findOneObject(User, "_id", userId)
            const nuUser =  await user.education.filter(ex=> Number(ex.id) !== Number(workId)
            )
            user.education = nuUser
            await updateOneObject(User,"_id",userId,user)
            res.redirect('/dashboard')
          } 
          else if(req.params.tk.startsWith('mak-user-adm-')){
            console.log("Del User" ,req.params)
            const keys = req.params.tk.slice(13)
            const user = await findOneObject(User,"_id",keys)
            user.isAdmin = true;
            user.save()
            res.redirect('/all-users')
          } 
          else if(req.params.tk.startsWith('del-jobb-pos-')){
            console.log("Job Del")
            const keys = req.params.tk.slice(13)
            Job.findOneAndDelete({"_id" : keys}, (err)=>{
              if(err)console.log(err)
              else{
                console.log("success")
                res.redirect('/joblist')
              }
            })
          }
          else if(req.params.tk.startsWith('del-blog-pos-')){
            console.log("Edit Blog" ,req.params)
            const keys = req.params.tk.slice(13)
            console.log(keys)
            Blog.findOneAndDelete({"_id" : keys}, (err)=>{
              if(err)console.log(err)
              else{
                console.log("success")
                res.redirect('/bloglist')
              }
            })
          }
          else if(req.params.tk.startsWith('edi-tjob-pos-')){
            if(req.user){
            console.log("Edit Job" ,req.params)
            const keys = req.params.tk.slice(13)
            console.log(keys)
            const post = await findOneObject(Job,"_id", keys)  
            res.render("user-ed-exp", {auth:req.user, post, type: "edit-job", location, typeOfJob:type, category})
            } else res.redirect('/')

          }
          else if(req.params.tk.startsWith('edi-blog-pos-')){
            if(req.user){
            console.log("Edit Blog" ,req.params)
            const keys = req.params.tk.slice(13)
            console.log(keys)
            const blog = await findOneObject(Blog,"_id", keys)  
            if(blog.author.username === req.user.username || req.user.isAdmin || req.user.isRoot){
              res.render("user-ed-exp", {auth:req.user, blog, type: "edit-post"})
              } else res.redirect('/login')
            } else res.redirect('/')

          }
          else if(req.params.tk.startsWith('del-user-xxx-')){
            console.log("Del User" ,req.params)
            const keys = req.params.tk.slice(13)
            console.log(keys)
            const id = mongoose.Types.ObjectId(keys)
            const response = await deleteOneObject(User,"_id",id)
            console.log(response)
            res.redirect('/all-users')
          } 
          else if(req.params.tk.startsWith('user-details-')){
            console.log("User-Details")
            const id = req.params.tk.slice(13)
            const user = await findOneObject(User, "_id", id)
            res.render('user-detail',{auth: req.user,found: user, category, location})
          } 
          else if(req.params.tk.startsWith('job-detail-')){
            const id = req.params.tk.slice(11)
            console.log(id)
            const post = await findOneObject(Job, "_id", id)
            console.log(post)
            res.render('job-detail',{auth: req.user,post, type:"job-detail", category, location, typeOfJob: type})
          } 
          else if(req.params.tk.startsWith('add-Job')){
            res.render('user-ed-exp',{auth: req.user, type:"add-job", category, location, typeOfJob: type})
          } 
          else if(req.params.tk.startsWith('mail')){
            const id = req.params.tk.slice(5)
            console.log(id)
            const mail = await findOneObject(Contact, "_id", id)
            mail.read = true
            await updateOneObject(Contact,"_id",id,mail)

            res.render('mail-detail',{auth: req.user, mail})
          } 
          else if(req.params.tk==='add-post'){
            res.render('user-ed-exp',{auth: req.user, type:"add-post"})
          } 
          else if(req.params.tk==='reset'){
            const err = errorReport(req.headers.referer,'/', 'reset', 'Please enter the email registered to the account.')
            res.render("password-reset", { auth: req.user, err });
          } 
          else if(req.params.tk==='add-experience'){
            if(req.user){
              try {
                const found = await findOneObject(User,"username",req.user.username)
                res.render('user-ed-exp', {auth:req.user, found, type:"add-experience"})
              } catch (error) {
                console.log(error)
              }
             
            }else res.redirect('/login')
          } 
          else if(req.params.tk==='add-education'){
            if(req.user){
              try {
                const found = await findOneObject(User,"username",req.user.username)
                res.render('user-ed-exp', {auth:req.user, found, type:"add-education"})
              } catch (error) {
                console.log(error)
              }
            
            }else res.redirect('/login')
          }
          else if(req.params.tk.split('@').length>1){
            console.log("EMAIL")
            try {
              const user = await findOneObject(User,"token",req.params.tk)
              if(req.user){
                console.log("LoggedIN")
                console.log(req.headers.referer)
                const err =  errorReport(req.headers.referer,'/',req.user.username, 'Your passwords do not match, please try again with matching passwords.')
  
                res.render("set-password", { tk: req.params.tk, auth: req.user,err })
                }
                else{
                    console.log("NOT-LoggedIN")
                    if (new Date().getTime() > user.expireToken) {
                      res.redirect("/reset");
                    } else {
                      res.render("set-password", { tk: req.params.tk, auth: req.user });
                    }
                }
            } catch (error) {
              console.log(error)
              res.redirect('/login')
            }
          }
          else{
            res.redirect('/')
          }
 })
 .post("/reset", (req, res) => {
          if (req.body.password[0] === req.body.password[1]) {
            console.log("Matching passwords", req.params);
            if(req.user){
              // For logged in users to change password
              User.findOne({ username: req.user.username }, (err, user) => {
                if (err) console.log(err);
                else {
                  console.log(user);
                  user.setPassword(req.body.password[0], (err, user) => {
                    if (err) console.log(err);
                    else {
                      user.expireToken = undefined;
                      user.token = undefined;
                      user.save((err) => {
                        if (err) console.log(err);
                        else res.redirect("/login");
                      });
                    }
                  });
                }
              });
            }else{
               // For users changing password from email link
              User.findOne({ token: req.body.tk }, (err, user) => {
                if (err) console.log(err);
                else {
                  console.log(user);
                  user.setPassword(req.body.password[0], (err, user) => {
                    if (err) console.log(err);
                    else {
                      user.expireToken = undefined;
                      user.token = undefined;
        
                      user.save((err) => {
                        if (err) console.log(err);
                        else res.redirect("/login");
                      });
                    }
                  });
                }
              });
            }
          
          } else {
            console.log("Passwords don't match");
            res.redirect("/"+req.user.username);
          }
        })
  .post('/searchByLoc', async(req,res)=>{
    if(req.body.type==='bar'){
      console.log("Loc search")
      const jobs = await findAllObjects(Job)
      const fil = []
      jobs.forEach(j=>{
          location.lagos.forEach(l=>{
            if(j.location===l.value){
              if(l.display.includes(req.body.loc)||l.display===req.body.loc){
                fil.push(j)
             }
            }
        })
        }
        )
        res.render('job-list',{auth: req.user, jobs: fil, typeOfJob:type, location, category})
    }
    else if(req.body.type==='top-bar'){
      console.log(req.body)
      const jobs = await findAllObjects(Job)
      let fil = []
      jobs.forEach(j=>{
        location.lagos.forEach(l=>{
          if(j.location===l.value){
            if(l.display.includes(req.body.loc)||l.display===req.body.loc){
              fil.push(j)
            }
          }
          category.forEach(l=>{
            if(j.category===req.body.cat){
              fil.push(j)
            }
          })
          if(j.title.toLowerCase().includes(req.body.key.toLowerCase())){
                fil.push(j)
            }

      })
      }
      )
      const fil2 = new Set(fil)
      fil = Array.from(fil2)
      res.render('job-list',{auth: req.user, jobs: fil, typeOfJob:type, location, category})
    }
 })

.post('/update/user', async(req,res)=>{
  console.log(req.body)
  if(req.user){
    if(req.body.type==='add-education'){
      try {
        const user = await findOneObject(User,"username",req.user.username)
        req.body.id = user.education.length +1 ;
        const upd = {
          ...user._doc,
          education: [req.body,...user._doc.education]
        }
        await updateOneObject(User,"username",req.user.username,upd)
        res.redirect("/dashboard")
      } catch (error) {
        console.log(error)
        res.redirect('/dashboard')
      }
    }
    else if(req.body.type==="add-experience"){
      console.log("EXP",req.body)
      try {
        const user = await findOneObject(User,"username",req.user.username)
        req.body.id = user.work_experience.length +1;
        const upd = {
          ...user._doc,
          work_experience: [req.body,...user._doc.work_experience]
        }
        await updateOneObject(User,"username",req.user.username,upd)
        res.redirect("/dashboard")
      } catch (error) {
        console.log(error)
        res.redirect('/dashboard')
      }
    }
    else if(req.body.type==="emailList"){
      console.log("Email-List",req.body)
      try {
        const obj={
          email: req.body.email
        }
        const list = await findAllObjects(EmailList)
        const index =  await list.findIndex(m=> m.email === obj.email)
        if(index=== -1){
          const mail = new EmailList(obj)
          mail.save()
          res.redirect("/emails")
        }else{
          res.redirect('/dashboard')
        }
      } catch (error) {
        console.log(error)
        res.redirect('/dashboard')
      }
    }
    else if(req.body.type==="edit-job"){
      console.log("EDIT-JOB")
      try {
        const post = await findOneObject(Job,"_id",req.body.id)
        const obj = updateItemObjectFromForm(post,req.body)
        await updateOneObject(Job,"_id",req.body.id,obj)
        res.redirect("/job-detail-"+post._id)
      } catch (error) {
        console.log(error)
        res.redirect('/dashboard')
      }
    }
    else if(req.body.type==="add-job"){
      console.log("ADD-JOB")
      try {
        console.log(req.body)
        const obj={
          title: req.body.title,
          content:req.body.content,
          location:req.body.location,
          company:req.body.company,
          deadline:req.body.deadline,
          category:req.body.category,
          typeOfJob:req.body.typeOfJob,
          yearsOfExp:req.body.yearsOfExp,
          salary:req.body.salary,
          imgUrl:req.body.imgUrl,
          logoUrl:req.body.logoUrl,
          applyLink:req.body.applyLink,
          datePosted: new Date(),
        }
        const job = new Job(obj)
        job.save()
        res.redirect("/dashboard")
      } catch (error) {
        console.log(error)
        res.redirect('/dashboard')
      }
    }
    else if(req.body.type==="edit-post"){
      console.log("EDIT-POST")
      try {
        const blog = await findOneObject(Blog,"_id", req.body.id)
        const obj = updateItemObjectFromForm(blog,req.body)
        await updateOneObject(Blog,"_id",req.body.id,obj)
        res.redirect("/blog-"+blog._id)
      } catch (error) {
        console.log(error)
        res.redirect('/dashboard')
      }
    }
    else if(req.body.type==="add-post"){
      console.log("ADD-POST")
      try {
        req.body.author = {alias: req.user.alias, username: req.user.username}
        req.body.datePosted = new Date()
        await  createObject(Blog,req.body)
        res.redirect("/bloglist")
      } catch (error) {
        console.log(error)
        res.redirect('/dashboard')
      }
    }
    else if(req.body.type==="add-comment"){
      console.log("ADD-COMMENT")
      try {
        const post = await findOneObject(Blog,"_id",req.body.id)
        const commentsNew = [{content: req.body.content, author: req.user.alias, username: req.user.username}, ...post.comments]
        console.log(commentsNew)
        const obj={
          title: post.title,
          content:post.content,
          imgUrl:post.imgUrl,
          estimatedReadTime:post.estimatedReadTime,
          datePosted: post.datePosted,
          author: post.author,
          comments: commentsNew
        }
        await updateOneObject(Blog,'_id',req.body.id,obj)
        res.redirect('bloglist')
      } catch (error) {
        console.log(error)
        res.redirect('/dashboard')
      }
    }
    else{
      const user = await findOneObject(User,"username",req.user.username)
      user.username= req.body.username?req.body.username: user.username;
      user.alias=req.body.alias?req.body.alias: user.alias;
      user.phone= req.body.phone? req.body.phone: user.phone;
      user. gender= req.body.gender? req.body.gender: user.gender;
      user.highest_level_education= req.body.education? req.body.education: user.highest_level_education;
      user.location= req.body.location? req.body.location: user.location;
      user.imgUrl= req.body.imgUrl? req.body.imgUrl: user.imgUrl;
    
    User.updateOne(
      { _id: user._id },
      {
        $set: user,
      },
      (err, doc) => {
        if (err) console.log(err);
        else {
          res.redirect("/dashboard");
        }
      }
    );
  }
  }else res.redirect('/login')
})
.post("/contact",(req,res)=>{
    console.log("CONTACT-FORM")
    try {
      const obj={
        name: req.body.name,
        subject:req.body.subject,
        email:req.body.email,
        phone:req.body.phone,
        dateSent: new Date(),
        message:req.body.message,
        read: false
      }
      const mail = new Contact(obj)
      mail.save()
      res.redirect("/")
    } catch (error) {
      console.log(error)
      res.redirect('/dashboard')
    }
})
//

app.post("/request-new-password", async(req, res) => {
  try {
    const user = await findOneObject(User,"username",req.body.username)
    const rand = generateRandomNum();
    const utk = rand.toString() + user._id.toString();
    user.token = generateToken(utk);
    user.expireToken = new Date().getTime() + (100).toString();
    user.save();
    //
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      ssl: true,
      secure: true,
      auth: {
        user: process.env.EMAILACC,
        pass: process.env.EMAILCLIENTSECRET,
      },
    });
    //
    const mailOptions = {
      html:
        "<h4>Beautiful day to you from \"Your Jobz\". </h4><p>Please click on the link below to reset your password</p>http://localhost:9000/account/" +
        user.token + " </p>",
      to: req.body.username,
      from: process.env.EMAILACC,
      subject: "Your Jobz Password Reset",
    };
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) console.log(err);
      else console.log(info);
    });
    //
    const lEnd = req.body.username.slice(
      req.body.username.indexOf("@"),
      req.body.username.length
    );
    const linkMail = `https://www.${lEnd}`;
    res.render("password-sent", { auth: req.user, linkMail });

  }
   catch (error) {
    console.log(error)
  }

})

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server running at port`, PORT));