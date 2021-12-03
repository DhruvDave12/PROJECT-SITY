if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const { v4: uuid } = require('uuid');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');
const session = require('express-session');
const userDets = require('./models/userdetails.js');
const Worker = require('./models/worker.js');
const workerDetails = require('./models/workerDetails.js');
const Tasks = require('./models/tasks.js');

// Cloudinary
const {cloudinary} = require('./cloudinary/index.js');
const multer = require('multer');
const {storage} = require('./cloudinary/index.js');
const upload = multer({storage});


mongoose.connect('mongodb://localhost:27017/sity');
// logic to check if database connected
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection Error: "));
db.once("open", () => {
    console.log("DATABASE CONNECTED");
});

var indexx = 0;

// use stuff
app.use(express.urlencoded({ extended: true }));
// app.use(express.static());a
app.use(methodOverride('_method'));
// for bootstrap
app.use(express.static(path.join(__dirname, 'public')));
// set stuff
app.set('view engine', 'views');
app.set('views', path.join(__dirname, 'views'));

// Serving sessions
const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,

    // Fancier Options for cookies like setting an expiration date.
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))


// Passport Usage
app.use(passport.initialize());
app.use(passport.session()); // REMEMBER app.use(session) must come before passport.session.
// this below line tells that we will be using a local strategy
passport.use('user-local',new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); // serializing the user in session
passport.deserializeUser(User.deserializeUser()); // deserializing the user out of the session.

passport.use(new LocalStrategy(Worker.authenticate()));
passport.serializeUser(Worker.serializeUser()); // serializing the user in session
passport.deserializeUser(Worker.deserializeUser()); // deserializing the user out of the session.

// set admin context and others things like admin templates
app.use('/homepage/worker/*', function adminContext(req, res, next) {
    // set admin context
    req.isAdmin = true;
  
    next();
  });
  
  
  // then get roles for authenticated user in your passport stategy:
  app.use(function getUserRoles(req, res, next) {
    req.userRoleNames = [];
  
    if (req.isAuthenticated()) {
      req.userRoleNames.push('authenticated');
    } else {
      req.userRoleNames.push('unAuthenticated');
      return next(); // skip role load if dont are authenticated
    }
  
    // get user roles, you may get roles from DB ...
    // and if are admin add its role
    req.userRoleNames.push('administrator');
  
    next();
  
  });

app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    res.locals.currentWorker = req.isAdmin;
    next();
})
app.get('/', (req,res) => {
    res.render('home.ejs');
})
app.get('/aboutUs', (req,res) => {
    res.render('aboutUs.ejs');
})
app.get('/shop', (req,res) => {
    res.render('shopIndex.ejs');
})
// SIGNUP ROUTE
app.get('/signup', async (req, res) => {
    res.render('customerSignup.ejs');
})

app.post('/signup', async (req, res) => {
    try {
        const { email, address, password, username } = req.body;

        const user = new User({
            email,
            username,
            address
        });
        // We will be here creating a user in our database
        const userDetails = new userDets({
            username, address
        })

        await userDetails.save();

        const registeredUser = await User.register(user, password);

        req.logIn(registeredUser, err => {
            if (err) {
                console.log(err);
            }
            else {
                res.redirect(`/homepage/${userDetails._id}`);
            }
        })
    } catch (err) {
        console.log(err);
        res.redirect('/signup');
    }

})

// Worker Signup
app.get('/workerSignup', (req, res) => {
    res.render('workerSignup.ejs');
})

app.post('/workerSignup', async (req, res) => {
    const { username, password, email, address, typeOfWork, contact } = req.body;

    const worker = new Worker({
        username,
        email,
        address,
        typeOfWork,
    });
    const workerDets = new workerDetails({
        username,
        email,
        address,
        typeOfWork,
        contact,
    });

    await workerDets.save();

    const registeredWorker = await Worker.register(worker, password);

    req.logIn(registeredWorker, err => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect(`/homepage/worker/${workerDets._id}`);
        }
    })


})

