var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const https = require('https'); // or 'https' for https:// URLs
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const videoStitch = require('video-stitch');
const videoConcat = videoStitch.concat;

var initalCount = 0;
var vidToJoin = [];

/* GET home page. */
router.get('/api/combine-video', function(req, res, next) {
    var directory = "api/public/static";
    fs.readdir(directory, (err, files) => {
      // if (err) throw err;
      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          // if (err) throw err;
        });
      }
    });
    vidToJoin = [];
    initalCount = 0;
    return res.send('success');
});

router.post('/api/combine-video', async function(req, res, next) {
    initalCount = 0;
    var elem = req.body[initalCount].url;
    console.log(elem);
    return downloadVideos(elem, initalCount, req.body, res);
});

function combineVideos(res){
    videoConcat({
      ffmpeg_path: ffmpegPath, //Optional. Otherwise it will just use ffmpeg on your $PATH
      silent: true, // optional. if set to false, gives detailed output on console
      overwrite: true // optional. by default, if file already exists, ffmpeg will ask for overwriting in console and that pause the process. if set to true, it will force overwriting. if set to false it will prevent overwriting.
    })
    .clips(vidToJoin)
    .output("api/public/static/combined.mp4") //optional absolute file name for output file
    .concat()
    .then(() => {
      var videos = [
        {
          video_url: "http://localhost:8080/api/public/static/combined.mp4"
        }
      ]
      return res.send(videos);
    }).catch(e => {
      console.log(e);
    })
}

function trimVideos(data, req, index, res){
    var processedDestPath = 'api/public/static/trimmedVideo' + index + '.mp4';
    vidToJoin.push({
      "fileName": processedDestPath
    });
    ffmpeg(data.path)
    .setStartTime(data.startDuration)
    .setDuration(data.endDuration)
    .output(processedDestPath)
    .on('end', function() {
      initalCount++;
      if (initalCount >= req.length ) {
        return combineVideos(res);
      } else {
        var elem = req[initalCount].url;
        downloadVideos(elem, initalCount, req, res);
      }
    }).run();
}

function downloadVideos(elem, index, data, res) {
    var originalVideoPath = 'api/public/static/originalVideo' + index + '.mp4';
    var file = fs.createWriteStream(originalVideoPath);
    try {
      https.get(elem, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close();  // close() is async, call cb after close completes.
          var dataObj = {
            "path": originalVideoPath,
            "startDuration": data[index].startDuration.length > 1 ? "00:00:" + data[index].startDuration : "00:00:0"+ data[index].startDuration,
            "endDuration": data[index].endDuration.length > 1 ? "00:00:" + data[index].endDuration : "00:00:0"+ data[index].endDuration
          };
          return trimVideos(dataObj, data, index, res);
        });
      }).on('error', function(err) { // Handle errors
        fs.unlink(originalVideoPath); // Delete the file async. (But we don't check the result)
      });
    } catch(e) {
    }
}

router.get("/api/public/static/combined.mp4", function(req, res) {
  var url = "api/public/static/combined.mp4";
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
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
  }
});

module.exports = router;
