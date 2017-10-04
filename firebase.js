var firebase = require("firebase");

var config = {
    apiKey: "AIzaSyDP2JldyadJMqiIW3piC4_3C5Q-LtSPTjc",
    authDomain: "iot-faks.firebaseapp.com",
    databaseURL: "https://iot-faks.firebaseio.com",
    storageBucket: "iot-faks.appspot.com",
};
firebase.initializeApp(config);
var database = firebase.database();

Firebase = {};

Firebase.database = database;

Firebase.readOnce = function(path, cb) {
    database.ref(path).once('value')
        .then(function(snapshot) {
            cb(snapshot.val());
        });
};

Firebase.sendMessage = function(path, data) {
    // console.log(path);
    // console.log(data);
    database.ref(path).set(data);
};

Firebase.on = function(path, cb) {
    var ref = database.ref(path);
    ref.on('value', function(snapshot) {
        var value = snapshot.val();
        cb(value);
    });
};


Firebase.onCommand = function(path, cb) {
    var commandRef = database.ref(path + '/command');
    commandRef.on('value', function(snapshot) {
        var value = snapshot.val();
        console.log(value);
        cb(value);
    });
};

module.exports = Firebase;