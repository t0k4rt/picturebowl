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
      Q.fcall(function () {return true;})
        .then(function(token){
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
        .then(function(){
          return Q.npost(pictureStore, 'set', ['tag', tag]);
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
    Q.fcall(function () {return true;})
      .then(function(){
        var deferred = Q.defer();
        ig.use({
          client_id: app.get('CLIENT_ID'),
          client_secret:  app.get('CLIENT_SECRET')
        });

        ig.del_subscription({ all: true }, function(err,subscriptions,limit){
          if(err)
            deferred.reject(new Error(err));
          deferred.resolve('coco');
        });
        return deferred.promise;
      }).done(function(result) {
        res.status(200).json({result: 'ok'});
      }, function(err){
        res.status(400).json({error: JSON.stringify(err)});
      });
  });

  return router;
};
