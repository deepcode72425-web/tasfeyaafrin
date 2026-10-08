(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle (initial theme is set by the inline script in <head>) */
  var toggle=document.querySelector('.theme-toggle');
  function setTheme(t){
    root.setAttribute('data-theme',t);
    try{localStorage.setItem('tasfeya-theme',t)}catch(e){}
    if(toggle)toggle.setAttribute('aria-label',t==='dark'?'Switch to light mode':'Switch to dark mode');
  }
  if(toggle){
    toggle.setAttribute('aria-label',root.getAttribute('data-theme')==='dark'?'Switch to light mode':'Switch to dark mode');
    toggle.addEventListener('click',function(){setTheme(root.getAttribute('data-theme')==='dark'?'light':'dark')});
  }
  var mq=window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener&&mq.addEventListener('change',function(e){
    var saved;try{saved=localStorage.getItem('tasfeya-theme')}catch(x){}
    if(!saved)setTheme(e.matches?'dark':'light');
  });

  /* Pointer spotlight on the page background */
  if(!reduce){
    window.addEventListener('pointermove',function(e){
      root.style.setProperty('--px',e.clientX+'px');
      root.style.setProperty('--py',e.clientY+'px');
    },{passive:true});
  }

  /* Sector cards: glow follows the pointer, gentle tilt on desktop */
  var canHover=window.matchMedia('(hover: hover)').matches;
  document.querySelectorAll('.sector').forEach(function(card){
    card.addEventListener('pointermove',function(e){
      var r=card.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      card.style.setProperty('--mx',x+'px');
      card.style.setProperty('--my',y+'px');
      if(canHover&&!reduce){
        card.style.setProperty('--ry',((x/r.width-.5)*6).toFixed(2)+'deg');
        card.style.setProperty('--rx',((.5-y/r.height)*6).toFixed(2)+'deg');
      }
    });
    card.addEventListener('pointerleave',function(){
      card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');
    });
  });

  /* Dropdown */
  document.querySelectorAll('.dropdown').forEach(function(dd){
    var btn=dd.querySelector('.dd-trigger');
    btn.addEventListener('click',function(){
      var open=dd.classList.toggle('open');
      btn.setAttribute('aria-expanded',open);
    });
  });

  /* Tabs */
  var tabs=[].slice.call(document.querySelectorAll('[role="tab"]'));
  function showTab(id,focus){
    tabs.forEach(function(t){
      var on=t.dataset.panel===id;
      t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;
      document.getElementById(t.getAttribute('aria-controls')).hidden=!on;
      if(on&&focus)t.focus();
    });
    if(history.replaceState)history.replaceState(null,'','#'+id);
  }
  if(tabs.length){
    var h=location.hash.slice(1);
    if(h&&tabs.some(function(t){return t.dataset.panel===h}))showTab(h);
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){showTab(t.dataset.panel)});
      t.addEventListener('keydown',function(e){
        var n=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:null;
        if(n===null)return;e.preventDefault();
        showTab(tabs[(n+tabs.length)%tabs.length].dataset.panel,true);
      });
    });
    document.querySelectorAll('[data-tab]').forEach(function(b){
      b.addEventListener('click',function(){showTab(b.dataset.tab);window.scrollTo({top:0,behavior:reduce?'auto':'smooth'})});
    });
  }

  /* Soft fade between internal pages */
  document.querySelectorAll('a[href]').forEach(function(a){
    var h=a.getAttribute('href');
    if(a.target==='_blank'||!/\.html$|^\.?\/?$/.test(h)||/^https?:/.test(h))return;
    a.addEventListener('click',function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||reduce)return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(function(){location.href=h},210);
    });
  });
  window.addEventListener('pageshow',function(e){if(e.persisted)document.body.classList.remove('leaving')});
})();
