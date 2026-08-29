const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const User = require('../models/User');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'smart_cafeteria_super_secret_change_this_in_production_2026',
};

passport.use(
  new JwtStrategy(options, async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.id).select('-password');

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

module.exports = passport;
