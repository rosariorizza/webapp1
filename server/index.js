'use strict';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dao = require('./dao.js');
const userDao = require('./user-dao');
const {check, validationResult} = require('express-validator');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const dayjs = require('dayjs');

const app = new express();
const port = 3001;
app.use(morgan('dev'));
app.use(express.json());
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true
}
app.use(cors(corsOptions));

/*app.use((req, res, next) => {
  setTimeout(() => {
    next();
    console.log("this is the first message");
  }, 1000);
});*/

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await userDao.getUser(username, password);
  if(!user)
    return cb(null, false, 'Incorrect username or password.');
    
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

app.use(session({
  secret: "CMSMALL",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));




app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
      if (!user) {
        return res.status(401).json({ error: info});
      }
      req.login(user, (err) => {
        if (err)
          return next(err);
        
        return res.json(req.user);
      });
  })(req, res, next);
});


app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});


app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

app.get('/api/users', isLoggedIn, async (req, res) => {
  if (req.user.role !== "Admin"){
    return res.status(401).json({error : "User not authorized"});
  }
  try{
    const result = await userDao.getUsers();
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: `Database error during the creation of new page: ${err}` }); 
  }

});


app.get('/api/appName', async (req, res) =>{
  try{
    const result = await dao.getAppName();
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: `Database error during the creation of new page: ${err}` }); 
  }
})

app.post('/api/appName', isLoggedIn,   [
  check('name').isLength({min: 3, max:16}),
  ], async (req, res) =>{
  try{
    if (!validationResult(req).isEmpty()) {
      return res.status(422).json({ error: "Invalid values" }); 
    }
    if(req.user.role!=="Admin"){
      return res.status(401).json({error: 'User Not authenticated'});
    }
    const result = await dao.setAppName(req.body.name);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: `Database error during the creation of new page: ${err}` }); 
  }
})




app.get('/api/pages', 
  (req, res) => {
    dao.getAllPages()
      .then(pages => res.json(pages))
      .catch((err) => res.status(500).json(err)); 
    }
);
app.get('/api/pages/:id',
  [ check('id').isInt({min: 1}) ],
  async (req, res) => {
    try {
      if (!validationResult(req).isEmpty()) {
        return res.status(422).json({ error: "Invalid values" }); 
      }
      const result = await dao.getPage(req.params.id);
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      res.status(500).end();
    }
  }
);
app.post('/api/pages', isLoggedIn,
  [
    check('title').isLength({min: 1, max:160}),
    check('userId').isInt({min: 1}),
    check('contents').isArray(),
  ], 
  async (req, res) => {
    if (!validationResult(req).isEmpty()) {
      return res.status(422).json({ error: "Invalid values" }); 
    }
    if(req.body.publicationDate!='' && !dayjs(req.body.publicationDate).isValid()){
      return res.status(422).json({ error: "Page object not valid" }); 
    }
    if (req.user.role !== "Admin" && req.user.id !==req.body.userId){
      return res.status(401).json({error : "User not authorized"})
    }

    let header = false
    let other = false
    for (const c of req.body.contents) {
      if(!['header', 'paragraph', 'image'].includes(c.type) || !c.value || !Number.isInteger(c.position) || c.position<0){
        return res.status(422).json({error : "Content object not valid"});
      }
      if (c.type == "header") header = true;
      else other = true;
    }
    if (!(header && other)) return res.status(422).json({error : "The content of the page needs at least a header and another type of block"})


    const page = {
      title: req.body.title,
      creationDate: dayjs().toISOString(), 
      publicationDate: req.body.publicationDate!=''?dayjs(req.body.publicationDate).toISOString():null, 
      userId: req.body.userId,
    };

    try {
      const result = await dao.createPage(page);
      req.body.contents.forEach(async (c) => await dao.addContent(c, result));
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of new page: ${err}` }); 
    }
  }
);
app.patch('/api/pages/:id', isLoggedIn,
  [
    check('title').isLength({min: 1, max:160}),
    check('userId').isInt({min: 1}),
  ],
  async (req, res) => {
    if (!validationResult(req).isEmpty()) {
      return res.status(422).json({ error: "Invalid values" }); 
    }
    if(req.body.publicationDate!='' && !dayjs(req.body.publicationDate).isValid()){
      return res.status(422).json({ error: "Page object not valid" }); 
    }
    try {
      if (req.user.role !== "Admin"){
        const page = await dao.getPageUserId(req.params.id);
        if(!page.userId || req.user.id !== page.userId || req.user.id!== req.body.userId){
          return res.status(401).json({error : "User not authorized"});
        }
      }

      const page = {
        title: req.body.title,
        publicationDate: req.body.publicationDate!=''?dayjs(req.body.publicationDate).toISOString():null, 
        userId: req.body.userId,
      };
      const result = await dao.updatePage(page, req.params.id); 
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of new page: ${err}` }); 
    }
  }
);

