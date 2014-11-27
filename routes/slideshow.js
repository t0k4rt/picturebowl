var express = require('express');


module.exports = function(app, io) {

  var router = express.Router();

  router.get('/:token', function(req, res) {
    res.render('live', {
      domain: 'localhost:3000',
      title: 'Slideshow',
      namespace: req.params.token
    });
  });

  return router;
};