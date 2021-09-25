var express = require('express');
var router = express.Router();
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const path = require('path');
const { getVideoDurationInSeconds } = require('get-video-duration');

var videoLink = "";
var initialCount = 0;
var originalVideoPath = 'api/public/static/originalVideo.mp4';
var startTime = '00:00:00';
var intervals = "";
var numOfVideos = 0;
var totalDuration = "";
var processedDestPath = 'api/public/static/outputVideo' + initialCount + '.mp4';
var internal_videos= [], intervalTimeToAdd;

router.get('/api/process-interval', function(req, res, next) {
  var directory = "api/public/static";
  fs.readdir(directory, (err, files) => {
    // if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(directory, file), err => {
        // if (err) throw err;
      });
    }
  });

  return res.send('success');
});

router.post('/api/process-interval', async function(req, res, next) {
  videoLink = req.body.video_link;
  initialCount = 0;
  internal_videos= [];
  startTime = '00:00:00';
  intervals = req.body.interval_duration;
  intervalTimeToAdd = '00:00:0' + req.body.interval_duration;
  processedDestPath = 'api/public/static/outputVideo' + initialCount + '.mp4';
  internal_videos.push(
    {
      "video_url" : 'http://localhost:8080/api/public/static/outputVideo' + initialCount + '.mp4',
      "index": initialCount
    }
  );

  var download = function(url, dest) {
    var file = fs.createWriteStream(dest);
    try {
      https.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close();  // close() is async, call cb after close completes.
            getVideoDurationInSeconds(originalVideoPath).then((duration) => {
              totalDuration = duration;
              numOfVideos = totalDuration / intervals;
              console.log("numOfVideos"+ numOfVideos);
            }) 
            return createVideos(req, res);
        });
      }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        return res.send("Invalid URL");
      });
    } catch(e) {
      return res.send(e.message);
    }
  };

  download(videoLink, originalVideoPath);
});

function createVideos(req, res) {
  ffmpeg(originalVideoPath)
  .setStartTime(startTime)
  .setDuration(intervals)
  .output(processedDestPath)
  .on('end', function(err) {
    if(!err) {
      initialCount++;
      startTime = addTwoTimes(startTime,intervalTimeToAdd);
      processedDestPath = 'api/public/static/outputVideo' + initialCount + '.mp4';
      if (initialCount <= numOfVideos) {
        internal_videos.push(
          {
            "video_url" : 'http://localhost:8080/api/public/static/outputVideo' + initialCount + '.mp4',
            "index": initialCount
          }
        );
        createVideos(req, res);
      } else {
        // loadVideo(internal_videos);
        return res.send(internal_videos);
      }
    } else {
      return res.send("Invalid URL");
      // Implement to send error message to client
    }
  })
  .on('error', function(err){
      return res.send("Invalid URL");
      // Implement to send error message to client
  }).run()
}

router.get("/api/public/static/:video", function(req, res) {
  var url = "api/public/static/" + req.params.video;
  const path = url;
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] 
      ? parseInt(parts[1], 10)
      : fileSize-1
    const chunksize = (end-start)+1
    const file = fs.createReadStream(path, {start, end})
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(206, head);
    return file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    return fs.createReadStream(path).pipe(res)
  }
});

function addTwoTimes(time1, time2){
  var time1 = time1.split('');
  var time2 = time2.split('');
  var output = [];
  time1.forEach((elem, index) => {
    if (elem !== ":") {
      var added = parseInt(elem) + parseInt(time2[index]);
      if ((added + "").length > 1) {
        added = added + "";
        output[index-1] = added[0];
        output.push(added[1]);
      } else {
        output.push(added);
      }
    } else {
      output.push(elem);
    }
  });
  return output.join("");
}

module.exports = router;
