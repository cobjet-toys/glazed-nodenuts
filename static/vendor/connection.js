// ** Based On: **
// Muaz Khan     - https://github.com/muaz-khan
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/RTCMultiConnection

var context = new AudioContext();

// disable rtc logging
window.skipRTCMultiConnectionLogs = true;

var connection = new RTCMultiConnection();
var sessionStarted = false;
connection.session = {
  audio: true
};
connection.extra = {
  'session-name': 'Anonymous'
};
connection.bandwidth = {
  audio: 10
};


var startBtn = document.getElementById('setup-new-conference');

// https://github.com/muaz-khan/WebRTC-Experiment/tree/master/socketio-over-nodejs
connection.openSignalingChannel = function(config) {
  var SIGNALING_SERVER = 'https://www.webrtc-experiment.com:2015/';
  //var SIGNALING_SERVER = 'https://localhost:2015/';
  var channel = config.channel || this.channel || "";
  var sender = Math.round(Math.random() * 999999999) + 999999999;

  io.connect(SIGNALING_SERVER).emit('new-channel', {
    channel: channel,
    sender: sender
  });

  var socket = io.connect(SIGNALING_SERVER + channel);
  socket.channel = channel;
  socket.on('connect', function() {
    if (config.callback) config.callback(socket);
  });

  socket.send = function(message) {
    socket.emit('message', {
      sender: sender,
      data: message
    });
  };

  socket.on('message', config.onmessage);
};

connection.onstream = function(e) {
  startBtn.style.display = 'none';
  sessionStarted = true;
  createUser(e);
};

var hasClapped = _.debounce(function() {
  socket.emit('clap');
}, 300);

// Create a user icon
function createUser(e) {
  var userEl = $('<div/>').attr({id: 'user' + e.userid}).addClass('user');
  e.mediaElement.style.opacity = 0;
  userEl.append(e.mediaElement);
  audiosContainer.insertBefore(userEl.get(0), audiosContainer.firstChild);

  var streamid = e.streamid;
  userEl.on('click', function(e) {
    e.preventDefault();
    if (userEl.hasClass('muted')) {
      connection.streams[streamid].unmute({ audio: true });
      userEl.removeClass('muted');
    } else {
      connection.streams[streamid].mute({ audio: true });
      userEl.addClass('muted');
    }
  });

  var clap = new Clap();
  var node = clap.detect(context.createMediaStreamSource(e.stream), context, function(err, average) {
    if (average > 20) hasClapped();
    userEl.get(0).style.backgroundColor = 'hsl(170, ' + (average * 2) + '%, 50%)';
  });

}

connection.onstreamended = function(e) {
  e.mediaElement.volume = 0.6;

  var userEl = $('#user' + e.userid);
  userEl.fadeOut();
  setTimeout(function() {
    userEl.remove();
  }, 1000);
};

connection.onerror = function(e) {
  console.log('onerrror');
  console.log(e);
};

connection.onopen = function(e) {
  console.log('onopen');
  console.log(e);
};

var audiosContainer = document.getElementById('audios-container') || document.body;


$( window ).load(function() {
  setTimeout(function() {
    connection.open();
  }, 7000);
});


// setup signaling to search existing sessions
connection.connect();