// LOGIN ROUTE
app.get('/login', (req, res) => {
    res.render('customerLogin.ejs');
})


app.post('/login', passport.authenticate('user-local', { failureFlash: false, failureRedirect: '/login' }), async (req, res) => {
    const { username } = req.body;
    const user = await userDets.findOne({ username: username });


    res.redirect(`/homepage/${user._id}`);
})

// worker login
app.get('/workerlogin', (req, res) => {
    res.render('workerLogin.ejs');
})

app.post('/workerlogin', passport.authorize('local', { failureFlash: false, failureRedirect: '/workerlogin' }), async (req, res) => {
    const { username } = req.body;
    const worker = await workerDetails.findOne({ username: username });

    res.redirect(`/homepage/worker/${worker._id}`);
})


// Homepage routes
app.get('/homepage/:id', async (req, res) => {
    const user = await userDets.findById(req.params.id);
    const taskFinder = await Tasks.find({owner: user._id});
   
    res.render('customerHomePage.ejs', { user, taskFinder});
})

app.get('/homepage/worker/:id', async (req, res) => {
    const worker = await workerDetails.findById(req.params.id);
    // Now we have the tasks so we will show the matching work....
    const work = worker.typeOfWork;
    const data = await Tasks.find({task: work}).populate('owner');
    res.render('workerHomepage.ejs', { worker, data});
})


// TASK FORM RENDERING
app.get('/taskform/:id', (req,res) => {
    const{id} = req.params;
    res.render('workForm.ejs', {id});
})

app.post('/taskform/:id', upload.array('image'),async (req,res) => {
    const {addToClean, workType} = req.body;
    const{id} = req.params;
    const newTask = new Tasks({
        address: addToClean,
        task: workType,
    })
    newTask.images = req.files.map(f => ({url: f.path, fileName: f.filename}));
    newTask.owner = id;
    newTask.contactNumber = indexx++;

    await newTask.save();
    // res.send(req.body, req.files);
    res.redirect(`/homepage/${id}`);
})

// Price page
app.get('/worker/:id/price/:tid', async (req,res) => {
    const {id, tid} = req.params;
    const workers = await workerDetails.findById(id)
    const task = await Tasks.findById(tid);
    res.render('pricePage.ejs', {workers, task});
})

app.post('/customer/:id/tasks/:tid', async (req,res) => {
    const {price, contact, name} = req.body;
    const{tid} = req.params;
    const task = await Tasks.findById(tid);
    task.price = price;
    task.workerName = name;
    task.contactNumber = contact;
    task.date = new Date().toISOString().slice(0, 10);
    await task.save();
    res.redirect(`/homepage/worker/${req.params.id}`);
})

// deleting requests
app.delete('/task/:tid/deletetask', async(req,res)=>{
    const {tid} = req.params;
    const findTask = await Tasks.findById(tid);
    const task = await Tasks.findByIdAndDelete(tid);
    res.redirect(`/homepage/${findTask.owner}`);
})

app.get('/accept/:tid', async(req,res) => {
    const task = await Tasks.findById(req.params.tid);
    task.status = "Accepted";
    await task.save();

    res.render('acceptpage.ejs', { task });
})

app.get('/status/:tid/:wid', async(req,res)=> {
    const {wid} = req.params;
    const task = await Tasks.findById(req.params.tid);
    const user = await userDets.findById(task.owner);

    res.render('status.ejs', {task, user, wid});
})
app.get('/logout', (req,res) => {
    req.logout();
    res.redirect('/');
})

app.get('/workerlogout', (req,res) => {
    req.logout();
    res.redirect('/');
})


app.get('/oldtasks/:uid', async(req,res) => {
    const {uid} = req.params;
    const user = await userDets.findById(uid);
    const oldTask = await Tasks.find({owner: uid});
    res.render('oldTasks.ejs', {oldTask, user});
})



app.listen(8080, (req, res) => {
    console.log("LISTENING TO PORT 8080!!");
})
