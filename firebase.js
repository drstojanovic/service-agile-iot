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
    database.ref(path).update(data);
};

module.exports = Firebase;