// Minimal Audio Player & Visualiser
const audio = new Audio();
audio.volume = 0.8;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
let sourceConnected = false;
function connectSource() {
  if (!sourceConnected) {
    audioCtx.createMediaElementSource(audio).connect(analyser);
    analyser.connect(audioCtx.destination);
    sourceConnected = true;
  }
}
const $ = id => document.getElementById(id);
const fileInput = $('file-input'), trackName = $('track-name'), canvas = $('visualiser'),
  canvasCtx = canvas.getContext('2d'), progressBar = $('progress'), timeCur = $('time-cur'),
  timeDur = $('time-dur'), btnPlay = $('btn-play'), btnBack = $('btn-back'), btnFwd = $('btn-fwd'),
  btnMute = $('btn-mute'), btnLoop = $('btn-loop'), volSlider = $('vol'), volVal = $('vol-val'),
  speedSlider = $('speed'), speedVal = $('speed-val');
let isMuted = false, isLooping = false, savedVolume = 0.8;
const formatTime = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
fileInput.onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  audio.src = URL.createObjectURL(f);
  trackName.textContent = f.name;
  timeCur.textContent = timeDur.textContent = '0:00';
  progressBar.value = 0;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  connectSource();
};
audio.onloadedmetadata = () => {
  timeDur.textContent = formatTime(audio.duration);
  progressBar.max = audio.duration;
};
audio.ontimeupdate = () => {
  timeCur.textContent = formatTime(audio.currentTime);
  progressBar.value = audio.currentTime;
};
audio.onended = () => {
  if (!isLooping) btnPlay.textContent = 'Play', btnPlay.classList.remove('active');
};
btnPlay.onclick = () => {
  if (!audio.src) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (audio.paused) audio.play(), btnPlay.textContent = 'Pause', btnPlay.classList.add('active');
  else audio.pause(), btnPlay.textContent = 'Play', btnPlay.classList.remove('active');
};
btnBack.onclick = () => audio.currentTime = Math.max(0, audio.currentTime - 10);
btnFwd.onclick = () => audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
btnMute.onclick = () => {
  isMuted = !isMuted;
  if (isMuted) savedVolume = audio.volume, audio.volume = 0, btnMute.textContent = 'Unmute', btnMute.classList.add('active');
  else audio.volume = savedVolume, volSlider.value = savedVolume, volVal.textContent = Math.round(savedVolume * 100) + '%', btnMute.textContent = 'Mute', btnMute.classList.remove('active');
};
btnLoop.onclick = () => { isLooping = !isLooping; audio.loop = isLooping; btnLoop.classList.toggle('active', isLooping); };
volSlider.oninput = function() {
  audio.volume = +this.value;
  volVal.textContent = Math.round(this.value * 100) + '%';
  if (isMuted) isMuted = false, btnMute.textContent = 'Mute', btnMute.classList.remove('active');
};
speedSlider.oninput = function() {
  audio.playbackRate = +this.value;
  speedVal.textContent = (+this.value).toFixed(2) + '×';
};
progressBar.oninput = function() { audio.currentTime = +this.value; };
document.onkeydown = e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === ' ') { e.preventDefault(); btnPlay.click(); }
  else if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  else if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 10);
  else if (e.key.toLowerCase() === 'm') btnMute.click();
  else if (e.key.toLowerCase() === 'l') btnLoop.click();
};
const freqData = new Uint8Array(analyser.frequencyBinCount);
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.onresize = resizeCanvas;
function drawVisualiser() {
  requestAnimationFrame(drawVisualiser);
  const w = canvas.width, h = canvas.height;
  canvasCtx.clearRect(0, 0, w, h);
  canvasCtx.fillStyle = '#111';
  canvasCtx.fillRect(0, 0, w, h);
  if (!sourceConnected || audio.paused) {
    canvasCtx.strokeStyle = '#444';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, h / 2);
    canvasCtx.lineTo(w, h / 2);
    canvasCtx.stroke();
    return;
  }
  analyser.getByteFrequencyData(freqData);
  const barCount = freqData.length, barWidth = w / barCount;
  for (let i = 0; i < barCount; i++) {
    const barHeight = (freqData[i] / 255) * h;
    canvasCtx.fillStyle = '#4fc3f7';
    canvasCtx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
  }
}
drawVisualiser();
