import express from 'express'
import path from 'path'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken' // used to mask the token
import bcrypt from 'bcrypt' //used to convert hash password while storing in data-base.


//connecting to data base
mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName:"backend",
})
.then(()=>console.log("database connected"))
.catch(e=>console.log(e))

//creating schema
const userSchema=new mongoose.Schema({
    name:String,
    email:String,
    password:String,
})

const User=mongoose.model("User", userSchema)

const app = express()

//Here next is next availabe handler
const isAuthenticated = async (req,res,next)=>{
    const {token}=req.cookies
    if(token){
        const decoded = jwt.verify(token,"sdfsagdsgdsg")
        console.log(decoded)
        req.user = await User.findById(decoded._id)
        next()
    }else{
        res.redirect("/login")
    }

}

//using middle-ware
app.use(express.static(path.join(path.resolve(),"public"))) //this one is for adding static file
app.use(express.urlencoded({extended:true})) //this one is to get the post data after submit details in userform
app.use(cookieParser())

//setting up view engine
app.set("view engine","ejs") //either give the extension in the argument of render (res.render("index.ejs")) or set this line.

app.get("/",isAuthenticated,(req,res)=>{
    console.log(req.user)
    res.render("logout",{name:req.user.name})

    // const {token}=req.cookies
    // if(token){
    //     res.render("logout")
    // }else{
    //     res.render("login",{name:"Abhishek"})
    // }

    // res.render("login",{name:"Abhishek"}) //to use the rander function user need to add the template in views folder.
    // res.sendFile("index") //taking static file from public folder
    // res.sendFile(path.join(path.resolve(),"index.html"))
})
app.get("/register",(req,res)=>{
    console.log(req.user)
    res.render("register")
})

app.get("/login",(req,res)=>{
    // console.log(req.user)
    res.render("login")
})
app.post("/login",async(req, res)=>{
    const {email, password}=req.body

    let user =await User.findOne({email})
    if(!user){
        return res.redirect("/register")
    }

    const isMatch =await bcrypt.compare(password, user.password)

    if(!isMatch){
        return res.render("login", {email, message:"Incorrect Password"})
    }

    const token =jwt.sign({_id:user._id},"sdfsagdsgdsg")

    res.cookie("token",token,{
        httpsOnly:true,
        expires:new Date(Date.now()+60*1000)
    })
    res.redirect("/")
})
app.post("/register", async (req,res)=>{

    const {name,email,password}=req.body

    const foundUser= await User.findOne({email})

    if(foundUser){
        return res.redirect("login")
    }

    const hashedPassword = await bcrypt.hash(password,10)
    const user= await User.create({
        name:name, 
        email:email,
        password:hashedPassword,
    })
    console.log(user)
    const token =jwt.sign({_id:user._id},"sdfsagdsgdsg")

    res.cookie("token",token,{
        httpsOnly:true,
        expires:new Date(Date.now()+60*1000)
    })
    res.redirect("/")
})

app.get("/logout", (req,res)=>{
    res.cookie("token",null,{
        httpsOnly:true,
        expires:new Date(Date.now())
    })
    res.redirect("/")
})

// app.get("/add",async (req,res)=>{
//     await Message.create({name:"Abhi2",email:"sample@gmail.com"}).then(()=>{
//         res.send("Nice")
//     })
// })

// app.post("/contact",async (req,res)=>{

//     const {name,email}=req.body

//     await User.create({name:name, email:email})

//     res.redirect("/success")
// })
// app.get("/success",(req, res)=>{
//     res.render("success")
// })
// app.get("/users",(req,res)=>{
//     res.json({
//         users,
//     })
// })

app.listen(5000,()=>{
    console.log("Server is working...");
})