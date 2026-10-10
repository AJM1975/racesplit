(()=>{
 const root=document.documentElement,storageKey='racesplit-appearance-v1';
 let controlsOpen=false,settings={design:'refresh',theme:'auto',raceMode:false};
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved){settings.theme=['auto','light','dark'].includes(saved.theme)?saved.theme:'auto';}}catch{}
 const apply=()=>{root.dataset.design=settings.design;root.dataset.theme=settings.theme;root.dataset.raceMode=settings.design==='refresh'&&settings.raceMode?'on':'off';};apply();
 const init=()=>{
 const theme=document.getElementById('themeChoice'),race=document.getElementById('raceMode');
 if(!theme||!race)return;
 const context=window.raceSplitBridge?.getTimingContext();settings.raceMode=!!context?.start&&!context.finished;
 const buttons=[...theme.querySelectorAll("button[data-theme]")];
 const themeToggle=document.getElementById('themeMenuToggle'),themeControl=theme.closest('.theme-control');
 const closeTheme=()=>{themeControl.classList.remove('is-open');themeToggle?.setAttribute('aria-expanded','false');};
 if(themeToggle){themeToggle.onclick=()=>{const open=themeControl.classList.toggle('is-open');themeToggle.setAttribute('aria-expanded',String(open));};document.addEventListener('click',event=>{if(!themeControl.contains(event.target))closeTheme();});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&themeControl.classList.contains('is-open')){closeTheme();themeToggle.focus();}});}
 const setup=document.getElementById('revealRaceSetup');const syncControls=()=>{controlsOpen=!settings.raceMode;root.dataset.raceControls=controlsOpen?'open':'closed';if(setup){setup.setAttribute('aria-expanded',String(controlsOpen));setup.setAttribute('aria-label','Open event, athlete and Goal / PR setup');}};
 const update=()=>{apply();theme.dataset.selected=settings.theme;for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.theme===settings.theme));race.setAttribute('aria-pressed',String(settings.raceMode));race.textContent='Race view';race.setAttribute('aria-label','Switch to high-visibility race view');document.getElementById('appearanceStatus').textContent=settings.raceMode?'Race view · high visibility':settings.theme==='auto'?'Appearance follows your device':settings.theme+' appearance';document.getElementById('favicon').href='/brand/rs.svg';const meta=document.querySelector('meta[name=theme-color]');meta.content=settings.theme==='dark'||(settings.theme==='auto'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches)?(settings.raceMode?'#000000':'#101722'):'#F7F8FA';try{localStorage.setItem(storageKey,JSON.stringify(settings));}catch{}};
 const updateThemeToggle=()=>{if(themeToggle){themeToggle.dataset.selected=settings.theme;themeToggle.setAttribute('aria-label','Appearance: '+(settings.theme==='auto'?'automatic':settings.theme));}};
 for(const button of buttons)button.onclick=()=>{settings.theme=button.dataset.theme;update();updateThemeToggle();closeTheme();};race.onclick=()=>{settings.raceMode=true;syncControls();update();};if(setup)setup.onclick=()=>{settings.raceMode=false;syncControls();update();document.getElementById('setupPanel')?.scrollIntoView?.({block:'nearest',behavior:'instant'});};window.addEventListener('racesplit-start',()=>{settings.raceMode=true;controlsOpen=false;syncControls();update();});window.addEventListener('racesplit-view',()=>{syncControls();});window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',update);syncControls();update();updateThemeToggle();
 };if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
