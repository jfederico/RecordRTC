// MultiStreamRecorder
var chkMultiStreamRecorder = document.querySelector('#chk-MultiStreamRecorder');

chkMultiStreamRecorder.addEventListener('change', function() {
  if (chkMultiStreamRecorder.checked === true) {
    // localStorage.setItem('chkMultiStreamRecorder', true);
  } else {
    // chkMultiStreamRecorder.removeItem('chkMultiStreamRecorder');
  }
}, false);

if (localStorage.getItem('chkMultiStreamRecorder')) {
  // chkMultiStreamRecorder.checked = true;
}

if (webrtcDetectedBrowser != 'chrome') {
  chkMultiStreamRecorder.disabled = true;
  chkMultiStreamRecorder.checked = false;
}

function captureAllCameras(successCallback, errorCallback) {
  var streams = [];
  var donotDuplicateDevices = {};

  DetectRTC.videoInputDevices.forEach(function(device, idx) {
    var mediaConstraints = {
      audio: true,
      video: {
        mandatory: {},
        optional: [{
          sourceId: device.id
        }]
      }
    };

    if (webrtcDetectedBrowser === 'firefox') {
      mediaConstraints = {
        audio: true,
        video: {
          deviceId: device.id
        }
      };
    }

    navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(stream) {
      if (!donotDuplicateDevices[device.id]) {
        donotDuplicateDevices[device.id] = true;

        if (streams.length < 5) {
          // only 4-streams are allowed, currently
          streams.push(stream);
        }
      }

      if (idx == DetectRTC.videoInputDevices.length - 1) {
        successCallback(streams);
      }
    }).catch(function(error) {
      if (error && error.name === 'ConstraintNotSatisfiedError') {
        alert('Your camera or browser does NOT supports selected resolutions or frame-rates. \n\nPlease select "default" resolutions.');
      }

      errorCallback(error);
    });
  })
}

[mediaContainerFormat, chkMultiStreamRecorder, recordingMedia].forEach(function(element) {
  element.addEventListener('change', function() {
    if (chkMultiStreamRecorder.checked === true) {
      if (mediaContainerFormat.value.toString().search(/vp8|vp9|h264/g) === -1) {
        mediaContainerFormat.value = 'vp8';
      }

      if (recordingMedia.value.toString().search(/video/g) === -1) {
        recordingMedia.value = 'record-audio-plus-video';
        recordingMedia.onchange();
      }
    }
  }, false);
});