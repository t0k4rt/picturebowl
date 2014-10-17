var express = require('express')
  , Q = require('q')
  , ig = require('instagram-node').instagram();

//auth token:  191558.94c4608.9af8927420d24e24ad25d0b85ed98f6f

module.exports = function(app, redis) {
  var router = express.Router();

  var checkMedia = function checkMedia(media) {
    var deferred = Q.defer();
    redis.sismember('medialist', media.id, function(err, res){
      if(err)
        deferred.reject(new Error(err));
      else {
        var mediaResult = {id: media.id};
        if(media.images.standard_resolution)
          mediaResult.url = media.images.standard_resolution;
        else
          return;

        if(media.caption)
          mediaResult.caption = media.caption.text;

        redis.sadd('medialist', media.id, function(err, res){
          if (err)
            deferred.reject(new Error(err));
          deferred.resolve(mediaResult);
        });
      }
    });

    return deferred.promise;
  };


  router.get('/test', function(req, res) {
    redis.publish('sio', {coucou: 'lemonde'});
    res.send('ok');
  });

  router.get('/', function(req, res) {

    Q.fcall(function () {return redis;})
      .then(function(redis){
        var deferred = Q.defer();
        redis.get('auth_token', function(err, reply) {
          if(err)
            deferred.reject(new Error(err));
          else if(reply == null)
            deferred.reject(new Error('There is no auth token available'));

          deferred.resolve(reply);
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

        ig.tag_media_recent('tag', function(err, medias, pagination, remaining, limit) {
          if(err)
            deferred.reject(new Error(err));
          deferred.resolve(medias);
        });
        return deferred.promise;
      })
      .then(function(medias) {

        var promises = [];
        medias.forEach(function(media) {
          promises.push(checkMedia(media));
        });

        return Q.all([
          promises
        ]);
      })
      .then(function(mediaResult){
        redis.publish('sio', mediaResult);
      })
      .fail(function(err){
        console.log(err);
      })
      .done(function(){
        res.send('ok');
      });
  });


  return router;
};


