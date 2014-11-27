var express = require('express')
  , Q = require('q')
  , ig = require('instagram-node').instagram();


var redirect_uri = 'http://klerg.herokuapp.com/auth/redirect';

module.exports = function(app, store, sub) {
  
  var router = express.Router();

  router.get('/', function(req, res) {
    res.render('admin/tagadmin', {
      domain:   'localhost:3000',
      title:    'Sélectionnez un tag',
      channel:  req.user.id
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

        ig.add_tag_subscription(req.body.tag, 'http://klerg.herokuapp.com/instagram', function(err, result, remaining, limit){
          if(err)
            deferred.reject(new Error(err));
          console.log(result);
          deferred.resolve(result);
        });
        return deferred.promise;
      })
        .then(function(subscription){
          var promises = [
            Q.npost(sub, 'subscribe', [req.user.id]),
            Q.npost(store, 'hmset', ['subscription:'+subscription.id, 'channel', req.user.id, 'userId', 'user:ig:'+req.user.id, 'tag', subscription.object_id]),
            Q.npost(store, 'set', ['user:subscription:'+req.user.id, subscription.id])
          ];
          return Q.allSettled(promises);
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
      return Q.npost(store, 'get', ['user:subscription:'+req.user.id]);
    })
      .then(function(subscriptionId){
        var deferred = Q.defer();
        ig.use({
          client_id: app.get('CLIENT_ID'),
          client_secret:  app.get('CLIENT_SECRET')
        });

        ig.del_subscription({ id: subscriptionId }, function(err,subscriptions,limit){
          if(err)
            deferred.reject(new Error(err));
          console.log(subscriptions);
          deferred.resolve(subscriptionId);
        });
        return deferred.promise;
    })
      .then(function(subscriptionId){

        var promises = [
          Q.npost(sub, 'unsubscribe', [req.user.id]),
          Q.npost(store, 'del', ['subscription:'+subscriptionId]),
          Q.npost(store, 'del', ['user:subscription:'+req.user.id])
        ];
        return Q.allSettled(promises);
      })
      .done(function(result) {
        res.status(200).json({result: 'ok'});
      }, function(err){
        res.status(400).json({error: JSON.stringify(err)});
      });
  });

  return router;
};
