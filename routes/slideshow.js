var express = require('express');


module.exports = function(app) {

  var router = express.Router();

  router.get('/:token', function(req, res) {
    res.render('live', {
      domain: 'localhost:3000',
      title: 'Slideshow',
      channel: req.params.token
    });
  });

  return router;
};