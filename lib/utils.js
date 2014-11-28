/**
 * Created by alexandre on 28/11/14.
 */

module.exports = {

  ensureAuthenticated: function(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
      return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
  },

  ensureApiAuthenticated: function(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
      return next();

    // if they aren't redirect them to the home page
    res.status(400).json({error: 'your are not authenticated, please login'});
  }

};


