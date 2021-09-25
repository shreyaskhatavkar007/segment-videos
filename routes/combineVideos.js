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

var elements = [];
var currentElementCount = 0;
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
    elements = [];
    vidToJoin = [];
    currentElementCount = 0;
    initalCount = 0;
    return res.render('combinevideos');
});

router.post('/api/combine-video', async function(req, res, next) {
    var urls = req.body.url;
    initalCount = 0;
    currentElementCount = 0;
    var elem = urls[initalCount];
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
          video_url: "public/static/combined.mp4"
        }
      ]
      return res.render("combinevideos", {videos:videos});
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
      if (initalCount >= req.url.length ) {
        return combineVideos(res);
      } else {
        var elem = req.url[initalCount];
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
            "startDuration": data.startDuration[index].length > 1 ? "00:00:" + data.startDuration[index] : "00:00:0"+ data.startDuration[index],
            "endDuration": data.endDuration[index].length > 1 ? "00:00:" + data.endDuration[index] : "00:00:0"+ data.endDuration[index]
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

router.get('/api/add-video', function(req, res, next) {
    currentElementCount++;
    var elementObj = {
        "classUrl": "combine-video-" + currentElementCount,
        "classStartDuration": "combine-video-range-duration-start-" + currentElementCount, 
        "classEndDuration": "combine-video-range-duration-end-" + currentElementCount,
        "deleteClass": "delete-combine-video-range-duration-" + currentElementCount 
    };
    elements.push(elementObj);
    return res.render('combinevideos', {elements:elements});
});

module.exports = router;
