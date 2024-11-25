// Modules to control application life and create native browser window
const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron')
const { preprocessVideos, concatenateVideos, cleanupTempFiles } = require('./helpers/video.js');
const path = require('node:path')
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../public/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icons/icon.ico'),
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../public/index.html'))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  mainWindow.maximize();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('select-file', async (event, filters = []) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'], // Single file selection
    filters: filters.length > 0 ? filters : undefined, // Dynamic filters
  });

  if (canceled) {
    return null; // Return null if the user cancels the dialog
  }
  return filePaths[0]; // Return the first selected file's path
});

ipcMain.on('generate-video', async (event, videos) => {
  if (!videos || videos.length < 2) {
    event.reply('generate-video-error', 'At least 2 videos should beselected!');
    return;
  }

  const savePath = dialog.showSaveDialogSync({
    title: 'Save Output Video',
    defaultPath: 'output.mp4',
    filters: [{ name: 'Videos', extensions: ['mp4'] }],
  });

  if (!savePath) {
    event.reply('generate-video-error', 'Save path not specified.');
    return;
  }
  
  preprocessVideos(videos)
  .then(({ processedVideos, tempDir }) => {
    console.log('Videos processed:', processedVideos);
    return concatenateVideos(processedVideos, savePath, tempDir)
  })
  
  .catch((err) => {
    console.error('Error processing videos:', err.message);
  });
});
