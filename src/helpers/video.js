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
              '[0:v]scale=iw:2*trunc(iw*16/18),boxblur=luma_radius=min(h\\,w)/20:luma_power=1:chroma_radius=min(cw\\,ch)/20:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,setsar=1'
            ])
            .outputOptions([
                '-r 30', // Normalize frame rate
                '-c:v libx264', // Use H.264 codec
                '-crf 23', // Set constant rate factor for quality
                '-preset fast', // Optimize encoding speed
                '-c:a aac', // Normalize audio codec
                '-b:a 128k', // Set audio bitrate
              ])
            .save(tempPath)
            .on('end', () => resolve(tempPath))
            .on('error', (err) => reject(err));
        });
      })
    );
  
    return { processedVideos, tempDir }; // Return temp directory for cleanup
}

function concatenateVideos(videos, outputPath, tempDir) {
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
    .save(outputPath)
    .on('start', (cmd) => {
    console.log('FFmpeg command:', cmd);
    })
    .on('end', () => {
        cleanupTempFiles(tempDir);
        console.log('Final video created successfully:', outputPath);
    })
    .on('error', (err) => {
        cleanupTempFiles(tempDir);
        console.error('Error during concatenation:', err.message);
    });

}

function cleanupTempFiles(tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`Temporary files cleaned up: ${tempDir}`);
}

module.exports = { preprocessVideos, concatenateVideos, cleanupTempFiles };
