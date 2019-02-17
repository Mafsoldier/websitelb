// require the needed dependencies
require('dotenv').config();

var express = require('express')
var bodyParser = require('body-parser')
const ejs = require("ejs");
const mongoose = require('mongoose');

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
  extended: true
}));

const secret = process.env.SECRET;

app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

const dbPassword = process.env.DBPASSWORD;


mongoose.connect("mongodb+srv://admin-marc:" +dbPassword + "@cluster0-mom6u.mongodb.net/websiteLB", {
  useNewUrlParser: true
});
mongoose.set('useCreateIndex', true)


const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const agendaSchema = {
  titel: String,
  datum: String,
  inhoud: String
};

const AgendaPunt = mongoose.model('Agenda', agendaSchema);

const nieuwsSchema = {
  titel: String,
  datum: String,
  inhoud: String,
  afbeelding: String
};

const NieuwsPunt = mongoose.model('Nieuwsbericht', nieuwsSchema);



// get the home route
app.get('/', function(req, res) {
  res.render('index');
});

app.get('/contact', function(req, res) {
  res.render('contact');
});

app.get('/diensten', function(req, res) {
  res.render('diensten');
});


app.get('/nieuws', function(req, res) {
  NieuwsPunt.find({}, function(err, nieuwsberichts) {

    res.render('nieuws', {
      nieuwsberichts: nieuwsberichts
    });
  });
});

app.get('/verkoop', function(req, res) {
  res.render('verkoop');
});

app.get('/agenda', function(req, res) {
  AgendaPunt.find({}, function(err, agendas) {



    res.render('agenda', {
      agendas: agendas
    });
  });
});

app.get("/login", function(req, res) {
  res.render("login")
});

app.get("/register", function(req, res) {
  res.render("register")
});

app.get("/compose", function(req, res) {
  if (req.isAuthenticated()) {
    AgendaPunt.find({}, function(err, agendas) {
      NieuwsPunt.find({}, function(err, nieuwsberichts) {

        res.render("compose", {
          agendas: agendas,
          nieuwsberichts: nieuwsberichts

        });
      });
    });
  } else {
    res.redirect("login");
  }
});

app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {

    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");

      });
    }
  });
});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });



  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function() {
        AgendaPunt.find({}, function(err, agendas) {
          NieuwsPunt.find({}, function(err, nieuwsberichts) {

            res.render("compose", {
              agendas: agendas,
              nieuwsberichts: nieuwsberichts

            });
          });
        });
      });
    }
  });
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.post('/compose', function(req, res) {
  const agendaPunt = new AgendaPunt({

    titel: req.body.agendaTitle,
    datum: req.body.agendaDatum,
    inhoud: req.body.agendaInput
  });

  agendaPunt.save(function(err) {
    if (!err) {
      res.redirect("/compose");
    }
  });
});

app.post('/compose2', function(req, res) {

  const nieuwsPunt = new NieuwsPunt({

    titel: req.body.nieuwsTitle,
    datum: req.body.nieuwsDatum,
    inhoud: req.body.nieuwsInput,
    afbeelding: req.body.nieuwsAfbeelding
  });

  nieuwsPunt.save(function(err) {
    if (!err) {
      res.redirect("/compose");
    }
  });
});

app.post("/composeDeleteAgenda", function(req, res) {
  const agendaId = req.body.agendaId;

  AgendaPunt.findOneAndDelete({
    _id: agendaId
  }, function(err) {
    if (!err) {
      console.log("Succeeded!!!");
      res.redirect("/compose");
    } else {
      console.log("404, couldn't delete the item.")
      res.redirect("/");
    }
  });
});

app.post("/composeDeleteNieuws", function(req, res) {
  const nieuwsId = req.body.nieuwsId;

  NieuwsPunt.findOneAndDelete({
    _id: nieuwsId
  }, function(err) {
    if (!err) {
      console.log("Succeeded!!!");
      res.redirect("/compose");
    } else {
      console.log("404, couldn't delete the item.")
      res.redirect("/");
    }
  });
});

// listen to port.

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
};

app.listen(port, function(){
  console.log("Server has started.");
});
