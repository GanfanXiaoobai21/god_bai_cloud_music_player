// 列表：请确保这些文件都与本页面位于同一目录，或按需修改路径
const tracks = [
  'Friendship.m4a',
  'myheartwillgoon.m4a',
  'Nijamena.m4a',
  'scarbor.m4a',
  'victory.m4a',
  '一笑江湖.m4a',
  '不为谁而作的歌.m4a',
  '冬眠.m4a',
  '别让爱凋落.m4a',
  '可惜没如果.m4a',
  '哪吒.m4a',
  '堕.m4a',
  '壁上观.m4a',
  '夜空中最亮的星.m4a',
  '大雨还在下.m4a',
  '天下低音版.m4a',
  '天下煽情版.m4a',
  '失控.m4a',
  '孤城.m4a',
  '忘川彼岸.m4a',
  '折风渡夜.m4a',
  '日不落-蔡依林.m4a',
  '星辰万里只有你.m4a',
  '晚风作酒.m4a',
  '晚风作酒黄静美.m4a',
  '晴天.m4a',
  '樱花树下的约定.m4a',
  '正版一笑江湖.m4a',
  '正版关山酒.m4a',
  '牵丝戏.m4a',
  '生生世世爱.m4a',
  '红尘客栈.m4a',
  '美丽的神话.m4a',
  '起风了.m4a',
  '踏雪.m4a',
  '辞九门回忆等什么君.m4a',
  '违背的青春.m4a',
  '都江堰.m4a',
  '错位时空.m4a',
  '难却.m4a',
  '风的使命.m4a',
  '起风了跑步版.m4a',
  '牵丝戏降调版.m4a',
  '关山酒草帽酱.m4a',
];

const audio = document.getElementById('audio');
const playlistEl = document.getElementById('playlist-list');
const titleEl = document.getElementById('track-title');
const timeEl = document.getElementById('track-time');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const loopBtn = document.getElementById('loop');
const progress = document.getElementById('progress');
const statusMsg = document.getElementById('status-msg');

let current = 0;
let isPlaying = false;
let loopSingle = false; // 单曲循环开关；默认关闭
let userInteracted = false; // 用于在某些浏览器决定是否允许自动播放

function fmtTime(seconds){
  if (isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds/60).toString().padStart(2,'0');
  const s = Math.floor(seconds%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function loadTrack(index){
  if (index < 0 || index >= tracks.length) return;
  current = index;
  audio.src = encodeURI(tracks[index]);
  titleEl.textContent = tracks[index];
  updatePlayingClass();
  audio.load();
}

function setUserInteracted(){
  if (!userInteracted){
    userInteracted = true;
  }
}

function playPause(){
  if (!audio.src) loadTrack(current);
  setUserInteracted();
  if (isPlaying) { audio.pause(); }
  else { audio.play().catch(err => { console.warn('播放被浏览器阻止：', err); isPlaying = false; playBtn.textContent = '▶️'; }); }
}

playBtn.addEventListener('click', ()=>{
  playPause();
});

prevBtn.addEventListener('click', ()=>{
  setUserInteracted();
  changeTrack(current-1);
});
nextBtn.addEventListener('click', ()=>{
  setUserInteracted();
  changeTrack(current+1);
});

loopBtn.addEventListener('click', ()=>{
  // 记录用户动作以避免自动播放被阻止
  setUserInteracted();
  loopSingle = !loopSingle;
  // 使用 audio 的 loop 属性实现单曲循环
  audio.loop = !!loopSingle;
  loopBtn.classList.toggle('active', loopSingle);
  // 方便屏幕阅读器提示
  loopBtn.setAttribute('aria-pressed', loopSingle ? 'true' : 'false');
  // 给用户明显的反馈
  showStatus(loopSingle ? '已开启：单曲循环（当前曲目将重复）' : '已关闭：单曲循环', 2200);
});

function changeTrack(nextIndex){
  // 规范化索引（单曲循环不影响索引边界）
  if (nextIndex < 0) nextIndex = 0;
  if (nextIndex >= tracks.length) nextIndex = tracks.length - 1;

  // 如果目标就是当前曲目，则从头播放
  if (nextIndex === current){
    audio.currentTime = 0;
    audio.play().catch(err=>{ console.warn('播放被阻止', err); });
    return;
  }

  loadTrack(nextIndex);
  // 尝试播放；如果浏览器阻止了自动播放，仅更新 UI（用户下一次交互可播放）
  audio.play().then(()=>{
    setUserInteracted();
  }).catch(err=>{
    console.warn('播放被阻止',err);
    isPlaying = false;
    playBtn.textContent = '▶️';
  });
}

audio.addEventListener('play', ()=>{ isPlaying = true; playBtn.textContent = '⏸'; updatePlayingClass(); });
audio.addEventListener('pause', ()=>{ isPlaying = false; playBtn.textContent = '▶️'; updatePlayingClass(); });

audio.addEventListener('timeupdate', ()=>{
  const cur = audio.currentTime;
  const dur = audio.duration || 0;
  timeEl.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
  if (dur) progress.value = (cur/dur)*100;
});

audio.addEventListener('ended', ()=>{
  // 小延迟避免部分浏览器/编码问题导致的 race
  setTimeout(()=>{
    // 单曲循环优先（若启用 audio.loop 则 ended 可能不触发，但这里仍做兜底处理）
    if (loopSingle){
      // 把播放头回到 0 并继续播放（兜底）
      audio.currentTime = 0;
      audio.play().catch(err=>console.warn('单曲循环继续播放被阻止', err));
      showStatus('单曲循环：重新播放当前曲目', 1200);
      return;
    }

    // 非单曲循环：继续下一首或在末尾停止
    if (current < tracks.length - 1) {
      changeTrack(current + 1);
    } else {
      isPlaying = false;
      playBtn.textContent = '▶️';
      updatePlayingClass();
      showStatus('播放已结束（未开启单曲循环）', 1600);
    }
  }, 180);
});

function showStatus(text, ms = 1800){
  if (!statusMsg) return;
  statusMsg.textContent = text;
  statusMsg.className = 'status';
  // 让元素可见
  setTimeout(()=>{
    statusMsg.style.opacity = '1';
    statusMsg.style.height = '';
  }, 20);
  // 隐藏
  setTimeout(()=>{
    statusMsg.className = 'status-hidden';
  }, ms + 260);
}

progress.addEventListener('input', ()=>{
  const dur = audio.duration || 0;
  audio.currentTime = (progress.value/100)*dur;
});

function updatePlayingClass(){
  const items = playlistEl.querySelectorAll('li');
  items.forEach((li, idx)=>{
    li.classList.toggle('playing', idx === current && isPlaying);
  });
}

// 构建播放列表 DOM
tracks.forEach((t, idx)=>{
  const li = document.createElement('li');
  const name = document.createElement('span');
  name.textContent = t;
  const btn = document.createElement('button');
  btn.textContent = '播放';
  btn.addEventListener('click', ()=>{
    setUserInteracted();
    loadTrack(idx);
    audio.play().catch(err=>{ console.warn('播放被阻止',err); });
  });
  li.appendChild(name);
  li.appendChild(btn);
  playlistEl.appendChild(li);
});

// 初始化
loopBtn.classList.toggle('active', loopSingle);
loopBtn.setAttribute('aria-pressed', loopSingle ? 'true' : 'false');
// 将 audio.loop 初始为 loopSingle
audio.loop = !!loopSingle;
if (tracks.length) loadTrack(0);
// 页面提示当前循环状态（第一次加载）- 已移除自动显示


