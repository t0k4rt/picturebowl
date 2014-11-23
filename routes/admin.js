var express = require('express')
  , Q = require('q')
  , ig = require('instagram-node').instagram();


var redirect_uri = 'http://klerg.herokuapp.com/auth/redirect';

module.exports = function(app, pictureStore) {
  
  var router = express.Router();

  router.get('/', function(req, res) {
    res.render('admin/tagadmin', {
      domain:   'localhost:3000',
      title:    'Sélectionnez un tag'
    });
  });

  router.post('/tag', function(req, res) {
    var tag = req.body.tag;
    if(typeof tag == "undefined") {
      res.status(400).json({error: 'tag is mandatory'});
    }
    else {
      Q.fcall(function () {
        var deferred = Q.defer();
        ig.use({
          client_id: app.get('CLIENT_ID'),
          client_secret:  app.get('CLIENT_SECRET')
        });

        ig.add_tag_subscription(tag, 'http://klerg.herokuapp.com/instagram', function(err, result, remaining, limit){
          if(err)
            deferred.reject(new Error(err));
          deferred.resolve(result);
        });
        return deferred.promise;
      })
        .then(function(subscription){
          return Q.npost(store, 'hset', ['subscription:'+subscription.id, {channel: req.user.id, user: req.user.id, tag: subscription.tag}]);
        })
        .done(function(result) {
          res.status(200).json({result: 'ok'});
        }, function(err){
          console.error(err);
          res.status(400).json({error: err.toString()});
        });
    }
  });


  router.get('/unsubscribe', function(req, res) {
    Q.fcall(function () {
      return Q.npost(pictureStore, 'get', ['subscription:'+req.user.id]);
    })
      .then(function(subscriptionId){
        var deferred = Q.defer();
        ig.use({
          client_id: app.get('CLIENT_ID'),
          client_secret:  app.get('CLIENT_SECRET')
        });

        //todo check syntax here
        ig.del_subscription({ subscriptionId: subscriptionId }, function(err,subscriptions,limit){
          if(err)
            deferred.reject(new Error(err));
          deferred.resolve(subscriptionId);
        });
        return deferred.promise;
    })
      .then(function(subscriptionId){
        return Q.npost(store, 'hrem', ['subscription:'+subscriptionId]);
      })
      .done(function(result) {
        res.status(200).json({result: 'ok'});
      }, function(err){
        res.status(400).json({error: JSON.stringify(err)});
      });
  });

  return router;
};
