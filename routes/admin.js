var express = require('express');
var ig = require('instagram-node').instagram();


var redirect_uri = 'http://klerg.herokuapp.com/auth/redirect';
var auth_token = '191558.94c4608.9af8927420d24e24ad25d0b85ed98f6f';

module.exports = function(app, redis) {
  
  var router = express.Router();

  router.get('/', function(req, res) {
    res.render('admin/tagadmin', {
      domain:   'localhost:3000',
      title:    'Sélectionnez un tag'
    });
  });

  router.post('/tag', function(req, res) {
    var tag = req.body.tag;
    console.log(tag);
    if(typeof tag == "undefined") {
      res.status(400).json({error: 'tag is mandatory'});
    }
    else {
      Q.fcall(function () {return true;})
        .then(function(){
          var deferred = Q.defer();
          pictureStore.get('auth_token', function(err, reply) {
            if(err)
              deferred.reject(new Error(err));
            else if(reply == null){
              deferred.resolve(auth_token);
              //deferred.reject(new Error('There is no auth token available'));
            }
            else {
              deferred.resolve(reply);
            }
          });

          return deferred.promise;
        })
        .then(function(token){
          var deferred = Q.defer();
          ig.use({
            client_id: app.get('CLIENT_ID'),
            client_secret:  app.get('CLIENT_SECRET'),
            access_token:  token
          });

          ig.add_tag_subscription(tag, 'http://klerg.herokuapp.com/instagram', function(err, result, remaining, limit){
            if(err)
              deferred.reject(new Error(err));
            deferred.resolve(result);
          });
          return deferred.promise;
        }).then(function(){
          var deferred = Q.defer();
          redis.set('tag', tag,function(err, result){
            if(err)
              deferred.reject(new Error(err));
            deferred.resolve(result);
          });
          return deferred.promise;
        }).catch(function(error){
          res.status(400).json({error: error});
        }).done(function() {
          res.status(200).json({result: 'ok'});
        });
    }
  });


  router.post('/unsubscribe', function(req, res) {

    Q.fcall(function () {return true;})
      .then(function(){
        var deferred = Q.defer();
        pictureStore.get('auth_token', function(err, reply) {
          if(err)
            deferred.reject(new Error(err));
          else if(reply == null){
            deferred.resolve(auth_token);
            //deferred.reject(new Error('There is no auth token available'));
          }
          else {
            deferred.resolve(reply);
          }
        });

        return deferred.promise;
      })
      .then(function(token){
        var deferred = Q.defer();
        ig.use({
          client_id: app.get('CLIENT_ID'),
          client_secret:  app.get('CLIENT_SECRET'),
          access_token:  token
        });

        ig.del_subscription(function(err,subscriptions,limit){
          if(err)
            deferred.reject(new Error(err));
          deferred.resolve(subscriptions);
        });
        return deferred.promise;
      }).catch(function(error){
        res.status(400).json({error: error});
      }).done(function() {
        res.status(200).json({result: 'ok'});
      });

  });

  return router;
};
