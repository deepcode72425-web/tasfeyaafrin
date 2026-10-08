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

  /* Job deadlines: show days left, dim closed listings */
  var today=new Date();today.setHours(0,0,0,0);
  document.querySelectorAll('.job[data-deadline]').forEach(function(card){
    var p=card.dataset.deadline.split('-'),d=new Date(+p[0],+p[1]-1,+p[2]);
    var days=Math.round((d-today)/86400000),el=card.querySelector('.status');
    if(!el)return;
    if(days<0){el.textContent='Closed';el.classList.add('closed');card.classList.add('is-closed')}
    else if(days===0){el.textContent='Closes today';el.classList.add('soon')}
    else{el.textContent='Closes in '+days+(days===1?' day':' days');if(days<=3)el.classList.add('soon')}
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

  /* ── ChatGPT job finder modal ── */
  var modal=document.getElementById('chatgptModal');
  var openBtn=document.getElementById('openChatgptForm');
  var closeBtn=document.getElementById('closeChatgptForm');
  var cancelBtn=document.getElementById('cancelChatgptForm');
  var form=document.getElementById('chatgptJobForm');
  var lastFocus=null;

  function openModal(){
    if(!modal)return;
    lastFocus=document.activeElement;
    modal.hidden=false;
    document.body.style.overflow='hidden';
    var first=modal.querySelector('input,select,button');
    if(first)first.focus();
  }
  function closeModal(){
    if(!modal)return;
    modal.hidden=true;
    document.body.style.overflow='';
    if(lastFocus)lastFocus.focus();
  }

  if(openBtn)openBtn.addEventListener('click',openModal);
  if(closeBtn)closeBtn.addEventListener('click',closeModal);
  if(cancelBtn)cancelBtn.addEventListener('click',closeModal);

  if(modal){
    modal.addEventListener('click',function(e){
      if(e.target===modal)closeModal();
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&!modal.hidden)closeModal();
    });
  }

  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var age=document.getElementById('cgAge').value.trim();
      var gender=document.getElementById('cgGender').value.trim();
      var position=document.getElementById('cgPosition').value.trim();
      var experience=document.getElementById('cgExperience').value.trim();
      var location=document.getElementById('cgLocation').value.trim();
      var salary=document.getElementById('cgSalary').value.trim();

      if(!age||!gender||!position||!experience||!location||!salary){
        form.reportValidity();
        return;
      }

      var prompt=
'Find current job opportunities matching the following candidate preferences:\n'+
'- Age: '+age+'\n'+
'- Gender: '+gender+'\n'+
'- Preferred Position/Job Type: '+position+'\n'+
'- Years of Work Experience: '+experience+'\n'+
'- Preferred Job Location(s): '+location+'\n'+
'- Expected Monthly Salary: '+salary+'\n'+
'\n'+
'Search for relevant and currently available jobs, preferably from reliable job portals such as Bdjobs.com and official company career pages.\n'+
'For each suitable job, provide:\n'+
'1. Job Title\n'+
'2. Company Name\n'+
'3. Location\n'+
'4. Salary\n'+
'5. Required Experience\n'+
'6. Educational Requirements\n'+
'7. Application Deadline\n'+
'8. Key Skills/Requirements\n'+
'9. Direct Application Link\n'+
'\n'+
'Prioritize jobs that closely match the candidate\'s age, experience, preferred position, location, and salary expectations. If an exact match is unavailable, include the closest relevant opportunities and clearly explain which requirement differs.\n'+
'Please provide at least 20 suitable job opportunities if available, ranked from the best match to the least match.';

      var url='https://chatgpt.com/?q='+encodeURIComponent(prompt);
      window.open(url,'_blank','noopener,noreferrer');
      closeModal();
    });
  }
})();
