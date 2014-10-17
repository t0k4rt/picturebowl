var express = require('express');


module.exports = function(app, io) {

  var router = express.Router();

  router.get('/', function(req, res) {
    res.render('live', {
      domain: 'localhost:3000',
      title: 'coucou'
    });
  });

  return router;
};