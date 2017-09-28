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

Firebase.sendMessage = function(path, data) {
    // console.log(path);
    // console.log(data);
    database.ref(path).update(data);
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