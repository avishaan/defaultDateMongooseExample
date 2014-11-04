var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/testDefaultValue');


/*
|-------------------------------------------------------------
| User Schema
|-------------------------------------------------------------
*/

var userSchema = new mongoose.Schema({
  phone: { type: String },
  messages: [{ //this is every single message, reading or interaction with the service
    time: { type: Date },
    body: { type: String }
  }],
  measurements: [{ // all the messages for successful readings are kept here
    time: { type: Date, default: Date.now },
    text: { type: String }, // raw text message body
    value: { type: Number } // value
  }]
});
userSchema.statics.addMeasurement = function(options, cb) {
  var measurement = options.measurement;
  var phone = options.phone;
  var time = options.time;
  var text = options.text; // original text message for saving to db
  // see if user exists, if so pass error
  User.lookup({phone: phone}, function(err, user){
    if (!err && user){
      console.log(time);
      // found user, add measurement
      user.measurements.push({
        time: time,
        text: text,
        value: measurement
      });
      // save changes
      user.save(function(err, user){
        if (!err){
          cb(null, user);
        } else {
          // we had some sort of database error
          cb({err: err, clientMsg: 'Something broke, try again'}, null);
        }
      });
    } else if (!err && !user){
      // need to register before using the app
      cb({err: 'user does not exist', clientMsg: 'Please REGISTER first'});
    } else {
      // we had some sort of database error
      cb({err: err, clientMsg: 'Something broke, try again'}, null);
    }
  });
};
userSchema.statics.lookup = function(options, cb) {
  var phone = options.phone;
  // see if user exists, if so pass error
  User
  .findOne({phone: phone})
  .exec(function(err, user) {
    if (!err && user){
      // user exists, no error
      cb(null, user);
    } else if (!err && !user) {
      // user doesn't exist, let FE know
      cb(null, null);
    } else {
      // we had a database user, set client message accordingly
      cb({err: err, clientMsg: 'Something broke, try again'}, null);
    }
  });
};
userSchema.statics.register = function(options, cb) {
  var phone = options.phone;
  // see if user exists, if so pass error
  User.lookup({phone: phone}, function(err, user){
    if (!err && !user){
      // create and register the user
      User
      .create({
        phone: phone
      }, function(err, user){
        if (!err && user){
          // we created the user successfully
          cb(null, user);
        } else {
          cb({err: err, clientMsg: 'Something broke, try again'}, null);
        }
      });
    } else if (!err && user) {
      // user already exists, let the front know
      cb({err: 'user exists', clientMsg: 'You have already registered, no need to register again'}, null);
    } else {
      // we had a database user, set client message accordingly
      cb({err: err, clientMsg: 'Something broke, try again'}, null);
    }
  });
};


var User = mongoose.model('User', userSchema);
// delete everything first
User.remove({}, function(err){
  User.register({phone: '+18001231234'},function(err){
    User.addMeasurement({
      phone: '+18001231234',
      value: '100',
      time: null,
      text: 'Some text who cares'
    }, function(err, user){
      console.log(user.toJSON());
      console.log('This value did not get set to the default', user.toJSON().measurements[0].time);
    });
  });
});

