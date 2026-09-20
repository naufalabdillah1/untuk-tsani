// ---- floating petals ----
  const petalField = document.getElementById('petals');
  const petalSVG = (color) => `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 0c2 3 4 4 4 7a4 4 0 1 1-8 0c0-3 2-4 4-7z" fill="${color}"/></svg>`;
  const colors = ['#e6b8bd','#cda05f','#f3e6d8'];
  function spawnPetals(n){
    for(let i=0;i<n;i++){
      const el = document.createElement('div');
      el.className = 'petal';
      el.style.left = Math.random()*100 + 'vw';
      el.style.setProperty('--drift', (Math.random()*80-40) + 'px');
      el.style.animationDuration = (7 + Math.random()*9) + 's';
      el.style.animationDelay = (Math.random()*6) + 's';
      el.style.width = el.style.height = (8 + Math.random()*10) + 'px';
      el.innerHTML = petalSVG(colors[i % colors.length]);
      petalField.appendChild(el);
    }
  }
  spawnPetals(14);
  // sparkles on cover
  const cover = document.getElementById('cover');
  for(let i=0;i<10;i++){
    const s = document.createElement('div');
    s.className='spark';
    const size = 2 + Math.random()*3;
    s.style.width = s.style.height = size+'px';
    s.style.left = (10 + Math.random()*80) + '%';
    s.style.top = (8 + Math.random()*55) + '%';
    s.style.animationDuration = (2 + Math.random()*3) + 's';
    s.style.animationDelay = (Math.random()*3) + 's';
    cover.appendChild(s);
  }

  // ---- envelope open sequence ----
  const deck = document.getElementById('deck');
  const dots = document.getElementById('dots');
  const sealBtn = document.getElementById('sealBtn');
  sealBtn.addEventListener('click', () => {
    if(sealBtn.dataset.done) return;
    sealBtn.dataset.done = '1';
    sealBtn.classList.add('cracking');
    setTimeout(() => { cover.classList.add('open'); }, 380);
    setTimeout(() => { cover.classList.add('open2'); }, 900);
    setTimeout(() => {
      cover.classList.add('hide');
      deck.classList.add('show');
      dots.classList.add('show');
      spawnPetals(22);
    }, 1500);
  });

  // ---- music toggle (visual only) ----
  const vinyl = document.getElementById('vinyl');
  const playBtn = document.getElementById('playBtn');
  let playing = false;
  playBtn.addEventListener('click', () => {
    playing = !playing;
    vinyl.classList.toggle('playing', playing);
    playBtn.textContent = playing ? '❚❚ jeda animasi' : '🎨 putar animasi';
  });

  // ---- custom full-page slider ----
  const track = document.getElementById('track');
  const sections = [...document.querySelectorAll('#deck section')];
  const dotBtns = [...document.querySelectorAll('#dots button')];
  let current = 0;
  let animating = false;

  function goTo(i){
    if(i < 0 || i >= sections.length || animating) return;
    animating = true;
    sections[current].classList.remove('active');
    current = i;
    track.style.transform = `translateY(-${current * 100}dvh)`;
    dotBtns.forEach(b => b.classList.remove('active'));
    dotBtns[current].classList.add('active');
    setTimeout(() => {
      sections[current].classList.add('active');
      animating = false;
    }, 500);
  }

  dotBtns.forEach(btn => btn.addEventListener('click', () => goTo(+btn.dataset.i)));

  let wheelLock = false;
  deck.addEventListener('wheel', (e) => {
    if(e.target.closest('.filmstrip') && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    if(wheelLock || animating) return;
    wheelLock = true;
    setTimeout(() => wheelLock = false, 850);
    if(e.deltaY > 12) goTo(current + 1);
    else if(e.deltaY < -12) goTo(current - 1);
  }, {passive:false});

  let touchStartY = null;
  let touchStartX = null;
  let touchInFilmstrip = false;
  deck.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchInFilmstrip = !!e.target.closest('.filmstrip');
  }, {passive:true});
  deck.addEventListener('touchmove', (e) => {
    if(touchInFilmstrip) return; // let the gallery scroll natively
    e.preventDefault();
  }, {passive:false});
  deck.addEventListener('touchend', (e) => {
    if(touchStartY === null || animating || touchInFilmstrip){ touchInFilmstrip = false; return; }
    const dy = touchStartY - e.changedTouches[0].clientY;
    const dx = touchStartX - e.changedTouches[0].clientX;
    if(Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)){
      if(dy > 0) goTo(current + 1); else goTo(current - 1);
    }
    touchStartY = null;
  }, {passive:true});

  window.addEventListener('keydown', (e) => {
    if(cover && !cover.classList.contains('hide')) return;
    if(e.key === 'ArrowDown' || e.key === 'PageDown'){ e.preventDefault(); goTo(current+1); }
    if(e.key === 'ArrowUp' || e.key === 'PageUp'){ e.preventDefault(); goTo(current-1); }
  });

  // ---- clicking the scroll hint chevron also advances
  document.querySelectorAll('.scroll-hint').forEach(hint => {
    hint.style.cursor = 'pointer';
    hint.addEventListener('click', () => goTo(current+1));
  });

  // ---- filmstrip: smooth drag-to-scroll with momentum (mouse + touch) ----
  const filmstrip = document.getElementById('filmstrip');
  if(filmstrip){
    let isDown = false, startX = 0, startScroll = 0;
    let lastX = 0, lastT = 0, velocity = 0;
    let momentumId = null;

    function stopMomentum(){ if(momentumId){ cancelAnimationFrame(momentumId); momentumId = null; } }

    function pointerDown(x){
      stopMomentum();
      isDown = true;
      startX = x; startScroll = filmstrip.scrollLeft;
      lastX = x; lastT = performance.now();
      velocity = 0;
      filmstrip.classList.add('dragging');
    }
    function pointerMove(x){
      if(!isDown) return;
      const dx = x - startX;
      filmstrip.scrollLeft = startScroll - dx;
      const now = performance.now();
      const dt = now - lastT || 16;
      velocity = (x - lastX) / dt; // px per ms
      lastX = x; lastT = now;
    }
    function pointerUp(){
      if(!isDown) return;
      isDown = false;
      filmstrip.classList.remove('dragging');
      // momentum glide
      let v = velocity;
      function glide(){
        if(Math.abs(v) < 0.02){ momentumId = null; return; }
        filmstrip.scrollLeft -= v * 16;
        v *= 0.93;
        momentumId = requestAnimationFrame(glide);
      }
      stopMomentum();
      momentumId = requestAnimationFrame(glide);
    }

    // mouse (desktop drag)
    filmstrip.addEventListener('mousedown', (e) => { pointerDown(e.clientX); e.preventDefault(); });
    window.addEventListener('mousemove', (e) => { if(isDown) pointerMove(e.clientX); });
    window.addEventListener('mouseup', pointerUp);
    filmstrip.addEventListener('mouseleave', () => { if(isDown) pointerUp(); });

    // touch (adds momentum on top of native scroll; native handles the live drag)
    filmstrip.addEventListener('touchstart', (e) => {
      stopMomentum();
      lastX = e.touches[0].clientX; lastT = performance.now(); velocity = 0;
    }, {passive:true});
    filmstrip.addEventListener('touchmove', (e) => {
      const x = e.touches[0].clientX;
      const now = performance.now();
      const dt = now - lastT || 16;
      velocity = (x - lastX) / dt;
      lastX = x; lastT = now;
    }, {passive:true});
    filmstrip.addEventListener('touchend', () => {
      let v = velocity;
      function glide(){
        if(Math.abs(v) < 0.02){ momentumId = null; return; }
        filmstrip.scrollLeft -= v * 16;
        v *= 0.93;
        momentumId = requestAnimationFrame(glide);
      }
      stopMomentum();
      momentumId = requestAnimationFrame(glide);
    }, {passive:true});
  }
