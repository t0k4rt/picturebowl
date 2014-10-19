var express = require('express')
  , Q = require('q')
  , ig = require('instagram-node').instagram()
  , emoji = require('emoji');

var auth_token = '191558.94c4608.9af8927420d24e24ad25d0b85ed98f6f';

module.exports = function(app, pictureStore, pictureEmitter) {
  var router = express.Router();

  var checkMedia = function checkMedia(media) {
    var deferred = Q.defer();
    pictureStore.sismember('medialist', media.id, function(err, res){
      if(err)
        deferred.reject(new Error(err));

      if(res == 0) {
        var mediaResult = {id: media.id};
        if(media.images.standard_resolution)
          mediaResult.src = media.images.standard_resolution;
        else
          return;

        if(media.caption)
          mediaResult.caption = emoji.unifiedToHTML(media.caption.text);

        pictureStore.sadd('medialist', media.id, function(err, res){
          if (err)
            deferred.reject(new Error(err));
          deferred.resolve(mediaResult);
        });
      }
      else
        deferred.reject('Media alreday sent');
    });

    return deferred.promise;
  };


  router.get('/test', function(req, res) {
    pictureEmitter.publish('sio', JSON.stringify({coucou: 'lemonde'}));
    res.send('ok');
  });

  router.get('/', function(req, res) {

    Q.fcall(function () {return;})
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

        ig.tag_media_recent('claire', function(err, medias, pagination, remaining, limit) {
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

        return Q.allSettled(promises);
      })
      .then(function(mediaResult){

        var result = [];
        mediaResult.forEach(function(elt){
          if(elt.state == 'fulfilled')
            result.push(elt.value);
        });

        if(result.length > 0)
          pictureEmitter.publish('sio', JSON.stringify(result));

        console.log(result);
      })
      .fail(function(err){
        console.log(err);
      })
      .done(function(result){
        res.send('ok');
      });
  });


  return router;
};