app.delete('/api/pages/:id', isLoggedIn,
  [ check('id').isInt() ],
  async (req, res) => {
    try {
      if (!validationResult(req).isEmpty()) {
        return res.status(422).json({ error: "Invalid values" }); 
      }
      if (req.user.role !== "Admin"){
        const page = await dao.getPageUserId(req.params.id);
        if(!page.userId || req.user.id !== page.userId ){
          return res.status(401).json({error : "User not authorized"});
        }
      }
      await dao.deletePage(req.params.id);
      res.status(200).json({}); 
    } catch (err) {
      res.status(503).json({ error: `Database error during the deletion of film ${req.params.id}: ${err} ` });
    }
  }
);

app.post('/api/pages/:pageId/contents', isLoggedIn,
  [
    check('type').isString(),
    check('position').isInt({min: 0}),
    check('value').isString(),
  ], 
  async (req, res) => {
    if (!validationResult(req).isEmpty()) {
      return res.status(422).json({ error: "Invalid values" }); 
    }


    const page = await dao.getPageUserId(req.params.pageId);
    if(!page){
      return res.status(422).json({error : "Page not found"});

    }
    if (req.user.role !== "Admin"){
      if(!page.userId || req.user.id !== page.userId ){
        return res.status(401).json({error : "User not authorized"});
      }
    }

    const content = {
      type: req.body.type,
      value: req.body.value, 
      position: req.body.position
    };

    try {
      const result = await dao.addContent(content, req.params.pageId); 
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of new page: ${err}` }); 
    }
  }
);
app.put('/api/pages/:pageId/contents/:contentId', isLoggedIn,
  [
    check('type').isString(),
    check('position').isInt({min: 0}),
    check('value').isString(),
    check('contentId').isInt()
  ], 
  async (req, res) => {
    if (!validationResult(req).isEmpty()) {
      return res.status(422).json({ error: "Invalid values" }); 
    }

    try{
      const page = await dao.getPage(req.params.pageId);
      if(!page){
        return res.status(422).json({ error: 'Page not found' });
      }

      if (req.user.role !== "Admin" && page.userId!== req.user.id ){
        return res.status(401).json({error : "User not authorized"});
      }

      let oldContent = page.contents.filter(c => c.id == req.params.contentId);
      if(oldContent.length === 0){
        return res.status(422).json({ error: 'Content not found' });
      }
      oldContent = oldContent[0];

      const content = {
        type: req.body.type,
        value: req.body.value, 
        position: req.body.position
      };

      if(content.position != oldContent.position){
        if(content.position>page.contents.length-1 || content.position<0){
          return res.status(422).json({ error: 'Content object not valid' });
        }
        const result = await dao.updateContentPosition(page.id, req.params.contentId, content, oldContent.position); 
        res.json(result);
      }
      else{
        const result = await dao.updateContentPosition(page.id, req.params.contentId, content); 
        res.json(result);
      }


    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of new page: ${err}` }); 
    }
  }
);
app.delete('/api/pages/:pageId/contents/:contentId', isLoggedIn,
  [
    check('contentId').isInt()
  ], 
  async (req, res) => {
    if (!validationResult(req).isEmpty()) {
      return res.status(422).json({ error: "Invalid values" }); 
    }

    try{
      const page = await dao.getPage(req.params.pageId);
      if(!page){
        return res.status(422).json({ error: 'Page not found' });
      }

      if (req.user.role !== "Admin" && page.userId!== req.user.id ){
        return res.status(401).json({error : "User not authorized"});
      }

      let oldContent = null;
      let header = false
      let other = false
      for (const c of page.contents) {
        if(c.id == req.params.contentId){
          oldContent = c;
          continue;
        }
        if (c.type == "header") header = true;
        else other = true;
      }
      if (!(header && other)) return res.status(422).json({error : "The content of the page needs at least a header and another type of block"});
      if(oldContent == null) return res.status(422).json({error : "Content not found"});
      
      await dao.deleteContent(req.params.contentId, page.id, oldContent.position);
      res.status(200).json({}); 

    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of new page: ${err}` }); 
    }
  }
);


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
