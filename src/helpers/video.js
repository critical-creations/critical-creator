const path = require('node:path')
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const os = require('os');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

async function preprocessVideos(videos) {
    const tempDir = path.join(os.tmpdir(), 'video_preprocessing');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir); // Ensure the temp directory exists
    }
  
    const processedVideos = await Promise.all(
      videos.map((video, index) => {
        const tempPath = path.join(tempDir, `processed_${index}.mp4`);
        return new Promise((resolve, reject) => {
          ffmpeg(video)
            .complexFilter([
              '[0:v]scale=iw:2*trunc(iw*16/18),boxblur=luma_radius=min(h\\,w)/20:luma_power=1:chroma_radius=min(cw\\,ch)/20:chroma_power=1[bg];[0:v]scale=iw*1.7:ih*1.7[zoomed];[bg][zoomed]overlay=(W-w)/2:(H-h)/2,setsar=1'
            ])
            .outputOptions([
                '-r 30', // Normalize frame rate
                '-c:v libx264', // Use H.264 codec
                '-crf 23', // Set constant rate factor for quality
                '-preset fast', // Optimize encoding speed
                '-c:a aac', // Normalize audio codec
                '-b:a 128k', // Set audio bitrate
                '-s 1080x1920', // set resolution
              ])
            .save(tempPath)
            .on('end', () => resolve(tempPath))
            .on('error', (err) => reject(err));
        });
      })
    );
  
    return { processedVideos, tempDir }; // Return temp directory for cleanup
}

async function addWidgets(videos, prevTempDir, widgets) {
  const tempDir = path.join(os.tmpdir(), 'video_widgets');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir); // Ensure the temp directory exists
  }

  const widgetVideos = await Promise.all(
    videos.map((video, index) => {
      const tempPath = path.join(tempDir, `widgets_${index}.mp4`);

      return new Promise((resolve, reject) => {

        const videoWidth = 1080;
        const scaledWidth = (videoWidth * 7) / 10; // 4/5 of the video width
        const scaledHeight = '-1'; // Keep the aspect ratio of the widget video

        const ffmpegCommand = ffmpeg().input(video);

        // add widget if its defined
        if (widgets[index]) {
          ffmpegCommand
            .input(widgets[index])
            .inputOptions('-framerate 30')
            .complexFilter([
              // Scale the widget to 4/5 the width of the video, maintaining aspect ratio
              `[1:v]scale=${scaledWidth}:${scaledHeight}[widget];` +
              // Overlay the widget on the video
              `[0:v][widget]overlay=(main_w-overlay_w)/2:150`
            ])
        }
        
        ffmpegCommand
          .outputOptions([
            '-r 30', // Normalize frame rate
            '-c:v libx264', // Use H.264 codec
            '-crf 23', // Set constant rate factor for quality
            '-preset fast', // Optimize encoding speed
            '-c:a aac', // Normalize audio codec
            '-b:a 128k', // Set audio bitrate
          ])
          .save(tempPath)
          .on('end', () => {
            // cleanupTempFiles(prevTempDir);
            resolve(tempPath);
          })
          .on('error', (err) => {
            // cleanupTempFiles(prevTempDir);
            reject(err);
          });
      });
    }),
  );

  return { widgetVideos, tempDir }; // Return temp directory for cleanup
}

function concatenateVideos(videos, tempDir) {
  return new Promise((resolve, reject) => {
    // Create a temporary directory for concatenated video
    const concatTempDir = path.join(os.tmpdir(), 'video_concat');
    if (!fs.existsSync(concatTempDir)) {
      fs.mkdirSync(concatTempDir); // Ensure the temp directory exists
    }

    // Generate the output path for the concatenated video
    const tempOutputPath = path.join(concatTempDir, 'concatenated_video.mp4');

    const ffmpegConcat = ffmpeg();

    videos.forEach((video) => ffmpegConcat.input(video));

    ffmpegConcat
      .complexFilter([
        {
          filter: 'concat',
          options: { n: videos.length, v: 1, a: 1 },
        },
      ])
      .outputOptions('-preset fast')
      .save(tempOutputPath) // Save to the temporary directory
      .on('start', (cmd) => {
        console.log('FFmpeg command:', cmd);
      })
      .on('end', () => {
        // Optionally cleanup temporary files if needed
        cleanupTempFiles(tempDir);
        console.log('Concat video created successfully:', tempOutputPath);
        resolve(tempOutputPath); // Resolve the path to the concatenated video
      })
      .on('error', (err) => {
        cleanupTempFiles(tempDir);
        console.error('Error during concatenation:', err.message);
        reject(`Error during concatenation: ${err.message}`);
      });
  });
}

function addMapCode(inputVideo, outputVideo, text) {
  return new Promise((resolve, reject) => {

    const fontPath = path.join(__dirname, '../../assets/fonts', 'Fortnite.ttf').replace(/\\/g, '\\\\').replace(/:/g, '\\:');

    ffmpeg(inputVideo)
      .output(outputVideo)
      .outputOptions(
        '-vf', 
        `drawtext=fontfile='${fontPath}':fontsize=76:text='${text}':fontcolor=white:x=(w-text_w)/2:y=(h-text_h)*5/6:shadowcolor=black:shadowx=2:shadowy=2`
      )
      .on('start', (cmd) => {
        console.log('FFmpeg command:', cmd);
      })
      .on('end', () => {
        resolve(outputVideo);
      })
      .on('error', (err) => {
        reject(`Error adding text: ${err.message}`);
      })
      .run();
  });
}

function cleanupTempFiles(tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`Temporary files cleaned up: ${tempDir}`);
}

module.exports = { preprocessVideos, concatenateVideos, addWidgets, addMapCode };
