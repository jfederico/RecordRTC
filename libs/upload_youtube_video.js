/* upload_youtube_video.js Copyright 2017 Google Inc. All Rights Reserved. */
var STATUS_POLLING_INTERVAL_MILLIS = 60 * 1000; // One minute.

var uploadVideo;

var uploadToYouTube = function(fileName, recordRTC, callback) {
  var blob = recordRTC instanceof Blob ? recordRTC : recordRTC.getBlob();

  blob = new File([blob], 'RecordRTC-' + (new Date()).toISOString().replace(/:|\./g, '-') + '.' + fileExtension, {
    type: mimeType
  });

  uploadVideo.callback = callback;
  uploadVideo.uploadFile(fileName, blob);
}

var UploadVideo = function() {
  this.tags = ['recordrtc'];
  this.categoryId = 28; // via: http://stackoverflow.com/a/35877512/552182
  this.videoId = '';
  this.uploadStartTime = 0;
};

var signinCallback = function(result) {
  if (result.access_token) {
    uploadVideo = new UploadVideo();
    uploadVideo.ready(result.access_token);

    document.querySelector('#signinButton').style.display = 'none';
  }
};

UploadVideo.prototype.ready = function(accessToken) {
  this.accessToken = accessToken;
  this.gapi = gapi;
  this.authenticated = true;
  false && this.gapi.client.request({
    path: '/youtube/v3/channels',
    params: {
      part: 'snippet',
      mine: true
    },
    callback: function(response) {
      if (!response.error) {
        // response.items[0].snippet.title -- channel title
        // response.items[0].snippet.thumbnails.default.url -- channel thumbnail
      }
    }.bind(this)
  });
};

UploadVideo.prototype.uploadFile = function(fileName, file) {
  var metadata = {
    snippet: {
      title: fileName,
      description: fileName,
      tags: this.tags,
      categoryId: this.categoryId
    },
    status: {
      privacyStatus: 'private'
    }
  };
  var uploader = new MediaUploader({
    baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
    file: file,
    token: this.accessToken,
    metadata: metadata,
    params: {
      part: Object.keys(metadata).join(',')
    },
    onError: function(data) {
      var message = data;
      try {
        var errorResponse = JSON.parse(data);
        message = errorResponse.error.message;
      } finally {
        alert(message);
      }
    }.bind(this),
    onProgress: function(data) {
      var bytesUploaded = data.loaded;
      var totalBytes = parseInt(data.total);
      var percentageComplete = parseInt((bytesUploaded * 100) / totalBytes);

      uploadVideo.callback(percentageComplete);
    }.bind(this),
    onComplete: function(data) {
      var uploadResponse = JSON.parse(data);
      this.videoId = uploadResponse.id;
      this.videoURL = 'https://www.youtube.com/watch?v=' + this.videoId;
      uploadVideo.callback('uploaded', this.videoURL);

      setTimeout(this.pollForVideoStatus, 2000);
    }.bind(this)
  });
  this.uploadStartTime = Date.now();
  uploader.upload();
};

UploadVideo.prototype.pollForVideoStatus = function() {
  this.gapi.client.request({
    path: '/youtube/v3/videos',
    params: {
      part: 'status,player',
      id: this.videoId
    },
    callback: function(response) {
      if (response.error) {
        uploadVideo.pollForVideoStatus();
      } else {
        var uploadStatus = response.items[0].status.uploadStatus;
        switch (uploadStatus) {
          case 'uploaded':
            uploadVideo.callback('uploaded', uploadVideo.videoURL);
            uploadVideo.pollForVideoStatus();
            break;
          case 'processed':
            uploadVideo.callback('processed', uploadVideo.videoURL);
            break;
          default:
            uploadVideo.callback('failed', uploadVideo.videoURL);
            break;
        }
      }
    }.bind(this)
  });
};