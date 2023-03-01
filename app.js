require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const encrypt = require("mongoose-encryption");
// const SHA512 = require("crypto-js/sha512");
// const bcrypt = require("bcrypt");
// const saltRounds = 11;

const app = express();

app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

/* FOR ENCRYPTION
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });
*/

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/secrets", (req, res) => {
  // The below line was added so we can't display the "/secrets" page
  // after we logged out using the "back" button of the browser, which
  // would normally display the browser cache and thus expose the
  // "/secrets" page we want to protect.
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0"
  );
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post(
    passport.authenticate("local", {
      successRedirect: "/secrets",
      failureRedirect: "/login",
    })
  );

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res, next) => {
    const { username, password } = req.body;
    // the below line is likely breaking register functionality due to
    // Mongoose 7 preventing Query.prototype.exec() from accepting callbacks
    User.register({ username: username }, password, (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.redirect("/secrets");
        });
      }
    });
  });
//   );
// });

/* FOR HASHING AND SALTING AND USING BCRYPT!
// app
//   .route("/login")
//   .get((req, res) => {
//     res.render("login");
//   })
//   .post((req, res) => {
//     const userInput = req.body.username;
//     User.findOne({ email: userInput })
//       .then((foundUser) => {
//         bcrypt.compare(req.body.password, foundUser.password, (req, result) => {
//           if (result === true) {
//             res.render("secrets");
//           } else {
//             res.send("Password is incorrect.");
//           }
//         });
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   });

// app
//   .route("/register")
//   .get((req, res) => {
//     res.render("register");
//   })
//   .post((req, res) => {
//     bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
//       const newUser = new User({
//         email: req.body.username,
//         password: hash,
//       });
//       newUser
//         .save()
//         .then(() => {
//           res.render("secrets");
//         })
//         .catch((err) => {
//           console.log(err);
//         });
//     });
//   });
*/

/* FOR HASHING BUT NOT SALTING
// app
//   .route("/login")
//   .get((req, res) => {
//     res.render("login");
//   })
//   .post((req, res) => {
//     const userInput = req.body.username;
//     const userPassword = SHA512(req.body.password).toString();

//     User.findOne({ email: userInput })
//       .then((foundUser) => {
//         if (foundUser.password === userPassword) {
//           res.render("secrets");
//         } else {
//           res.send("Password is incorrect.");
//         }
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   });

// app
//   .route("/register")
//   .get((req, res) => {
//     res.render("register");
//   })
//   .post((req, res) => {
//     const newUser = new User({
//       email: req.body.username,
//       password: SHA512(req.body.password).toString(),
//     });
//     newUser
//       .save()
//       .then(() => {
//         res.render("secrets");
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   });
*/

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
