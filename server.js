const express = require("express");
const NodeMediaServer = require("node-media-server");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const server = app;
// Enable CORS middleware
app.use(cors());

// Set up node-media-server for live streaming
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8001,
    allow_origin: "*",
  },
};

const nms = new NodeMediaServer(config);
nms.run();

nms.on("prePublish", (id, StreamPath, args) => {
  const streamKey = StreamPath.split("/").pop();
  const outputPath = `./videos/${streamKey}-${Date.now()}.flv`;
  console.log(ffmpeg);
  const ffmpegProcess = ffmpeg(`rtmp://localhost:1935${StreamPath}`)
    .inputOptions("-c:v copy")
    .inputOptions("-c:a copy")
    .output(outputPath)
    .on("start", (commandLine) => {
      console.log(`FFmpeg process started with command: ${commandLine}`);
    })
    .on("end", () => {
      console.log(
        `Recording completed for stream: ${streamKey}. Video saved at: ${outputPath}`
      );
    })
    .on("error", (err) => {
      console.error(
        `Error occurred while recording stream ${streamKey}: ${err.message}`
      );
    });

  ffmpegProcess.run();
});

// Serve static files from the public directory
app.use(express.static("public"));

// Endpoint for streaming using OBS
app.get("/stream", (req, res) => {
  // Convert RTMP stream to HLS
  convertStreamToHLS()
    .then(() => {
      res.send("Stream using OBS to rtmp://localhost/live/stream");
    })
    .catch((error) => {
      console.error("Error converting RTMP stream to HLS:", error);
      res.status(500).send("Error converting RTMP stream to HLS");
    });
});

// Endpoint for watching the stream
app.get("/watch", (req, res) => {
  res.sendFile(__dirname + "/public/watch.html");
});

// Start the HTTP server
const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Function to convert RTMP stream to HLS
// function convertStreamToHLS() {
//   return new Promise((resolve, reject) => {
//     const rtmpUrl = `rtmp://localhost/live/${streamId}`; // RTMP URL for the live stream
//     const hlsOutputPath = `./streams/${streamId}.m3u8`; // Path to save HLS files

//     // Execute FFmpeg command to convert RTMP stream to HLS
//     ffmpeg(rtmpUrl)
//       .output(hlsOutputPath)
//       .on("end", () => {
//         console.log("RTMP stream converted to HLS");
//         resolve();
//       })
//       .on("error", (err) => {
//         console.error("Error converting RTMP stream to HLS:", err);
//         reject(err);
//       })
//       .run();
//   });
// }
