var express = require('express');
var ig = require('instagram-node').instagram();


var redirect_uri = 'http://klerg.herokuapp.com/auth/redirect';



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
      redis.set('tag', tag,function(err, result){
        if(err)
          res.status(400).json({error: err});
        res.status(200).json({result: 'ok'});
      });
    }
  });

  router.post('/redirect', function(req, res) {
    redis.set('tag', function(err, res){
      if(err)
        console.error(res);
      res.render('admin/tagadmin', {
        error:    err,
        domain:   'localhost:3000',
        title:    'coucou'
      });
    });
  });

  return router;
};
