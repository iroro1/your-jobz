const express = require('express')
const router = express.Router()

// 
const User = require('../models/user');
const Blog = require("../models/blog");
const Contact = require("../models/contactForm");
const EmailList = require("../models/emailList");
const Job = require("../models/jobs");
//   
const {findOneObject,  generateToken, generateRandomNum, errorReport, updateOneObject,formatDate, createObject, findAllObjects, deleteOneObject, updateItemObjectFromForm, filterObj, paginate} = require('../utilities/functions')
const location = require('../utilities/location')
const category = require('../utilities/category')
const type = require("../utilities/typeOfJob");


router
.get('', async(req,res)=>{
    try {
      const posts = await findAllObjects(Job)
      console.log(posts)
        const p = []
        posts.forEach(post=>p.unshift(post))
        res.render('home',{auth:req.user, posts: p.slice(0,10), location, category, typeOfJob: type, formatDate})
    } catch (error) {
        console.log(error)
      res.render('404', {auth:req.user, error})
    }
  })


module.exports=router