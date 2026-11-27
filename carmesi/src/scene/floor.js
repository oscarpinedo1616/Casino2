import * as THREE from 'three';

/* Escena 3D del comedor. Imperativa (Three.js r128) y sin estado de React:
   la app la controla con la API que devuelve createRestaurant(). */
export function createRestaurant({canvas,stage,pinsEl,config,getPanelWidth,onPickTable,onPickZone,onReady,onInteract,onHover=()=>{}}){
 const CONFIG=config;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,coarse=matchMedia('(pointer:coarse)').matches;
 const wide=()=>innerWidth>960;
 const st={hour:config.hour||21.5,hourFast:false,mode:'tour',tour:null,uth:0,uph:0,mx:0,my:0,pmx:0,pmy:0,dragging:false,yaw:0,pitch:0};

 const TH=THREE;const cv=canvas;
 const R=new TH.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance',logarithmicDepthBuffer:!coarse});
 R.setPixelRatio(Math.min(devicePixelRatio,coarse?1.5:2));
 R.outputEncoding=TH.sRGBEncoding;R.toneMapping=TH.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
 R.shadowMap.enabled=true;R.shadowMap.type=TH.PCFSoftShadowMap;
 const scene=new TH.Scene();scene.background=new TH.Color('#0c090b');scene.fog=new TH.Fog('#0c090b',36,72);
 const cam=new TH.PerspectiveCamera(38,1,.5,120);
 let sd=11;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
 const aniso=Math.min(8,R.capabilities.getMaxAnisotropy());
 /* entorno para reflejos */
 const pm=new TH.PMREMGenerator(R),env=new TH.Scene(),eg=new TH.BoxGeometry(1,1,1);
 env.add(new TH.Mesh(new TH.BoxGeometry(24,10,24),new TH.MeshBasicMaterial({color:'#3a2c20',side:TH.BackSide})));
 [['#fff0d8',5,0,4.9,0,10,.1,10],['#ffbe78',4,-11.9,2,0,.1,4,12],['#cfe1ff',3,0,2,-11.9,10,4,.1],['#ffd9a8',2,11.9,2,0,.1,4,12]].forEach(([c,i,x,y,z,a,b,d])=>{const m=new TH.Mesh(eg,new TH.MeshBasicMaterial({color:new TH.Color(c).multiplyScalar(i)}));m.position.set(x,y,z);m.scale.set(a,b,d);env.add(m)});
 scene.environment=pm.fromScene(env,.04).texture;pm.dispose();
 /* texturas */
 const ctex=(size,draw,rx,ry,srgb=true)=>{const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new TH.CanvasTexture(c);t.wrapS=t.wrapT=TH.RepeatWrapping;t.repeat.set(rx,ry);if(srgb)t.encoding=TH.sRGBEncoding;t.anisotropy=aniso;return t};
 /* moqueta de casino: rojo profundo con motivos dorados y verde */
 const carpetDraw=bump=>(g,s)=>{g.fillStyle=bump?'#7a7a7a':'#4a0f18';g.fillRect(0,0,s,s);const q=s/4;
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const cx=i*q+q/2,cy=j*q+q/2;
   g.save();g.translate(cx,cy);g.rotate(Math.PI/4);g.strokeStyle=bump?'#a0a0a0':'rgba(212,166,74,.85)';g.lineWidth=q*.035;g.strokeRect(-q*.28,-q*.28,q*.56,q*.56);
   g.fillStyle=bump?'#999':'rgba(20,70,62,.9)';g.fillRect(-q*.12,-q*.12,q*.24,q*.24);g.restore();
   g.fillStyle=bump?'#aaa':'rgba(212,166,74,.75)';g.beginPath();g.arc(i*q,j*q,q*.09,0,Math.PI*2);g.fill();
   for(let k=0;k<6;k++){const a=k*Math.PI/3;g.beginPath();g.arc(cx+Math.cos(a)*q*.42,cy+Math.sin(a)*q*.42,q*.025,0,Math.PI*2);g.fill()}}
  for(let n=0;n<9000;n++){g.fillStyle=bump?`rgba(0,0,0,${rnd()*.25})`:`rgba(${rnd()<.5?'0,0,0':'120,30,40'},${rnd()*.18})`;g.fillRect(rnd()*s,rnd()*s,2,2)}};
 const tileT=ctex(1024,carpetDraw(false),6,4),tileB=ctex(1024,carpetDraw(true),6,4,false);
 const chkT=ctex(256,(g,s)=>{const q=s/4;for(let i=0;i<4;i++)for(let j=0;j<4;j++){g.fillStyle=(i+j)%2?'#2a2024':'#151013';g.fillRect(i*q,j*q,q,q)}g.strokeStyle='rgba(212,166,74,.5)';g.lineWidth=2;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*q,0);g.lineTo(i*q,s);g.moveTo(0,i*q);g.lineTo(s,i*q);g.stroke()}},5.8/1.2,3.4/1.2);
 const woodDraw=bump=>(g,s)=>{g.fillStyle=bump?'#888':'#6e4327';g.fillRect(0,0,s,s);for(let i=0;i<160;i++){const y=rnd()*s;g.strokeStyle=bump?`rgba(0,0,0,${.1+rnd()*.3})`:`rgba(${rnd()<.5?'35,18,8':'150,95,55'},${.15+rnd()*.25})`;g.lineWidth=1+rnd()*3;g.beginPath();for(let x=0;x<=s;x+=16)g.lineTo(x,y+Math.sin(x*.02+i)*4);g.stroke()}};
 const woodT=ctex(512,woodDraw(false),1,1),woodB=ctex(512,woodDraw(true),1,1,false);
 const plasDraw=bump=>(g,s)=>{g.fillStyle=bump?'#808080':'#ece5d8';g.fillRect(0,0,s,s);for(let k=0;k<4000;k++){g.fillStyle=`rgba(${rnd()<.5?(bump?'0,0,0':'120,100,80'):'255,255,255'},${rnd()*.08})`;const r=2+rnd()*6;g.fillRect(rnd()*s,rnd()*s,r,r)}};
 const plasT=ctex(512,plasDraw(false),4,1),plasB=ctex(512,plasDraw(true),4,1,false);
 const radial=(inner,outer)=>ctex(128,(g,s)=>{const gr=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);gr.addColorStop(0,inner);gr.addColorStop(1,outer);g.fillStyle=gr;g.fillRect(0,0,s,s)},1,1);
 const glowT=radial('rgba(255,255,255,1)','rgba(255,255,255,0)'),aoT=radial('rgba(0,0,0,.75)','rgba(0,0,0,0)'),smokeT=radial('rgba(200,195,185,.55)','rgba(200,195,185,0)');
 const M=(c,o={})=>new TH.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o));
 const mat={floor:M('#ffffff',{map:tileT,bumpMap:tileB,bumpScale:.01,roughness:.95}),chk:M('#ffffff',{map:chkT,roughness:.3,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
  wood:M('#ffffff',{map:woodT,bumpMap:woodB,bumpScale:.004,roughness:.35}),woodD:M('#24120c',{roughness:.35}),
  wall:M('#43121b',{map:plasT,bumpMap:plasB,bumpScale:.01,roughness:.9,shadowSide:TH.DoubleSide}),olive:M('#140b0e',{roughness:.3,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
  cloth:M('#f6f1e6',{roughness:.95,side:TH.DoubleSide}),plate:M('#ffffff',{roughness:.18}),
  glass:M('#ffffff',{roughness:.04,metalness:.05,transparent:true,opacity:.22,side:TH.DoubleSide,envMapIntensity:2}),wine:M('#4a0d14',{roughness:.1,transparent:true,opacity:.92}),
  steel:M('#c4c4bf',{metalness:.9,roughness:.28}),black:M('#1b1b19',{metalness:.6,roughness:.4,side:TH.DoubleSide}),copper:M('#c0703f',{metalness:1,roughness:.3}),
  gold:M('#d4a64a',{metalness:1,roughness:.28}),felt:M('#0a3a28',{roughness:1}),feltB:M('#123a6a',{roughness:.95}),rail:M('#1a0d0a',{roughness:.35}),velvet:M('#7a0f1f',{roughness:.85,side:TH.DoubleSide}),
  neon:M('#000000',{emissive:'#ff2a4a',emissiveIntensity:2}),neonG:M('#000000',{emissive:'#ffc15a',emissiveIntensity:2}),
  brick:M('#8a4a33',{roughness:.95}),clay:M('#b8714f',{roughness:.95}),leather:M('#7a1222',{roughness:.5}),pot:M('#2a1a14',{roughness:.4,metalness:.3}),log:M('#5c3b24',{roughness:.95}),
  bulb:M('#000000',{emissive:'#ffcf8a',emissiveIntensity:3}),flame:M('#000000',{emissive:'#ffb347',emissiveIntensity:3}),fire:M('#000000',{emissive:'#ff6a20',emissiveIntensity:2.6}),
  glassW:new TH.MeshBasicMaterial({color:'#d6ebf2'}),plinth:M('#1a1214',{roughness:.9})};
 const add=(geo,m,x,y,z,p=scene)=>{const o=new TH.Mesh(geo,m);o.position.set(x,y,z);p.add(o);return o};
 const box=(w,h,d,m,x,y,z,p)=>add(new TH.BoxGeometry(w,h,d),m,x,y,z,p);
 const cyl=(a,b,h,m,x,y,z,p,seg=28)=>add(new TH.CylinderGeometry(a,b,h,seg),m,x,y,z,p);
 const glows=[];
 const glow=(x,y,z,s,color,group='bulb',p=scene)=>{const m=new TH.SpriteMaterial({map:glowT,color,blending:TH.AdditiveBlending,depthWrite:false,transparent:true});const sp=new TH.Sprite(m);sp.position.set(x,y,z);sp.scale.set(s,s,1);p.add(sp);glows.push({sp,group,s});return sp};
 const ao=(x,z,w,d,o=.55)=>{const m=add(new TH.PlaneGeometry(w,d),new TH.MeshBasicMaterial({map:aoT,transparent:true,depthWrite:false,opacity:o,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),x,.006,z);m.rotation.x=-Math.PI/2;m.userData.noShadow=1};
 /* suelo y paredes */
 box(16.6,.5,10.6,mat.plinth,0,-.29,0);
 const fl=add(new TH.PlaneGeometry(16,10),mat.floor,0,0,0);fl.rotation.x=-Math.PI/2;
 const kf=add(new TH.PlaneGeometry(5.8,3.4),mat.chk,-5.1,.012,-3.3);kf.rotation.x=-Math.PI/2;
 const H=3;
 const wall=(w,x,z,ry)=>{const g=new TH.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);
  add(new TH.PlaneGeometry(w,H),mat.wall,0,H/2,0,g);add(new TH.PlaneGeometry(w,1.1),mat.olive,0,.55,.02,g);box(w,.05,.05,mat.gold,0,1.12,.035,g);box(w,.12,.22,mat.plinth,0,H+.06,-.11,g);box(w,.03,.03,mat.neon,0,H-.08,.03,g)};
 wall(16,0,-5,0);wall(10,-8,0,Math.PI/2);wall(10,8,0,-Math.PI/2);
 /* escenario: telón de terciopelo entre pilastras doradas (los casinos no tienen ventanas) */
 const shaftM=new TH.MeshBasicMaterial({transparent:true,opacity:0});
 const dustG=new TH.BufferGeometry(),dp=[];for(let i=0;i<260;i++)dp.push((rnd()-.5)*4.6,(rnd()-.5)*2.4,(rnd()-.5)*1.2);dustG.setAttribute('position',new TH.Float32BufferAttribute(dp,3));
 const dustM=new TH.PointsMaterial({size:.035,map:glowT,color:'#ffd27a',transparent:true,opacity:.7,depthWrite:false,blending:TH.AdditiveBlending});
 const dust=new TH.Points(dustG,dustM);dust.position.set(.85,1.5,-4.3);scene.add(dust);
 const curT=ctex(256,(g,s)=>{for(let x=0;x<s;x++){const v=.55+.45*Math.sin(x/s*Math.PI*14);g.fillStyle=`rgb(${Math.round(120*v+20)},${Math.round(12*v+4)},${Math.round(24*v+8)})`;g.fillRect(x,0,1,s)}},1,1);
 const curM=M('#ffffff',{map:curT,roughness:.8});
 box(4.6,.06,.5,mat.black,.85,.03,-4.72);box(4.6,.24,.5,M('#1a0d0a',{roughness:.4}),.85,.12,-4.72);box(4.6,.02,.5,mat.gold,.85,.25,-4.72);
 add(new TH.PlaneGeometry(4.2,2.2),curM,.85,1.37,-4.95);
 [-1.4,3.1].forEach(x=>{box(.22,2.6,.18,mat.gold,x,1.3,-4.9)});
 const stageL=new TH.SpotLight('#ffd9a0',2.2,9,.55,.6,1.5);stageL.position.set(.85,2.9,-2);stageL.target.position.set(.85,.8,-4.9);scene.add(stageL,stageL.target);
 /* araña de luces */
 const chand=(x,z)=>{cyl(.008,.008,.5,mat.gold,x,2.75,z,scene,6);const r1=add(new TH.TorusGeometry(.42,.02,8,40),mat.gold,x,2.5,z);r1.rotation.x=Math.PI/2;const r2=add(new TH.TorusGeometry(.26,.02,8,32),mat.gold,x,2.35,z);r2.rotation.x=Math.PI/2;
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;add(new TH.SphereGeometry(.04,10,8),mat.bulb,x+Math.cos(a)*.42,2.55,z+Math.sin(a)*.42);glow(x+Math.cos(a)*.42,2.55,z+Math.sin(a)*.42,.22,'#ffd08a')}
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,rr=i%2?.26:.42;const c=add(new TH.OctahedronGeometry(.03,0),M('#ffffff',{roughness:0,metalness:.1,transparent:true,opacity:.7,envMapIntensity:3}),x+Math.cos(a)*rr,rr>.3?2.4:2.25,z+Math.sin(a)*rr);c.scale.y=2;c.userData.noShadow=1}
  glow(x,2.4,z,.75,'#ffcf8a')};
 chand(-.6,1.1);chand(3.6,1.1);
 /* letrero con bombillas */
 const signC=document.createElement('canvas');signC.width=1024;signC.height=160;
 const signT=new TH.CanvasTexture(signC);signT.encoding=TH.sRGBEncoding;
 const drawSign=()=>{const g=signC.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,1024,160);g.fillStyle='#fff';let fs=92;g.font=fs+'px Boska, Georgia, serif';const tw0=g.measureText(CONFIG.name).width;if(tw0>940){fs=Math.floor(fs*940/tw0);g.font=fs+'px Boska, Georgia, serif'}g.textAlign='center';g.textBaseline='middle';g.fillText(CONFIG.name,512,84);signT.needsUpdate=true};
 drawSign();if(document.fonts)document.fonts.ready.then(drawSign);
 box(3.1,.56,.05,mat.gold,.85,2.72,-4.96);box(2.98,.46,.04,M('#120a0c',{roughness:.4}),.85,2.72,-4.94);
 const signM=M('#151210',{emissive:'#ffd29a',emissiveMap:signT,emissiveIntensity:1,roughness:.6});
 add(new TH.PlaneGeometry(2.8,.4),signM,.85,2.72,-4.915);
 const signBulbs=[];for(let i=0;i<26;i++){const t=i/26,per=2*(3.0+.5);let d=t*per,x,y;if(d<3){x=-1.5+d;y=.25}else if(d<3.5){x=1.5;y=.25-(d-3)}else if(d<6.5){x=1.5-(d-3.5);y=-.25}else{x=-1.5;y=-.25+(d-6.5)}
  const b=add(new TH.SphereGeometry(.022,8,6),M('#000',{emissive:'#ffd27a',emissiveIntensity:3}),.85+x,2.72+y,-4.9);signBulbs.push(b.material)}
 /* cuadros con fotos */
 const tl=new TH.TextureLoader();tl.setCrossOrigin('anonymous');
 CONFIG.frames.forEach(([key,x,z],i)=>{const g=new TH.Group();g.position.set(x,1.85,z);g.rotation.y=x<0?Math.PI/2:-Math.PI/2;scene.add(g);
  box(1.0,1.3,.05,mat.woodD,0,0,0,g);box(.92,1.22,.02,M('#f4efe4',{roughness:.9}),0,0,.03,g);
  const art=ctex(256,(c,s)=>{const gr=c.createLinearGradient(0,0,s,s);gr.addColorStop(0,['#7a3d22','#3b4e2e','#b5603d','#2e3a4a'][i%4]);gr.addColorStop(1,'#e8c49a');c.fillStyle=gr;c.fillRect(0,0,s,s)},1,1);
  const pm2=M('#ffffff',{map:art,roughness:.5});add(new TH.PlaneGeometry(.76,1.04),pm2,0,0,.045,g);
  const u=CONFIG.photos[key];if(u)tl.load(u,t=>{t.encoding=TH.sRGBEncoding;const ia=t.image.width/t.image.height,fa=.76/1.04;if(ia>fa){t.repeat.set(fa/ia,1);t.offset.set((1-fa/ia)/2,0)}else{t.repeat.set(1,ia/fa);t.offset.set(0,(1-ia/fa)/2)}pm2.map=t;pm2.needsUpdate=true},undefined,()=>{})});
 /* máquinas tragaperras (donde estaba la cocina) */
 box(5.8,1,.55,M('#1a1214',{roughness:.4}),-5.1,.5,-1.6);box(5.9,.05,.66,mat.gold,-5.1,1.03,-1.6);
 const kitchen=new TH.Group();scene.add(kitchen);kitchen.userData.go='mesas';kitchen.userData.cat='';
 const SYM=['7','BAR','♦','★','♣','7','♥','$'],SC=['#ff3040','#ffd040','#40d0ff','#ffd040','#60ff90','#ff3040','#ff60c0','#60ff90'];
 const reelC=document.createElement('canvas');reelC.width=128;reelC.height=1024;{const g=reelC.getContext('2d');g.fillStyle='#fbf6ea';g.fillRect(0,0,128,1024);g.textAlign='center';g.textBaseline='middle';
  SYM.forEach((s,i)=>{g.fillStyle=SC[i];g.font=(s.length>1?'bold 44px':'bold 92px')+' Georgia, serif';g.fillText(s,64,i*128+66);g.fillStyle='rgba(0,0,0,.08)';g.fillRect(0,i*128+124,128,4)})}
 const slots=[];
 const slot=(x,z,ry)=>{const g=new TH.Group();g.position.set(x,0,z);g.rotation.y=ry;kitchen.add(g);
  box(.56,.95,.5,M('#1c1418',{roughness:.35,metalness:.3}),0,.475,0,g);box(.6,.05,.54,mat.gold,0,.96,0,g);
  box(.56,.62,.36,M('#2a1c22',{roughness:.3,metalness:.3}),0,1.27,-.05,g);box(.58,.12,.4,mat.gold,0,1.62,-.05,g);
  const top=M('#000',{emissive:'#ff3040',emissiveIntensity:1.1});box(.46,.1,.2,top,0,1.72,-.05,g);
  const reels=[];for(let k=0;k<3;k++){const t=new TH.CanvasTexture(reelC);t.encoding=TH.sRGBEncoding;t.wrapT=TH.RepeatWrapping;t.repeat.set(1,1/8*1.4);t.offset.y=Math.floor(rnd()*8)/8;
   const m=M('#ffffff',{map:t,emissive:'#ffffff',emissiveMap:t,emissiveIntensity:.55,roughness:.3});add(new TH.PlaneGeometry(.14,.2),m,-.16+k*.16,1.3,.131,g);reels.push({t,from:t.offset.y,to:t.offset.y,t0:0})}
  box(.5,.3,.02,M('#0a0608',{roughness:.2}),0,1.3,.125,g);
  const lever=cyl(.012,.012,.32,mat.steel,.31,1.3,.0,g,8);add(new TH.SphereGeometry(.035,10,8),M('#d01830',{roughness:.3}),.31,1.47,0,g);lever;
  for(let k=0;k<3;k++)box(.07,.025,.05,M('#000',{emissive:['#ffd040','#40d0ff','#ff3040'][k],emissiveIntensity:1.6}),-.12+k*.12,.99,.16,g);
  cyl(.17,.15,.04,mat.leather,0,.62,.55,g,20);cyl(.025,.025,.6,mat.gold,0,.3,.55,g,8);cyl(.17,.19,.03,mat.gold,0,.015,.55,g,20);
  slots.push({top,reels,next:1+rnd()*5,hue:rnd()})};
 for(let i=0;i<8;i++)slot(-7.45+i*.68,-4.55,0);
 for(let i=0;i<6;i++){slot(-6.9+i*.68,-3.05,Math.PI);}
 box(4.2,.95,.18,M('#140d10',{roughness:.4}),-5.2,.475,-2.95,kitchen);
 const ovenL=new TH.PointLight('#ff4060',1.6,7,2);ovenL.position.set(-5.1,1.8,-3.6);scene.add(ovenL);
 const grillL=new TH.PointLight('#ffc060',.9,5,2);grillL.position.set(-5.1,1.6,-2.2);scene.add(grillL);
 /* caja (cambio de fichas) junto a las máquinas */
 box(1.2,1.1,.5,M('#1a1214',{roughness:.35}),-7.3,.55,-1.6,kitchen);box(1.24,.06,.56,mat.gold,-7.3,1.12,-1.6,kitchen);
 for(let i=0;i<5;i++)box(.02,.7,.02,mat.gold,-7.85+i*.27,1.5,-1.6,kitchen);
 const smokes=[];
 /* barra */
 const bar=new TH.Group();scene.add(bar);bar.userData.go='carta';bar.userData.cat='cocteles';
 box(4.4,1.05,.6,mat.wood,5.6,.525,-3.1,bar);box(4.6,.06,.78,M('#24170f',{roughness:.22}),5.6,1.08,-3.1,bar);
 const rail=cyl(.025,.025,4.4,mat.steel,5.6,.22,-2.76,bar);rail.rotation.z=Math.PI/2;
 [1.45,2.05].forEach(y=>{box(4.6,.05,.3,mat.woodD,5.6,y,-4.83,bar);for(let i=0;i<18;i++){const c=['#4a1420','#22401e','#c4a046','#5e2412','#2f2f2f'][Math.floor(rnd()*5)];const bm=M(c,{roughness:.08,metalness:.1});cyl(.045,.045,.26,bm,3.55+i*.24,y+.155,-4.83,bar,14);cyl(.015,.02,.09,bm,3.55+i*.24,y+.33,-4.83,bar,10)}});
 [4.6,4.9,5.2].forEach(x=>{cyl(.025,.025,.32,mat.steel,x,1.27,-3.25,bar,12);box(.03,.12,.03,mat.woodD,x,1.47,-3.22,bar)});
 for(let i=0;i<6;i++){const x=3.8+i*.72;cyl(.2,.2,.07,mat.leather,x,.76,-2.42,bar);cyl(.03,.03,.72,mat.steel,x,.38,-2.42,bar);cyl(.2,.22,.03,mat.steel,x,.015,-2.42,bar)}
 const lamps=[];
 const barL=new TH.PointLight('#ffc685',.8,6,2);barL.position.set(5.6,2.3,-3);scene.add(barL);lamps.push(barL);
 [4.4,5.6,6.8].forEach(x=>{cyl(.006,.006,.6,mat.black,x,2.7,-3.1,scene,6);add(new TH.SphereGeometry(.11,20,14),M('#fff4e0',{emissive:'#ffcf8a',emissiveIntensity:1.5,roughness:.3}),x,2.35,-3.1);glow(x,2.35,-3.1,.8,'#ffbf70')});
 /* sillas, mesas de juego, copas y fichas */
 const glassGeo=new TH.LatheGeometry([[0,0],[.032,0],[.032,.005],[.004,.012],[.004,.075],[.02,.09],[.038,.12],[.04,.15],[.036,.18]].map(([x,y])=>new TH.Vector2(x,y)),20);
 const chair=(x,z,p,face)=>{const g=new TH.Group();g.position.set(x,0,z);g.rotation.y=face!==undefined?face:Math.atan2(-x,-z);p.add(g);
  cyl(.22,.21,.08,mat.leather,0,.48,0,g,24);cyl(.2,.2,.02,mat.gold,0,.43,0,g,24);
  for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2;cyl(.014,.012,.43,mat.gold,Math.cos(a)*.14,.215,Math.sin(a)*.14,g,8)}
  const bk=box(.38,.4,.07,mat.leather,0,.74,-.19,g);bk.rotation.x=-.12;box(.4,.03,.08,mat.gold,0,.95,-.215,g)};
 const clothGeo=r=>{const pts=[[0,.778],[r+.06,.778],[r+.1,.77],[r+.115,.74],[r+.125,.62],[r+.135,.5]].map(([x,y])=>new TH.Vector2(x,y));return new TH.LatheGeometry(pts,64)};
 const pendant=(x,z)=>{cyl(.006,.006,.7,mat.gold,x,2.85,z,scene,6);add(new TH.ConeGeometry(.2,.22,24,1,true),mat.gold,x,2.4,z);add(new TH.SphereGeometry(.06,12,8),mat.bulb,x,2.31,z);glow(x,2.27,z,.7,'#ffc27a')};
 const tableLamp=(x,z,w,ry)=>{const g=new TH.Group();g.position.set(x,0,z);g.rotation.y=ry||0;scene.add(g);[-w/2+.1,w/2-.1].forEach(a=>cyl(.005,.005,.6,mat.gold,a,2.7,0,g,6));
  box(w,.14,.42,M('#120a0c',{roughness:.4}),0,2.36,0,g);box(w+.02,.02,.44,mat.gold,0,2.44,0,g);box(w-.08,.01,.34,mat.bulb,0,2.285,0,g);
  for(let i=0;i<3;i++)glow(-w/3+i*w/3,2.25,0,.6,'#ffd9a0',undefined,g)};
 const chipC=['#c8102e','#111111','#0f7a4a','#1f4fb8','#e9e2d0','#7a2a9a'];
 const chipMats=chipC.map(c=>M(c,{roughness:.45}));
 const chips=(x,z,p,n,deco)=>{for(let s=0;s<n;s++){const h=2+Math.floor(rnd()*6),m=chipMats[Math.floor(rnd()*chipMats.length)],ox=x+(s%2)*.045,oz=z+Math.floor(s/2)*.045;
  const c=cyl(.02,.02,h*.007,m,ox,.79+h*.0035,oz,p,16);deco.push(c)}};
 const card=(x,z,ry,p,deco)=>{const c=box(.05,.002,.072,M('#fbf8f0',{roughness:.5}),x,.786,z,p);c.rotation.y=ry;deco.push(c)};
 /* ruleta: paño con números y rueda que gira */
 const rouletteT=ctex(512,(g,s)=>{g.fillStyle='#0b4430';g.fillRect(0,0,s,s);const w=s/14,h=s/3.4;g.font='bold '+(w*.5)+'px Georgia';g.textAlign='center';g.textBaseline='middle';
  const red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  g.strokeStyle='#f3ead2';g.lineWidth=2;g.strokeRect(w*.2,s*.12,w*1,h*3*.72);g.fillStyle='#f3ead2';g.save();g.translate(w*.7,s*.12+h*1.08);g.rotate(-Math.PI/2);g.fillText('0',0,0);g.restore();
  for(let c=0;c<12;c++)for(let r=0;r<3;r++){const n=c*3+(3-r);const x=w*1.2+c*w,y=s*.12+r*h*.72;g.strokeRect(x,y,w,h*.72);g.beginPath();g.ellipse(x+w/2,y+h*.36,w*.32,w*.32,0,0,Math.PI*2);g.fillStyle=red.includes(n)?'#c8102e':'#151515';g.fill();g.fillStyle='#f3ead2';g.fillText(n,x+w/2,y+h*.36)}
  ['1-18','PAR','◆','◆','IMPAR','19-36'].forEach((t,i)=>{const x=w*1.2+i*2*w,y=s*.12+h*2.2;g.strokeRect(x,y,w*2,h*.5);g.fillStyle=t==='◆'?(i===2?'#c8102e':'#151515'):'#f3ead2';g.fillText(t,x+w,y+h*.25)})},1,1);
 const wheelT=ctex(512,(g,s)=>{const c=s/2;g.fillStyle='#3a1a0c';g.fillRect(0,0,s,s);for(let i=0;i<37;i++){const a0=i/37*Math.PI*2,a1=(i+1)/37*Math.PI*2;g.beginPath();g.moveTo(c,c);g.arc(c,c,c*.95,a0,a1);g.closePath();g.fillStyle=i===0?'#0f7a4a':i%2?'#c8102e':'#151515';g.fill()}
  g.beginPath();g.arc(c,c,c*.62,0,Math.PI*2);g.fillStyle='#5a3518';g.fill();g.beginPath();g.arc(c,c,c*.22,0,Math.PI*2);g.fillStyle='#d4a64a';g.fill();
  g.strokeStyle='#d4a64a';g.lineWidth=6;for(let i=0;i<4;i++){const a=i*Math.PI/2;g.beginPath();g.moveTo(c+Math.cos(a)*c*.22,c+Math.sin(a)*c*.22);g.lineTo(c+Math.cos(a)*c*.6,c+Math.sin(a)*c*.6);g.stroke()}},1,1);
 const wheels=[];
 const GAME={
  ruleta:(t,g,deco,seats)=>{const w=2.1,d=.95;box(w+.14,.12,d+.14,mat.rail,0,.72,0,g);box(w,.02,d,M('#ffffff',{map:rouletteT,roughness:.95}),0,.785,0,g);box(w,.66,d-.1,mat.woodD,0,.33,0,g);
   const wh=new TH.Group();wh.position.set(-w/2-.32,.78,0);g.add(wh);cyl(.42,.36,.16,mat.woodD,0,-.04,0,wh,40);const tor=add(new TH.TorusGeometry(.38,.03,8,40),mat.gold,0,.04,0,wh);tor.rotation.x=Math.PI/2;
   const disk=cyl(.34,.34,.02,M('#ffffff',{map:wheelT,roughness:.35,metalness:.2}),0,.045,0,wh,48);const spindle=cyl(.02,.02,.14,mat.gold,0,.12,0,wh,10);spindle;
   const ball=add(new TH.SphereGeometry(.018,12,10),M('#ffffff',{roughness:.1}),.3,.07,0,wh);wheels.push({disk,ball,a:rnd()*6,b:rnd()*6});
   [-.6,0,.6].forEach(x=>{chair(x,d/2+.42,g,Math.PI);seats.push([x,d/2+.42])});chair(w/2+.42,0,g,-Math.PI/2);seats.push([w/2+.42,0]);
   chips(-.3,.15,g,4,deco);chips(.5,-.1,g,3,deco);chips(-.2,-.38,g,6,deco);
   tableLamp(t.x-.2,t.z,2.4);return 1.65},
  blackjack:(t,g,deco,seats)=>{const r=.85;const top=add(new TH.CylinderGeometry(r,r,.03,48,1,false,-Math.PI/2,Math.PI),mat.felt,0,.77,0,g);top;
   const rl=add(new TH.TorusGeometry(r,.05,10,48,Math.PI),mat.rail,0,.79,0,g);rl.rotation.x=Math.PI/2;
   box(2*r,.1,.08,mat.rail,0,.74,-.02,g);add(new TH.CylinderGeometry(r-.04,r-.04,.7,48,1,false,-Math.PI/2,Math.PI),mat.woodD,0,.38,0,g);
   const tray=box(.5,.05,.16,mat.black,0,.8,.12,g);tray;for(let i=0;i<8;i++)deco.push(cyl(.018,.018,.04,chipMats[i%6],-.21+i*.06,.82,.12,g,12));
   for(let i=0;i<5;i++){const a=Math.PI*(.12+i*.19);const sx=Math.cos(a)*(r+.4),sz=Math.sin(a)*(r+.4);chair(sx,sz,g);seats.push([sx,sz]);
    const cx=Math.cos(a)*(r-.25),cz=Math.sin(a)*(r-.25);card(cx-.02,cz,a,g,deco);card(cx+.02,cz+.01,a+.2,g,deco);chips(Math.cos(a)*(r-.45),Math.sin(a)*(r-.45),g,1,deco)}
   chair(0,-.5,g,0);tableLamp(t.x,t.z+.25,1.8);return r+.75},
  poker:(t,g,deco,seats)=>{const rx=1.05,rz=.6;const top=cyl(1,1,.03,mat.felt,0,.77,0,g,64);top.scale.set(rx,1,rz);const rl=add(new TH.TorusGeometry(1,.06,10,64),mat.rail,0,.79,0,g);rl.rotation.x=Math.PI/2;rl.scale.set(rx,rz,1);
   const base=cyl(.35,.5,.75,mat.woodD,0,.375,0,g,24);base.scale.set(1.6,1,1);
   const n=t.n||8;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+Math.PI/n;const sx=Math.cos(a)*(rx+.45),sz=Math.sin(a)*(rz+.45);chair(sx,sz,g);seats.push([sx,sz]);
    card(Math.cos(a)*(rx-.22),Math.sin(a)*(rz-.16),a,g,deco);chips(Math.cos(a)*(rx-.42)*.95,Math.sin(a)*(rz-.3),g,2,deco)}
   for(let i=0;i<5;i++)card(-.16+i*.08,0,0,g,deco);chips(.05,.14,g,3,deco);
   tableLamp(t.x,t.z,2.2);return rx+.85},
  restaurante:(t,g,deco,seats)=>{const r=t.n<=2?.42:.58;add(clothGeo(r),mat.cloth,0,0,0,g);cyl(.05,.18,.48,mat.woodD,0,.24,0,g,12);
   for(let i=0;i<t.n;i++){const a=i*2*Math.PI/t.n+(t.n===4?Math.PI/4:0);chair(Math.cos(a)*(r+.4),Math.sin(a)*(r+.4),g);seats.push([Math.cos(a)*(r+.4),Math.sin(a)*(r+.4)]);
    const x=Math.cos(a)*(r-.13),z=Math.sin(a)*(r-.13);cyl(.12,.1,.015,mat.plate,x,.79,z,g);const gl=add(glassGeo,mat.glass,x*.62+z*.28,.778,z*.62-x*.28,g);gl.userData.noShadow=1;deco.push(gl)}
   deco.push(cyl(.03,.03,.09,mat.plate,0,.83,0,g,10),add(new TH.SphereGeometry(.018,8,6),mat.flame,0,.89,0,g),glow(0,.9,0,.28,'#ffb347','candle',g));
   pendant(t.x,t.z);return r+.85},
 };
 const tables={};
 config.tables.forEach(t=>{
  const g=new TH.Group();g.position.set(t.x,0,t.z);g.rotation.y=t.ry||0;g.userData.id=t.id;scene.add(g);tables[t.id]=g;const deco=[],seats=[];
  const kind=GAME[t.g]?t.g:(t.rect?'ruleta':'restaurante');
  const rr=GAME[kind](t,g,deco,seats);g.userData.deco=deco;g.userData.seats=seats;g.userData.kind=kind;
  ao(t.x,t.z,rr*2.2,rr*2.2,.5);
  if(t.vip){[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const px=a*(rr+.15),pz=b*(rr*.75);cyl(.03,.035,.9,mat.gold,px,.45,pz,g,12);add(new TH.SphereGeometry(.05,12,8),mat.gold,px,.93,pz,g)});
   [[-1,-1,1,-1],[-1,1,1,1]].forEach(([a,b,c,d])=>{const x0=a*(rr+.15),z0=b*(rr*.75),x1=c*(rr+.15);const curve=new TH.QuadraticBezierCurve3(new TH.Vector3(x0,.85,z0),new TH.Vector3(0,.62,z0),new TH.Vector3(x1,.85,z0));add(new TH.TubeGeometry(curve,20,.025,8),mat.velvet,0,0,0,g)})}
  const ring=add(new TH.RingGeometry(rr,rr+.07,64),new TH.MeshBasicMaterial({color:'#d4a64a',transparent:true,opacity:.9,depthWrite:false}),0,.014,0,g);ring.rotation.x=-Math.PI/2;ring.visible=false;g.userData.ring=ring;g.userData.rr=rr;g.userData.t=t;
 });
 /* plantas y puerta */
 const plant=(x,z,s=1)=>{const g=new TH.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);cyl(.24,.18,.44,mat.pot,0,.22,0,g,20);ao(x,z,.9*s,.9*s,.5);
  for(let i=0;i<9;i++){const m=M(['#4c6a34','#5d7d3d','#3e5a2b'][i%3],{roughness:.8,flatShading:true});add(new TH.IcosahedronGeometry(.18+rnd()*.14,1),m,(rnd()-.5)*.45,.6+rnd()*.6,(rnd()-.5)*.45,g)}};
 plant(-7.5,4.5);plant(7.5,-2.1);plant(-1.6,4.5,.9);plant(-7.5,-.6,.8);plant(7.4,4.6,.9);
 box(.06,2.2,1.1,mat.woodD,7.96,1.1,3.7);box(.04,.04,.2,mat.steel,7.9,1.05,3.3);
 /* luces */
 const hemi=new TH.HemisphereLight('#fff1dd','#3a2a1c',.45);scene.add(hemi);
 const sun=new TH.DirectionalLight('#ffe2bd',1);sun.position.set(-6,13,9);sun.castShadow=true;
 sun.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);Object.assign(sun.shadow.camera,{left:-11,right:11,top:9,bottom:-9,near:1,far:40});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;scene.add(sun);
 const back=new TH.DirectionalLight('#cfe2ff',.25);back.position.set(1,4,-12);scene.add(back);
 [[0.6,-3.4],[1,-1],[-5,2.2],[1.5,3],[5.2,1.2]].forEach(([x,z])=>{const l=new TH.PointLight('#ffc27a',.45,6.5,2);l.position.set(x,2.2,z);scene.add(l);lamps.push(l)});
 scene.traverse(o=>{if(o.isMesh){if(o.material.isMeshStandardMaterial&&o.material.envMapIntensity===1)o.material.envMapIntensity=.55;if(!o.material.isMeshBasicMaterial&&!o.userData.noShadow&&o.material!==mat.bulb){o.castShadow=true;o.receiveShadow=true}}});
 fl.castShadow=false;kf.castShadow=false;
 R.shadowMap.autoUpdate=false;R.shadowMap.needsUpdate=true;

 /* ---------- contornos de cocina y barra al pasar el ratón ---------- */
 const outline=(x0,z0,x1,z1)=>{const g=new TH.EdgesGeometry(new TH.PlaneGeometry(x1-x0,z1-z0));const m=new TH.LineBasicMaterial({color:'#f08a3c',transparent:true,opacity:0,depthWrite:false});const l=new TH.LineSegments(g,m);l.rotation.x=-Math.PI/2;l.position.set((x0+x1)/2,.03,(z0+z1)/2);l.userData.target=0;scene.add(l);return l};
 const kitLine=outline(-7.9,-4.95,-2.15,-1.25),barLine=outline(3.25,-4.95,7.9,-2.1);

 /* ---------- hora del día: de mediodía a noche ---------- */
 const sunC={day:new TH.Color('#ffe2bd'),dusk:new TH.Color('#ff8f4a'),night:new TH.Color('#8fa6ff')};
 const glassC={day:new TH.Color('#d6ebf2'),dusk:new TH.Color('#f2a066'),night:new TH.Color('#142033')};
 const tmpC=new TH.Color();
 const ss=(a,b,x)=>{const t=Math.min(Math.max((x-a)/(b-a),0),1);return t*t*(3-2*t)};
 let hour=st.hour,lastSun=-1;
 const applyHour=()=>{
  const night=ss(19.6,21.6,hour),dusk=Math.max(0,1-Math.abs(hour-19.6)/1.5)*(1-night*.6);
  const L=(a,b)=>a+(b-a)*night;
  const e=Math.min(Math.max((20.6-hour)/8,0),1);
  sun.position.set(-6-9*(1-e),1.6+11.4*e,9-5*(1-e));
  tmpC.copy(sunC.day).lerp(sunC.dusk,dusk).lerp(sunC.night,night);sun.color.copy(tmpC);
  sun.intensity=L(1,.14)*(1-dusk*.15);
  hemi.intensity=L(.45,.1);back.intensity=L(.25,.4);
  lamps.forEach(l=>l.intensity=L(.45,1.3)+dusk*.25);mat.bulb.emissiveIntensity=L(2.2,5)+dusk;
  R.toneMappingExposure=L(1.05,1)+dusk*.05;
  tmpC.copy(glassC.day).lerp(glassC.dusk,dusk).lerp(glassC.night,night);mat.glassW.color.copy(tmpC);
  shaftM.opacity=L(.16,0)+dusk*.12;shaftM.color.copy(tmpC.copy(sunC.day).lerp(sunC.dusk,dusk));dustM.opacity=L(.7,0)+dusk*.3;signM.emissiveIntensity=L(.9,2.6);mat.neon.emissiveIntensity=L(1.2,3.2);for(const m of signBulbs)m.emissiveIntensity=L(1.6,3.4);stageL.intensity=L(1.4,2.6);
  for(const q of glows){if(q.group==='bulb')q.sp.material.opacity=L(.35,1);else if(q.group==='candle')q.sp.material.opacity=L(.5,1.25)}
  if(Math.abs(e-lastSun)>.004){lastSun=e;R.shadowMap.needsUpdate=true}
 };
 applyHour();

 /* ---------- cámara ---------- */
 const C={tx:0,ty:3,tz:0,r:34,th:.9,ph:.6,off:0};
 let W=1,Hh=1,tw=null,lastUser=0;
 const resize=()=>{W=stage.clientWidth||1;Hh=stage.clientHeight||1;R.setSize(W,Hh,false);cam.aspect=W/Hh;cam.updateProjectionMatrix()};
 new ResizeObserver(resize).observe(stage);resize();
 const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
 const firstPerson=()=>st.mode==='walk'||st.mode==='seat';
 function applyCam(){
  if(firstPerson()){C.ph=clamp(C.ph,.05,3.09)}
  else{C.r=clamp(C.r,1.2,40);C.ph=clamp(C.ph,.2,1.42);C.tx=clamp(C.tx,-8.5,8.5);C.tz=clamp(C.tz,-5.5,6);C.ty=clamp(C.ty,0,3)}
  const sp=Math.sin(C.ph);cam.position.set(C.tx+C.r*sp*Math.sin(C.th),C.ty+C.r*Math.cos(C.ph),C.tz+C.r*sp*Math.cos(C.th));cam.lookAt(C.tx,C.ty,C.tz);
  if(Math.abs(C.off)>.5)cam.setViewOffset(W,Hh,C.off,0,W,Hh);else if(cam.view&&cam.view.enabled)cam.clearViewOffset();
 }
 const offFor=side=>{if(!wide()||!side)return 0;const pw=getPanelWidth()+48;return side==='r'?pw/2:-pw/2};
 const fitR=(r,side)=>{const vis=(W-(wide()&&side?getPanelWidth()+48:0))/Hh;return r*clamp(1.5/vis,1,1.9)};
 const flyC=(to,dur=1700,lift=.22)=>{to={...to};while(to.th-C.th>Math.PI)to.th-=Math.PI*2;while(to.th-C.th<-Math.PI)to.th+=Math.PI*2;if(reduce)dur=0;tw={from:{...C},to,t0:performance.now(),dur,lift}};
 function fly(v,side,dur=1700,lift=.22){flyC({tx:v.t[0],ty:v.t[1],tz:v.t[2],r:fitR(v.r,side),th:v.th,ph:v.ph,off:offFor(side)},dur,lift)}
 /* primera persona: ojo + guiñada + cabeceo -> parámetros de órbita */
 const R0=2.5;
 const orbitOf=(eye,yaw,pitch,off=0)=>{const dx=Math.sin(yaw)*Math.cos(pitch),dy=Math.sin(pitch),dz=Math.cos(yaw)*Math.cos(pitch);return{tx:eye.x+dx*R0,ty:eye.y+dy*R0,tz:eye.z+dz*R0,r:R0,th:Math.atan2(-dx,-dz),ph:Math.acos(clamp(-dy,-1,1)),off}};
 const eye=new TH.Vector3(6.6,1.55,3.7);
 /* paso en primera persona con choques contra paredes, cocina, barra y mesas */
 const collide=p=>{
  p.x=clamp(p.x,-7.5,7.5);p.z=clamp(p.z,-4.5,4.75);
  if(p.x<-2.05&&p.z<-1.15)p.z=-1.15;
  if(p.x>3.15&&p.z<-2.0)p.z=-2.0;
  for(const g of Object.values(tables)){const t=g.userData.t,rad=g.userData.rr-.25;const dx=p.x-t.x,dz=p.z-t.z,d=Math.hypot(dx,dz);if(d<rad&&d>1e-4){p.x=t.x+dx/d*rad;p.z=t.z+dz/d*rad}}
 };
 const keys=new Set(),move={x:0,y:0};
 const typing=()=>{const a=document.activeElement;return a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)};
 const kd=e=>{if(st.mode!=='walk'||typing())return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){keys.add(k);e.preventDefault()}};
 const ku=e=>keys.delete(e.key.toLowerCase());
 window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);

 /* ---------- marcadores ---------- */
 const pinEls=config.tables.map(t=>{const b=document.createElement('button');b.className='pin3';b.dataset.t=t.id;b.textContent=t.id;b.setAttribute('aria-label','Mesa '+t.id);b.addEventListener('click',()=>onPickTable(t.id));pinsEl.appendChild(b);return{el:b,p:new TH.Vector3(t.x,1.25,t.z)}});
 const zoneEls=(config.zoneLabels||[]).map(([n,x,y,z])=>{const s=document.createElement('span');s.className='zl';s.textContent=n;pinsEl.appendChild(s);pinEls.push({el:s,p:new TH.Vector3(x,y,z)});return s});
 const v3=new TH.Vector3();
 const placePins=()=>{for(const q of pinEls){v3.copy(q.p).project(cam);if(v3.z>1||Math.abs(v3.x)>1.2||Math.abs(v3.y)>1.2){q.el.style.display='none';continue}q.el.style.display='';q.el.style.transform=`translate(${((v3.x+1)/2*W).toFixed(1)}px,${((1-v3.y)/2*Hh).toFixed(1)}px)`}};

 /* ---------- selección y resaltado ---------- */
 const ray=new TH.Raycaster(),ndc=new TH.Vector2(),clickables=[...Object.values(tables),kitchen,bar];
 ray.camera=cam;
 const pick=e=>{const r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,cam);const h=ray.intersectObjects(clickables,true).find(x=>!x.object.isSprite);if(!h)return null;let o=h.object;while(o&&!o.userData.id&&!o.userData.go)o=o.parent;return o?o.userData:null};
 let hovT=0,hovKey='';
 const setHov=(key,on)=>{if(!key)return;if(key[0]==='t'){const g=tables[key.slice(1)];if(g)g.userData.hover=on}else(key.includes('cocteles')?barLine:kitLine).userData.target=on?1:0};
 const hover=e=>{
  const t=performance.now();if(t-hovT<45)return;hovT=t;
  const u=pick(e),key=u?(u.id?'t'+u.id:'z'+(u.cat||u.go)):'';
  cv.classList.toggle('hov',!!u);
  if(key!==hovKey){setHov(hovKey,false);hovKey=key;setHov(key,true)}
  onHover(u?(u.id?{type:'table',id:u.id}:{type:'zone',go:u.go,cat:u.cat}):null,e.clientX,e.clientY);
 };
 const clearHover=()=>{setHov(hovKey,false);hovKey='';cv.classList.remove('hov');onHover(null)};

 /* ---------- puntero: arrastrar, girar, mirar, tocar ---------- */
 const pts=new Map();let moved=0,dragMode='orbit';
 const pan=(dx,dy)=>{const k=C.r*.0016,c=Math.cos(C.th),s=Math.sin(C.th);C.tx-=(c*dx)*k;C.tz-=(-s*dx)*k;C.tx+=(-s*dy)*k;C.tz+=(-c*dy)*k};
 cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('pointerdown',e=>{
  const tap=e.pointerType==='touch'&&st.mode==='tour';
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY,tap});
  if(pts.size===1){moved=0;dragMode=(e.button===2||e.shiftKey)?'pan':'orbit'}
  if(tap)return;
  if(st.mode==='explore')tw=null;
  st.dragging=true;lastUser=performance.now();cv.classList.add('grab');try{cv.setPointerCapture(e.pointerId)}catch(_){}
 });
 cv.addEventListener('pointermove',e=>{
  const r=cv.getBoundingClientRect();st.mx=clamp(((e.clientX-r.left)/r.width)*2-1,-1,1);st.my=clamp(((e.clientY-r.top)/r.height)*2-1,-1,1);
  const pr=pts.get(e.pointerId);
  if(!pr){if(!coarse)hover(e);return}
  const dx=e.clientX-pr.x,dy=e.clientY-pr.y;moved+=Math.abs(dx)+Math.abs(dy);
  pts.set(e.pointerId,{...pr,x:e.clientX,y:e.clientY});
  if(pr.tap||moved<=5)return;
  lastUser=performance.now();onInteract();
  if(pts.size===2&&st.mode!=='tour'&&!firstPerson()){const o=[...pts.entries()].find(([id])=>id!==e.pointerId)[1];const d0=Math.hypot(pr.x-o.x,pr.y-o.y),d1=Math.hypot(e.clientX-o.x,e.clientY-o.y);if(d0>0&&d1>0)C.r*=d0/d1;pan(dx/2,dy/2);return}
  if(st.mode==='tour'){st.uth-=dx*.005;st.uph=clamp(st.uph-dy*.004,-.45,.45)}
  else if(firstPerson()){if(!tw){st.yaw+=dx*.004;st.pitch=clamp(st.pitch+dy*.003,-1,.8)}}
  else if(dragMode==='pan')pan(dx,dy);
  else{C.th-=dx*.006;C.ph-=dy*.005}
 });
 const up=e=>{const pr=pts.get(e.pointerId);pts.delete(e.pointerId);if(!pts.size){cv.classList.remove('grab');st.dragging=false}
  if(pr&&e.type==='pointerup'&&moved<=6&&!pts.size){const u=pick(e);if(u){clearHover();if(u.id)onPickTable(u.id);else onPickZone(u.go,u.cat)}}};
 cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 cv.addEventListener('pointerleave',()=>{st.mx=0;st.my=0;clearHover()});
 cv.addEventListener('wheel',e=>{
  if(st.mode==='tour'||!stage.classList.contains('active'))return;
  e.preventDefault();lastUser=performance.now();onInteract();
  if(st.mode==='walk'){const f=-e.deltaY*.004;eye.x+=Math.sin(st.yaw)*f;eye.z+=Math.cos(st.yaw)*f;collide(eye);return}
  if(st.mode==='seat')return;
  tw=null;C.r*=Math.exp(e.deltaY*.0012);
 },{passive:false});

 /* ---------- platos servidos en 3D ---------- */
 const dishMats={};const dm=(c,o={})=>dishMats[c+JSON.stringify(o)]||(dishMats[c+JSON.stringify(o)]=M(c,{roughness:.55,...o}));
 const sph=(r,c,x,y,z,sx=1,sy=1,sz=1,p,o)=>{const m=add(new TH.SphereGeometry(r,18,12),dm(c,o),x,y,z,p);m.scale.set(sx,sy,sz);return m};
 const DISH={
  steak:g=>{const board=box(.36,.025,.2,mat.wood,0,.012,0,g);board;for(let i=0;i<6;i++){const s=box(.045,.035,.13,dm('#4a2412'),-.13+i*.052,.045,0,g);s.rotation.z=-.15;box(.035,.003,.11,dm('#c2505f',{roughness:.4}),-.13+i*.052,.064,0,g).rotation.z=-.15}for(let i=0;i<12;i++)box(.006,.004,.006,dm('#f4f1ea'),(Math.random()-.5)*.3,.065,(Math.random()-.5)*.1,g);cyl(.004,.004,.14,dm('#3d5a2b'),.1,.04,.07,g,6).rotation.z=Math.PI/2},
  octopus:g=>{for(let k=0;k<2;k++){const pts2=[];for(let i=0;i<14;i++){const a=i*.45+k*2.4,rr=.12-i*.006;pts2.push(new TH.Vector3(Math.cos(a)*rr,.035,Math.sin(a)*rr))}const tube=new TH.TubeGeometry(new TH.CatmullRomCurve3(pts2),40,.018,8,false);add(tube,dm('#8e2f2a',{roughness:.45}),0,0,0,g)}for(let i=0;i<7;i++)box(.035,.03,.035,dm('#d9b45a'),Math.cos(i)*.06,.03,Math.sin(i)*.06,g)},
  fish:g=>{sph(.1,'#b9b4a6',0,.045,0,2,.45,.7,g,{metalness:.35,roughness:.35});add(new TH.ConeGeometry(.05,.08,4),dm('#9a9486'),.24,.045,0,g).rotation.z=Math.PI/2;cyl(.035,.035,.008,dm('#f2d23c'),-.12,.075,.05,g,16);for(let i=0;i<5;i++)box(.03,.03,.03,dm('#d9b45a'),.05-i*.04,.03,-.1,g)},
  chicken:g=>{sph(.09,'#b8742f',0,.05,0,1.3,.75,1,g,{roughness:.45});sph(.035,'#a3632a',.11,.04,.04,1.4,.8,.8,g);for(let i=0;i<6;i++)box(.035,.03,.035,dm('#d9b45a'),-.1+i*.03,.03,-.09,g)},
  bread:g=>{const b=sph(.1,'#8a5a2b',0,.06,0,1.15,.65,1,g,{flatShading:true,roughness:.85});b;for(let i=0;i<3;i++)box(.13,.006,.008,dm('#c99a5e'),0,.123,-.03+i*.03,g).rotation.y=.5;cyl(.05,.04,.02,mat.plate,.14,.02,.08,g,16);cyl(.042,.042,.004,dm('#c8a832',{roughness:.1}),.14,.031,.08,g,16)},
  salad:g=>{for(let i=0;i<9;i++)sph(.022,'#c8321f',Math.cos(i*.7)*.07,.035,Math.sin(i*.7)*.07,1,1,1,g,{roughness:.3});for(let i=0;i<8;i++)sph(.03,'#5f7a35',Math.cos(i*1.3)*.05,.03,Math.sin(i*1.3)*.05,1.4,.3,1,g);for(let i=0;i<6;i++)box(.022,.022,.022,dm('#d6a85a'),Math.cos(i*2)*.1,.03,Math.sin(i*2)*.1,g)},
  carpaccio:g=>{for(let i=0;i<9;i++)cyl(.04,.04,.004,dm('#b85a6a',{roughness:.35}),Math.cos(i*.7)*.1,.022,Math.sin(i*.7)*.1,g,20);for(let i=0;i<10;i++)sph(.006,'#5f7a35',(Math.random()-.5)*.2,.028,(Math.random()-.5)*.2,1,1,1,g)},
  croquettes:g=>{for(let i=0;i<6;i++)sph(.028,'#b97a35',Math.cos(i*1.05)*.08,.035,Math.sin(i*1.05)*.08,1.6,.9,.9,g,{flatShading:true})},
  cheese:g=>{for(let i=0;i<3;i++){const w=add(new TH.CylinderGeometry(.09,.09,.05,24,1,false,0,Math.PI/3),dm('#f1e3b5',{roughness:.7}),-.08+i*.08,.035,0,g);w.rotation.y=i}box(.05,.04,.05,dm('#8a2d1d',{roughness:.3}),.1,.03,.08,g)},
  chocolate:g=>{add(new TH.SphereGeometry(.06,24,14,0,Math.PI*2,0,Math.PI/2),dm('#24130b',{roughness:.12,metalness:.1}),0,.02,0,g);sph(.04,'#c78f45',.11,.03,.03,1.2,.5,.8,g)},
  cake:g=>{add(new TH.CylinderGeometry(.11,.11,.06,24,1,false,0,Math.PI/3),dm('#f0d9a0',{roughness:.6}),0,.045,0,g);add(new TH.CylinderGeometry(.112,.112,.01,24,1,false,0,Math.PI/3),dm('#4a2a14',{roughness:.7}),0,.08,0,g)},
  torrija:g=>{box(.12,.045,.08,dm('#c58a3c',{roughness:.35}),0,.04,0,g);sph(.035,'#efe2c6',.09,.05,.04,1,1,1,g)},
  figs:g=>{for(let i=0;i<3;i++){const f=add(new TH.SphereGeometry(.035,16,10,0,Math.PI*2,0,Math.PI/2),dm('#4a1f3a'),Math.cos(i*2.1)*.06,.02,Math.sin(i*2.1)*.06,g);f;cyl(.033,.033,.003,dm('#c2506a'),Math.cos(i*2.1)*.06,.021,Math.sin(i*2.1)*.06,g,16)}sph(.035,'#f4f1ea',0,.03,0,1,.6,1,g)},
  martini:g=>{const cone=add(new TH.ConeGeometry(.07,.07,24,1,true),mat.glass,0,.19,0,g);cone.rotation.x=Math.PI;cyl(.004,.004,.12,mat.glass,0,.08,0,g,8);cyl(.035,.035,.004,mat.glass,0,.014,0,g,20);
   const liq=add(new TH.ConeGeometry(.058,.055,24),dm('#e9e4c8',{transparent:true,opacity:.55,roughness:.05}),0,.195,0,g);liq.rotation.x=Math.PI;sph(.014,'#5a7a2a',.015,.2,0,1,1,1,g);cyl(.002,.002,.09,dm('#d4a64a'),.0,.21,0,g,6).rotation.z=.6},
  champagne:g=>{const fl=new TH.LatheGeometry([[0,0],[.03,0],[.03,.004],[.003,.01],[.003,.1],[.016,.11],[.022,.16],[.022,.23]].map(([x,y])=>new TH.Vector2(x,y)),20);[-.05,.05].forEach(x=>{add(fl,mat.glass,x,.012,0,g);cyl(.018,.014,.09,dm('#f3d98a',{transparent:true,opacity:.75,roughness:.05}),x,.175,0,g,16)});
   const bk=cyl(.09,.075,.2,dm('#c9ccd1',{metalness:.9,roughness:.2}),.17,.11,.05,g,24);bk;cyl(.035,.035,.3,dm('#1d3a22',{roughness:.12}),.17,.2,.05,g,16);cyl(.018,.03,.06,dm('#d4a64a',{metalness:.8,roughness:.3}),.17,.37,.05,g,12);for(let i=0;i<6;i++)box(.03,.03,.03,mat.glass,.12+(i%3)*.04,.2,.02+Math.floor(i/3)*.06,g)},
  whisky:g=>{cyl(.042,.04,.08,mat.glass,0,.052,0,g,20);cyl(.038,.036,.045,dm('#b8651c',{transparent:true,opacity:.85,roughness:.05}),0,.036,0,g,20);box(.045,.045,.045,dm('#e8f4ff',{transparent:true,opacity:.6,roughness:0}),0,.06,0,g).rotation.y=.4;cyl(.02,.02,.004,dm('#f08a3c'),.03,.09,0,g,16).rotation.z=Math.PI/2},
  oysters:g=>{sph(.15,'#e8f2f6',0,.015,0,1,.08,1,g,{roughness:.2});for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const x=Math.cos(a)*.1,z=Math.sin(a)*.1;const sh=sph(.04,'#8a8f88',x,.03,z,1,.35,1.4,g,{roughness:.8});sh.rotation.y=-a;sph(.025,'#d9d2bf',x,.042,z,1,.3,1.3,g,{roughness:.2}).rotation.y=-a}
   sph(.03,'#f2d94a',0,.04,0,1,.7,1,g,{roughness:.4})},
  wine:g=>{const gl=add(glassGeo,mat.glass,0,.012,0,g);gl.scale.setScalar(1.4);cyl(.04,.03,.05,mat.wine,0,.16,0,g,16);cyl(.04,.04,.3,dm('#1d2a1a',{roughness:.15}),.14,.16,.02,g,16)},
  white:g=>{const gl=add(glassGeo,mat.glass,0,.012,0,g);gl.scale.setScalar(1.4);cyl(.04,.03,.05,dm('#e8d98a',{transparent:true,opacity:.85,roughness:.1}),0,.16,0,g,16)},
  cocktail:g=>{cyl(.045,.04,.1,mat.glass,0,.06,0,g,20);cyl(.04,.036,.07,dm('#a8261d',{transparent:true,opacity:.9,roughness:.1}),0,.05,0,g,20);cyl(.03,.03,.006,dm('#f08a3c'),.03,.1,0,g,16).rotation.z=Math.PI/2},
  vermouth:g=>{cyl(.035,.03,.08,mat.glass,0,.05,0,g,20);cyl(.031,.027,.05,dm('#5a1a12',{transparent:true,opacity:.92,roughness:.1}),0,.04,0,g,20);sph(.012,'#6f8a3a',.0,.08,0,1,1,1,g)},
 };
 let dish=null;
 let dishTable=null;
 const showDeco=(id,on)=>{const g=id&&tables[id];if(g&&g.userData.deco)g.userData.deco.forEach(o=>{o.visible=on&&!(seatCandle&&seatCandle.includes(o))})};
 const clearDish=()=>{showDeco(dishTable,true);dishTable=null;if(!dish)return;scene.remove(dish);dish.traverse(o=>{if(o.isMesh&&o.geometry!==glassGeo)o.geometry.dispose()});dish=null;R.shadowMap.needsUpdate=true};
 const serveDish=(id,kind)=>{
  const g0=tables[id];if(!g0||!DISH[kind])return;clearDish();
  const t=g0.userData.t;const g=new TH.Group();
  const big=add(new TH.CylinderGeometry(.19,.15,.02,40),mat.plate,0,.01,0,g);big;
  DISH[kind](g);
  g.position.set(t.x,.79,t.z+(g0.userData.kind==='blackjack'?.42:0));g.scale.setScalar(.001);g.userData.t0=performance.now();
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  const l=new TH.PointLight('#ffd9a0',.9,2.2,2);l.position.set(0,.7,0);g.add(l);
  scene.add(g);dish=g;dishTable=id;showDeco(id,false);R.shadowMap.needsUpdate=true;
  if(st.mode==='seat'){const dx=t.x-eye.x,dz=t.z-eye.z;st.yaw=Math.atan2(dx,dz);st.pitch=-Math.atan2(eye.y-.85,Math.hypot(dx,dz))}
  else flyC({tx:t.x,ty:.84,tz:t.z,r:1.45,th:C.th,ph:.88,off:offFor(wide()?'r':null)},1500,.12);
 };

 /* ---------- vista desde la silla ---------- */
 /* sentado: la vela de tu propia mesa estorba a un palmo de la cámara, se aparta */
 let seatCandle=null;
 const unseat=()=>{if(seatCandle){seatCandle.forEach(o=>{o.visible=!(dishTable&&tables[dishTable]&&tables[dishTable].userData.deco.includes(o))});seatCandle=null}};
 const seatView=id=>{
  const g=tables[id];if(!g)return;const t=g.userData.t;unseat();seatCandle=g.userData.deco.slice(-3);seatCandle.forEach(o=>{o.visible=false});
  const ry=t.ry||0,cr=Math.cos(ry),sr=Math.sin(ry);let best=null,bd=1e9;
  for(const[sx,sz]of g.userData.seats){const wx=t.x+sx*cr+sz*sr,wz=t.z-sx*sr+sz*cr;const dd=Math.hypot(wx-0,wz-6);if(dd<bd){bd=dd;best=[wx,wz]}}
  if(!best)best=[t.x,t.z+1];eye.set(best[0],1.12,best[1]);
  const dx=t.x-eye.x,dz=t.z-eye.z;st.yaw=Math.atan2(dx,dz);st.pitch=-.2;
  st.mode='seat';flyC(orbitOf(eye,st.yaw,st.pitch,offFor(wide()?'r':null)),1900,.35);
 };
 const startWalk=()=>{unseat();eye.set(6.6,1.55,3.7);st.yaw=-Math.PI/2-.35;st.pitch=-.05;st.mode='walk';keys.clear();flyC(orbitOf(eye,st.yaw,st.pitch,0),1600,.3)};

 /* ---------- bucle ---------- */
 let first=true,visible=true,prev=performance.now(),stopped=false;
 new IntersectionObserver(es=>{visible=es[0].isIntersecting}).observe(stage);
 const loop=now=>{
  if(stopped)return;requestAnimationFrame(loop);const dt=Math.min(.05,(now-prev)/1000);prev=now;
  if(!visible&&!first)return;
  const k3=Math.min(1,dt*3);st.pmx+=(st.mx-st.pmx)*k3;st.pmy+=(st.my-st.pmy)*k3;
  if(tw){const p=tw.dur?Math.min(1,(now-tw.t0)/tw.dur):1,e=p<.5?4*p*p*p:1-((-2*p+2)**3)/2,f=tw.from,t=tw.to;
   for(const k of['tx','ty','tz','th','ph','off'])C[k]=f[k]+(t[k]-f[k])*e;
   C.r=(f.r+(t.r-f.r)*e)*(1+tw.lift*Math.sin(Math.PI*p));if(p>=1)tw=null}
  else if(st.mode==='tour'&&st.tour){
   if(!st.dragging){const dk=Math.min(1,dt*1.4);st.uth-=st.uth*dk;st.uph-=st.uph*dk}
   const T2={...st.tour,th:st.tour.th+st.uth-st.pmx*.14,ph:clamp(st.tour.ph+st.uph+st.pmy*.06,.2,1.42)};
   const k=Math.min(1,dt*3.2);for(const key of['tx','ty','tz','r','ph','off'])C[key]+=(T2[key]-C[key])*k;let dth=T2.th-C.th;while(dth>Math.PI)dth-=Math.PI*2;while(dth<-Math.PI)dth+=Math.PI*2;C.th+=dth*k}
  else if(st.mode==='walk'){
   let f=0,s=0;if(keys.has('w')||keys.has('arrowup'))f+=1;if(keys.has('s')||keys.has('arrowdown'))f-=1;if(keys.has('a'))s-=1;if(keys.has('d'))s+=1;
   if(keys.has('arrowleft'))st.yaw+=dt*1.6;if(keys.has('arrowright'))st.yaw-=dt*1.6;
   f+=-move.y;s+=move.x;
   if(f||s){const sp=2.1*dt,sy=Math.sin(st.yaw),cy=Math.cos(st.yaw);eye.x+=(sy*f-cy*s)*sp;eye.z+=(cy*f+sy*s)*sp;collide(eye);lastUser=now}
   eye.y=1.55+(f||s?Math.sin(now*.012)*.02:0);
   Object.assign(C,orbitOf(eye,st.yaw-st.pmx*.05,st.pitch,C.off*(1-k3)))}
  else if(st.mode==='seat'){Object.assign(C,orbitOf(eye,st.yaw-st.pmx*.12,st.pitch-st.pmy*.06,C.off))}
  if(Math.abs(hour-st.hour)>.002){hour+=(st.hour-hour)*Math.min(1,dt*(st.hourFast?6:.9));applyHour()}
  if(!reduce){ovenL.intensity=1.5+Math.sin(now*.003)*.3;grillL.intensity=.9+Math.sin(now*.005)*.2;
   for(const w of wheels){w.a+=dt*.9;w.disk.rotation.y=w.a;w.b-=dt*2.2;w.ball.position.set(Math.cos(w.b)*.3,.07,Math.sin(w.b)*.3)}
   for(const m of slots){m.hue=(m.hue+dt*.08)%1;m.top.emissive.setHSL(m.hue,1,.45);m.next-=dt;if(m.next<0){m.next=3+rnd()*6;m.reels.forEach((r,k)=>{r.from=r.t.offset.y;r.to=r.from+2+k*.5+Math.floor(rnd()*8)/8;r.t0=now+k*180})}
    for(const r of m.reels){if(r.t0){const p=Math.min(1,Math.max(0,(now-r.t0)/1400)),e=1-Math.pow(1-p,3);r.t.offset.y=r.from+(r.to-r.from)*e;if(p>=1)r.t0=0}}}
   const bl=Math.floor(now/180)%3;signBulbs.forEach((m,i)=>{m.emissiveIntensity=(i%3===bl?3.4:1.1)*(hour>19?1:.6)});
   const fk=1+Math.sin(now*.013)*.08+Math.sin(now*.041)*.05;for(const q of glows)if(q.group!=='bulb'){const s=q.s*(q.group==='candle'?fk:1+(fk-1)*.6);q.sp.scale.set(s,s,1)}
   dust.rotation.y=Math.sin(now*.00015)*.2;dust.position.y=1.4+Math.sin(now*.0004)*.08;
   for(const s of smokes){s.life+=dt*.12;if(s.life>1)s.life-=1;const l=s.life;s.sp.position.set(-6.6+Math.sin(l*6+now*.0005)*.15*l,3.05+l*2.2,-4.3+l*.3);const sz=.35+l*1.4;s.sp.scale.set(sz,sz,1);s.sp.material.opacity=Math.sin(l*Math.PI)*.28}}
  const sc=1+.04*Math.sin(now*.005);
  for(const g of Object.values(tables)){const rg=g.userData.ring,want=g.userData.sel?.95:g.userData.hover?.6:0;rg.material.opacity+=(want-rg.material.opacity)*Math.min(1,dt*8);rg.visible=rg.material.opacity>.02;const s2=g.userData.sel?sc:1;rg.scale.set(s2,s2,1)}
  for(const l of[kitLine,barLine])l.material.opacity+=(l.userData.target-l.material.opacity)*Math.min(1,dt*8);
  if(dish){const p=Math.min(1,(now-dish.userData.t0)/700),e=1-Math.pow(1-p,3);dish.scale.setScalar(.001+e*(1+.08*Math.sin(p*Math.PI)));dish.rotation.y=(1-e)*1.2}
  applyCam();R.render(scene,cam);placePins();
  if(first){first=false;onReady()}
 };
 requestAnimationFrame(loop);
 return{fly,fitR,offFor,
  setMode:m=>{unseat();st.mode=m;if(m==='explore')st.tour=null;if(m!=='walk')keys.clear()},
  setTour:(v,side)=>{if(st.mode!=='tour')return;st.tour={tx:v.t[0],ty:v.t[1],tz:v.t[2],r:fitR(v.r,side),th:v.th,ph:v.ph,off:offFor(side)}},
  setHour:(h,fast=false)=>{st.hour=h;st.hourFast=fast},
  setMove:(x,y)=>{move.x=x;move.y=y},
  seatView,startWalk,serveDish,clearDish,
  zoom:(f,side)=>fly({t:[C.tx,C.ty,C.tz],r:C.r*f/fitR(1,side),th:C.th,ph:C.ph},side,450,0),
  keepOff:side=>{if(tw)tw.to.off=offFor(side);else C.off=offFor(side)},
  sel:id=>{for(const[k,g]of Object.entries(tables))g.userData.sel=k===id},
  setPinStates:fn=>{for(const q of pinEls){const id=q.el.dataset&&q.el.dataset.t;if(id)q.el.className='pin3'+fn(id)}},
  setZoneLabels:names=>names.forEach((n,i)=>{if(zoneEls[i])zoneEls[i].textContent=n}),
  dispose:()=>{stopped=true;window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);R.dispose();try{R.forceContextLoss()}catch(_){}}};
}
