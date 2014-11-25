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


  /*ig.use({
    client_id: app.get('CLIENT_ID'),
    client_secret:  app.get('CLIENT_SECRET')
  });

  router.get('/', function(req, res) {
    res.redirect(ig.get_authorization_url(redirect_uri, { scope: ['basic'] }));
  });
*/

  /*router.get('/redirect', function(req, res) {
    ig.authorize_user(req.query.code, redirect_uri, function(err, result) {
      if (err) {
        console.log(err.body);
        res.send("Didn't work");
      } else {
        console.log('Yay! Access token is ' + result.access_token);
        redis.set('accesstoken', result.access_token);
        console.log(result);
        res.send('You made it!!' + result.access_token);
      }
    });
  });*/

  return router;
};
