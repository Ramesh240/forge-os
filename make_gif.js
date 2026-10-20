// make_gif.js
const { execFile } = require('child_process');
const path = require('path');

const ffmpeg = 'C:\\Users\\rames\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const input = path.join(__dirname, 'youtube-16x9', 'youtube-16x9.mp4');
const output = path.join(__dirname, 'youtube-16x9', 'preview.gif');

const args = [
  '-y',
  '-i', input,
  '-vf', 'fps=12,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer',
  '-loop', '0',
  output
];

console.log('Generating GIF preview from MP4...');
execFile(ffmpeg, args, (err, stdout, stderr) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('Successfully generated GIF preview at:', output);
});
