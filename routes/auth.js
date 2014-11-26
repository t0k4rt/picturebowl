var express = require('express');
var ig = require('instagram-node').instagram();


var redirect_uri = 'http://klerg.herokuapp.com/auth/redirect';



module.exports = function(app, passport) {


  var router = express.Router();

  router.get('/instagram', passport.authenticate('instagram'), function(req, res){});

  router.get('/redirect', passport.authenticate('instagram', { failureRedirect: '/login' }), function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
  });
  return router;
};
