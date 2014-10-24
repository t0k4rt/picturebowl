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

  router.get('/', function(req, res) {
    if(req.query['hub.challenge'])
      res.send(req.query['hub.challenge']);
    else {
      res.status(400).send('hub.challenge is missing');
    }
  });

  router.post('/', function(req, res) {

    Q.npost(pictureStore, 'get', ['auth_token'])
      .then(function(token){
        if(token == null) {
          token = auth_token;
        }
        var mainDeferred = Q.defer();

        Q.npost(pictureStore, 'get', ['tag'])
          .then(function(tag){
            var deferred = Q.defer();
            ig.use({
              client_id: app.get('CLIENT_ID'),
              client_secret:  app.get('CLIENT_SECRET'),
              access_token:  token
            });

            ig.tag_media_recent(tag, function(err, medias, pagination, remaining, limit) {
              if(err)
                deferred.reject(new Error(err));
              deferred.resolve(medias);
            });
            return deferred.promise;
          }).catch(function(err){
            mainDeferred.reject(new Error(err));
          }).done(function(medias){
            mainDeferred.resolve(medias);
          });

        return mainDeferred.promise;
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
      })
      .done(function(result){
        res.send('ok');
      }, function(err) {
        res.status(400).send(err.toString());
      });
  });


  router.get('/test', function(req, res) {

    Q.npost(pictureStore, 'get', ['auth_token'])
      .then(function(token){
        if(token == null) {
          token = auth_token;
        }
        var mainDeferred = Q.defer();

        Q.npost(pictureStore, 'get', ['tag'])
          .then(function(tag){
            var deferred = Q.defer();
            ig.use({
              client_id: app.get('CLIENT_ID'),
              client_secret:  app.get('CLIENT_SECRET'),
              access_token:  token
            });

            ig.tag_media_recent(tag, function(err, medias, pagination, remaining, limit) {
              if(err)
                deferred.reject(new Error(err));
              deferred.resolve(medias);
            });
            return deferred.promise;
          }).catch(function(err){
            mainDeferred.reject(new Error(err));
          }).done(function(medias){
            mainDeferred.resolve(medias);
          });

        return mainDeferred.promise;
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
      })
      .done(function(result){
        res.send('ok');
      }, function(err) {
        res.status(400).send(err.toString());
      });
  });


  router.get('/reboot', function(req, res) {
    Q.npost(pictureStore, 'del', ['medialist'])
      .then(function(){
        return Q.npost(pictureStore, 'get', ['auth_token']);
      }).then(function(token){
        if(token == null) {
          token = auth_token;
        }
        var mainDeferred = Q.defer();

        Q.npost(pictureStore, 'get', ['tag'])
          .then(function(tag){
            var deferred = Q.defer();
            ig.use({
              client_id: app.get('CLIENT_ID'),
              client_secret:  app.get('CLIENT_SECRET'),
              access_token:  token
            });

            ig.tag_media_recent(tag, function(err, medias, pagination, remaining, limit) {
              if(err)
                deferred.reject(new Error(err));
              deferred.resolve(medias);
            });
            return deferred.promise;
          }).catch(function(err){
            mainDeferred.reject(new Error(err));
          }).done(function(medias){
            mainDeferred.resolve(medias);
          });

        return mainDeferred.promise;
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
      })
      .done(function(result){
        res.json({status: 'ok'});
      }, function(err) {
        res.status(400).json({error: err.toString()});
      });
  });

  return router;
};


