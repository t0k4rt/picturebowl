var express = require('express')
  , Q = require('q')
  , ig = require('instagram-node').instagram()
  , emoji = require('emoji');


module.exports = function(app, store, pub) {
  var router = express.Router();

  /**
   * function used to check if medias has already been sent
   * todo: we could use expiring keys
   * @param media
   * @param user
   * @returns {defer.promise|*|promise|Q.promise}
   */
  var checkMedia = function checkMedia(media, user) {
    return Q.npost(store, 'sismember', ['medialist:'+user.id, media.id])
      .then(function(result){
        var deferred = Q.defer();
        if(result == 0) {
          Q.npost(store, 'sadd', ['medialist:'+user.id, media.id])
            .then(function(){
              var mediaResult = {id: media.id};
              if(media.images.standard_resolution)
                mediaResult.src = media.images.standard_resolution;

              if(media.caption)
                mediaResult.caption = emoji.unifiedToHTML(media.caption.text);

              deferred.resolve(mediaResult);
            });
        }
        else
          deferred.reject('Media alreaday sent');

        return deferred.promise;
      });
  };


  var manageSubscription = function manageSubscription(subscriptionId, pub) {
    var subscription;
    var user;
    // first we get the subscription from id
    return Q.npost(store, 'hgetall', ['subscription:'+subscriptionId])
      // we get the user (to retreive access token
      .then(function(_subscription){
        if(_subscription == null)
          throw new Error('there is no such subscriptio in database');

        // we save subscription in a temp variable
        subscription = _subscription;
        return Q.npost(store, 'hgetall', [subscription.userId])
      })
      .then(function(_user){
        if(_user == null)
          throw new Error('there is no such user in database');
        user = _user;

        var deferred = Q.defer();

        ig.use({
          client_id: app.get('CLIENT_ID'),
          client_secret:  app.get('CLIENT_SECRET'),
          access_token:  user.accessToken
        });

        // we retrieve the new photos
        ig.tag_media_recent(subscription.tag, function(err, medias, pagination, remaining, limit) {
          if(err)
            deferred.reject(new Error(err));
          deferred.resolve(medias);

        });

        return deferred.promise;
      })
      // we filter the result to avoid to send again medias
      .then(function(medias) {
        var promises2 = [];
        medias.forEach(function(media) {
          promises2.push(
            checkMedia(media, user)
          );
        });
        return Q.allSettled(promises2);
      })
      // we publish fulfilled promises to the right channel
      .then(function(mediaResult){
        var result = [];
        mediaResult.forEach(function(elt){
          if(elt.state == 'fulfilled')
            result.push(elt.value);
        });
        console.log('check media result : ', result);

        if(result.length > 0){
          console.log('publish : ', result);
          console.log('to channel :  ', subscription.channel);
          pub.publish(subscription.channel, JSON.stringify(result));
        }
      });
    };



  router.get('/', function(req, res) {
    if(req.query['hub.challenge'])
      res.send(req.query['hub.challenge']);
    else {
      res.status(400).send('hub.challenge is missing');
    }
  });



  router.post('/', function(req, res) {
    //console.log('got notification : ', req.body);
    // we have to get the user id from the subscription id we receive
    // then we get tag and channell from database
    Q.fcall(function(){
      // we get channel, tag and user id from subscriptio id
      // since when instagram send a post for a given tag, the subscription id should be provided
      var promises = [];

      req.body.forEach(function(elt) {
        promises.push(manageSubscription(elt.subscription_id));
      });

      return Q.allSettled(promises);
    })
      .done(function(result){
        res.send('ok');
      }, function(err) {
        res.status(400).send(err.toString());
      });
  });


  router.get('/reboot', function(req, res) {
    // delete all tiems in medialist for a given user
    Q.npost(pictureStore, 'del', ['medialist:'+req.user.id])
      // then get media for th given user tag
      .then(function(){
        var deferred = Q.defer();
        ig.use({
          client_id: app.get('CLIENT_ID'),
          client_secret:  app.get('CLIENT_SECRET'),
          access_token:  req.user.accessToken
        });

        ig.tag_media_recent(tag, function(err, medias, pagination, remaining, limit) {
          if(err)
            deferred.reject(new Error(err));
          deferred.resolve(medias);
        });
        return deferred.promise;

      })
      // we directly send these medias to the pub/sub channel
      .then(function(mediaResult){
        var result = [];
        mediaResult.forEach(function(elt){
          if(elt.state == 'fulfilled')
            result.push(elt.value);
        });

        if(result.length > 0)
          pub.publish(req.user.id, JSON.stringify(result));
      })
      .done(function(result){
        res.json({status: 'ok'});
      }, function(err) {
        res.status(400).json({error: err.toString()});
      });
  });

  return router;
};


