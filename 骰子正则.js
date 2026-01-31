```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Rajdhani:wght@500;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{background:transparent;padding:0;margin:0;font-family:'Rajdhani','Segoe UI',sans-serif;color:#e4e4e7}

.dnd-card-container { filter: drop-shadow(0 0 15px rgba(0,0,0,0.5)); margin: 20px 0; perspective: 1000px; }
.dnd-card{
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 24px) 100%, 0 100%, 0 12px);
  background: rgba(13, 13, 16, 0.92);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  position: relative; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-style: preserve-3d;
}

/* 极值特效 */
.dnd-card.nat-20::before { background: linear-gradient(135deg, #fcd34d, #fbbf24, #f59e0b, #d97706); animation: border-rotate 2s linear infinite; opacity: 0.8; }
.dnd-card.nat-20 .dnd-res-val { color: #fbbf24; text-shadow: 0 0 20px #fbbf24, 0 0 40px #f59e0b; animation: text-flicker 1.5s infinite; }
.dnd-card.nat-20 .dnd-icon-box { border-color: #fbbf24; box-shadow: 0 0 30px #fbbf24; animation: pulse-gold 0.5s infinite; }

.dnd-card.nat-1::before { background: linear-gradient(135deg, #ef4444, #dc2626, #b91c1c); opacity: 0.8; }
.dnd-card.nat-1 .dnd-res-val { color: #fca5a5; text-shadow: 0 0 10px #ef4444; text-decoration: line-through; opacity: 0.8; }
.dnd-card.nat-1 .dnd-icon-box { border-color: #ef4444; box-shadow: 0 0 30px #ef4444; animation: pulse-red 0.2s infinite; }

.dnd-head:hover ~ .dnd-body, .dnd-card:hover { transform: translateY(-3px) scale(1.005) rotateX(1deg); z-index: 10; }
.dnd-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.03) 50%, transparent); background-size: 100% 200%; animation: scanline 3s linear infinite; pointer-events: none; z-index: 0; }
.dnd-card::before { content: ''; position: absolute; inset: 0; padding: 1px; background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.05) 70%, rgba(255,255,255,0.4)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; z-index: 2; pointer-events: none; }

.dnd-head{ padding: 10px 10px 10px 16px; display:flex;align-items:center;gap:10px; cursor:pointer; user-select:none; background: linear-gradient(90deg, rgba(255,255,255,0.03), transparent); min-height:64px; position: relative; z-index: 5; transition: background 0.3s; }
.dnd-head:hover { background: rgba(255,255,255,0.06); }
.dnd-head-line { position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent); opacity: 0; transition: all 0.5s; box-shadow: 0 0 10px rgba(255,255,255,0.3); }
.dnd-card:not(.collapsed) .dnd-head-line { opacity: 1; width: 100%; }

.dnd-accent-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; z-index: 10; transition: width 0.3s, box-shadow 0.3s; }
.dnd-card:hover .dnd-accent-bar { width: 6px; }
.type-d20 .dnd-accent-bar { background: #fafafa; box-shadow: 0 0 15px rgba(255,255,255,0.4); animation: pulse-white 2s infinite; }
.type-dmg .dnd-accent-bar { background: #f43f5e; box-shadow: 0 0 15px rgba(244,63,94,0.6); animation: pulse-red 2s infinite; }
.type-init .dnd-accent-bar { background: #eab308; box-shadow: 0 0 15px rgba(234,179,8,0.6); animation: pulse-gold 2s infinite; }

.dnd-icon-box { width: 32px; height: 32px; flex-shrink: 0; display:flex;align-items:center;justify-content:center; position:relative; transform: rotate(45deg); background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 0 15px rgba(0,0,0,0.5); transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55); margin-left: 4px; }
.dnd-card:hover .dnd-icon-box { transform: rotate(225deg) scale(1.1); border-color: rgba(255,255,255,0.4); }
.dnd-card:hover .dnd-svg-icon { transform: rotate(-225deg); }
.dnd-svg-icon { width: 18px; height: 18px; transform: rotate(-45deg); transition: transform 0.4s; fill: currentColor; }
.type-d20 .dnd-icon-box { border-color: rgba(255,255,255,0.5); color: #ffffff; }
.type-dmg .dnd-icon-box { border-color: rgba(244,63,94,0.5); color: #fda4af; }
.type-init .dnd-icon-box { border-color: rgba(234,179,8,0.5); color: #fde047; }

.dnd-title-group{ flex:1; display:flex; flex-direction:column; justify-content:center; min-width: 0; }
.dnd-title{ 
  font-family:'Cinzel', serif; font-weight:700; font-size:1em; 
  color:#fff; letter-spacing:0.02em; line-height:1.2; 
  text-shadow: 0 0 10px rgba(255,255,255,0.3); transition: letter-spacing 0.3s; 
  white-space: normal; word-break: break-word; 
}
.dnd-card:hover .dnd-title { letter-spacing: 0.05em; }
.dnd-subtitle{ font-size:0.65em;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px; font-weight:600;margin-top:2px; display: none; } 

.dnd-summary{ display:flex; flex-direction: column; align-items:flex-end; gap:0; padding-right:4px; flex-shrink: 0; max-width: 40%; }
.dnd-res-val{ 
  font-family:'Cinzel', serif; font-weight:700; font-size:1.4em; 
  color:#fff; text-shadow:0 0 20px rgba(255, 255, 255, 0.5); position: relative; transition: transform 0.3s; 
  white-space: normal; text-align: right; line-height: 1;
}
.dnd-res-val.text-mode { font-size: 0.9em; line-height: 1.2; word-break: break-all; }

.dnd-card:hover .dnd-res-val { transform: scale(1.1); }
.type-d20 .dnd-res-val { text-shadow: 0 0 20px rgba(255, 255, 255, 0.6); }
.type-dmg .dnd-res-val { text-shadow: 0 0 20px rgba(244, 63, 94, 0.8); }
.type-init .dnd-res-val { text-shadow: 0 0 20px rgba(234, 179, 8, 0.8); }

.dnd-res-val.success { color: #fcd34d; text-shadow: 0 0 25px rgba(252, 211, 77, 0.8); }
.dnd-res-val.fail { color: #fca5a5; text-shadow: 0 0 10px rgba(239, 68, 68, 0.8); opacity: 0.8; }

.dnd-chevron{ color:rgba(255,255,255,0.3); transition:transform 0.5s; font-size:0.8em; margin-right: 4px; flex-shrink: 0; }
.dnd-card.collapsed .dnd-chevron{ transform:rotate(-180deg); }

.dnd-body{ transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); max-height:800px; opacity:1; padding:4px 0 16px 0; transform-origin: top; transform: scaleY(1); }
.dnd-card.collapsed .dnd-body{ max-height:0; opacity:0; padding:0; transform: scaleY(0); }

.dnd-row{ padding:8px 16px; display:flex;justify-content:space-between;align-items:center; font-size:0.9em; border-bottom: 1px dashed rgba(255,255,255,0.03); transition: background 0.2s; }
.dnd-row:last-child { border-bottom: none; }
.dnd-row:hover { background: rgba(255,255,255,0.05); }
.dnd-row-val { font-weight:600;color:#e4e4e7; font-family:'Rajdhani', sans-serif; letter-spacing: 0.5px; text-align: right; max-width: 60%; word-break: break-all; }

.highlight-attr { color: #fcd34d; font-weight: 700; text-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }

.dnd-pill { padding:2px 8px; font-size:0.8em; font-weight:600; margin-right:6px; display:inline-block; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); clip-path: polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px); }
.dnd-pill.pos { color: #f87171; border-color: rgba(248, 113, 113, 0.3); background: rgba(248, 113, 113, 0.1); }
.dnd-pill.neg { color: #4ade80; border-color: rgba(74, 222, 128, 0.3); background: rgba(74, 222, 128, 0.1); }

.dnd-bar-wrap{ margin:6px 16px 16px 16px; background:rgba(255,255,255,0.05); height:6px; overflow:hidden; display:flex; position:relative; clip-path: polygon(0 0, 100% 0, 98% 100%, 0 100%); }
.dnd-bar{ background:#fff; height:100%; box-shadow:0 0 15px rgba(255, 255, 255, 0.9); position:relative; z-index:1; background-image: linear-gradient(45deg,rgba(255,255,255,0.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.15) 50%,rgba(255,255,255,0.15) 75%,transparent 75%,transparent); background-size: 1rem 1rem; animation: progress-stripe 1s linear infinite; }

.dnd-tag-mini { padding:2px 6px; border:1px solid rgba(255,255,255,0.2); font-size:0.7em; font-weight:700; text-transform:uppercase; letter-spacing:1px; background:rgba(0,0,0,0.3); color:rgba(255,255,255,0.7); clip-path: polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px); margin-top: 2px; }
.dnd-tag-mini.crit { border-color:#fbbf24; color:#fbbf24; animation: pulse-gold 1.5s infinite; }
.dnd-tag-mini.fail { border-color:#f87171; color:#f87171; animation: pulse-red 1.5s infinite; }

@media (min-width: 480px) {
  .dnd-head { padding: 10px 18px 10px 24px; gap: 16px; }
  .dnd-title { font-size: 1.2em; white-space: nowrap; }
  .dnd-subtitle { display: block; }
  .dnd-icon-box { width: 42px; height: 42px; margin-left: 0; }
  .dnd-svg-icon { width: 24px; height: 24px; }
  .dnd-res-val { font-size: 1.8em; }
  .dnd-res-val.text-mode { font-size: 1em; white-space: nowrap; }
  .dnd-tag-mini { font-size: 0.8em; padding: 3px 8px; }
  .dnd-row { padding: 8px 24px; }
  .dnd-bar-wrap { margin: 6px 24px 16px 24px; }
  .dnd-summary { flex-direction: row; align-items: center; max-width: none; }
}

@keyframes scanline { 0%{background-position:0 0} 100%{background-position:0 200%} }
@keyframes pulse-white { 0%,100%{box-shadow:0 0 10px rgba(255,255,255,0.3)} 50%{box-shadow:0 0 20px rgba(255,255,255,0.6)} }
@keyframes pulse-red { 0%,100%{box-shadow:0 0 15px rgba(244,63,94,0.5)} 50%{box-shadow:0 0 25px rgba(244,63,94,0.8)} }
@keyframes pulse-gold { 0%,100%{box-shadow:0 0 15px rgba(234,179,8,0.5)} 50%{box-shadow:0 0 25px rgba(234,179,8,0.8)} }
@keyframes progress-stripe { from{background-position:1rem 0} to{background-position:0 0} }
@keyframes text-flicker { 0%{opacity:1} 50%{opacity:0.8;text-shadow:0 0 30px #fbbf24} 100%{opacity:1} }
</style>
</head>
<body>
<script type="text/plain" id="dndRaw">$1</script>
<div id="dndContainer"></div>
<script>
(function(){
var raw=document.getElementById('dndRaw').textContent.trim();
var lines=raw.split('\n');
var html='';
var inCard=false;
var bodyHtml='';
var headInfo = null;

var icons = {
  d20: '<svg viewBox="0 0 543 627" class="dnd-svg-icon"><path d="M271.485,0L0,156.742v313.483l271.485,156.742l271.484-156.742V156.742L271.485,0z M278.328,22.626  l221.618,127.952l-221.618-25.032V22.626z M524.976,167.178l-95.739,224.031L284.191,139.981L524.976,167.178z M418.301,399.638  H124.669l146.816-254.293L418.301,399.638z M264.642,22.626v102.92L43.023,150.578L264.642,22.626z M258.779,139.981L113.732,391.21  L17.993,167.178L258.779,139.981z M16.174,197.747l87.942,205.785l-87.942,49.606V197.747z M23.151,464.915l87.801-49.526  l133.02,177.018L23.151,464.915z M126.518,413.323h289.934L271.485,606.238L126.518,413.323z M298.997,592.407l133.021-177.019  l87.8,49.526L298.997,592.407z M526.795,453.138l-87.941-49.605l87.941-205.784V453.138z M200.249,297.943l0.166-1.121  c1.207-8.13,4.862-15.182,10.867-20.963c6.041-5.818,14.042-8.767,23.779-8.767c10.078,0,18.262,2.926,24.325,8.697  c6.08,5.788,9.164,13.233,9.164,22.127c0,7.859-2.729,14.97-8.108,21.134c-4.985,5.711-16.421,13.673-34.899,24.288h42.746v16.342  h-67.887v-17.453l27.728-18.44c8.271-5.514,13.883-10.438,16.682-14.636c2.751-4.126,4.145-7.929,4.145-11.3  c0-4.076-1.309-7.406-4.003-10.18c-2.682-2.763-6.089-4.106-10.413-4.106c-9.492,0-14.805,5.701-16.246,17.429l-0.172,1.4  L200.249,297.943z M312.995,361.044c8.107,0,14.958-2.273,20.362-6.755c5.35-4.437,9.305-10.174,11.755-17.053  c2.42-6.801,3.647-15.591,3.647-26.126c0-6.352-1.303-13.24-3.875-20.471c-2.604-7.323-6.636-13.135-11.983-17.275  c-5.378-4.162-12.033-6.273-19.776-6.273c-10.774,0-19.481,4.482-25.876,13.322c-6.303,8.716-9.499,20.356-9.499,34.596  c0,13.201,3.051,24.257,9.066,32.858C292.929,356.611,301.737,361.044,312.995,361.044z M313.255,281.484  c6.416,0,10.635,2.945,12.903,9.004c2.384,6.373,3.593,13.202,3.593,20.298c0,8.672-0.495,15.544-1.47,20.426  c-0.944,4.714-2.731,8.414-5.313,10.996c-2.553,2.553-5.836,3.794-10.037,3.794c-6.221,0-10.393-2.767-12.757-8.46  c-2.482-5.969-3.741-14.01-3.741-23.896C296.433,292.305,302.093,281.484,313.255,281.484z M114.605,217.082  c-2.809-8.427-14.246-12.44-19.062-1.605c-4.816,10.835,6.421,15.45,6.421,15.45l-9.23,19.664  c-35.114-29.094,6.7-75.966,28.894-62.402c10.835,6.621,9.832,26.887,16.759,45.548c5.112-7.625,17.753-31.904,17.753-31.904  l15.45,6.621l-37.923,63.004l-6.621-3.117C127.045,268.34,117.414,225.509,114.605,217.082z M208.91,71.61l-47.354,53.172h-14.046  l40.531-39.929l-20.266,8.227l7.625-8.026l24.68-12.039L208.91,71.61z M240.613,63.383c-10.835,3.612-28.894,16.052-23.877,23.219  c-7.825,2.665-49.561,38.18-11.036,33.164c40.043-5.214,49.36-39.127,37.321-37.722c0,0,13.042-5.819,15.651-12.44  C261.28,62.982,251.448,59.771,240.613,63.383z M223.472,102.387c-5.198,3.676-10.744,4.771-12.389,2.445  c-1.645-2.326,1.235-7.191,6.433-10.867c5.198-3.676,10.744-4.771,12.389-2.445C231.55,93.846,228.67,98.711,223.472,102.387z   M239.713,78.782c-4.009,2.835-8.323,3.63-9.636,1.774c-1.313-1.856,0.873-5.659,4.883-8.494c4.009-2.835,8.323-3.629,9.636-1.774  C245.908,72.144,243.722,75.947,239.713,78.782z M364.348,108.396h5.351l-10.166-11.236l-4.949,0.669l-24.479-27.155l-12.975-2.809  l-0.669,25.817l5.618,7.892l27.69,4.147l14.581,16.052l13.644,0.936L364.348,108.396z M329.034,92.477l-0.936-13.109L339.2,93.548  L329.034,92.477z M413.173,188.522l-18.594-14.179l13.377-4.548l21.938,15.517l7.759,13.51l-63.004,24.747l-9.899-17.657  L413.173,188.522z M401.201,236.678l17.684,30.367l-15.075,8.826l9.765,17.39l15.042-9.504l4.756,8.167l11.504-8.294l-4.414-7.357  l30.766-20.199l-9.364-16.052l-51.5-8.294L401.201,236.678z M449.29,250.189l-17.925,9.497l-6.956-12.708L449.29,250.189z   M502.128,371.917c7.892-3.478,6.153-21.403,6.153-21.403c1.739,1.204,4.147,11.103,3.21,18.861s-5.217,3.612-5.217,3.612  l-3.612,11.905c16.721,20.333,13.51-33.977,8.962-51.5c-4.548-17.523-10.969-34.244-16.988-31.034s-8.427,24.881-6.956,38.124  C489.153,353.725,494.236,375.395,502.128,371.917z M497.892,325.235c2.542-0.386,5.496,5.179,6.596,12.43  s-0.068,13.441-2.61,13.827c-2.542,0.386-5.495-5.179-6.596-12.43S495.35,325.621,497.892,325.235z M479.004,340.633  c1.889-0.286,3.991,3.244,4.693,7.886c0.703,4.641-0.259,8.635-2.149,8.921c-1.889,0.286-3.991-3.244-4.693-7.886  C476.152,344.913,477.114,340.919,479.004,340.633z M49.727,407.232l9.23,8.962l-5.618,10.166l-10.835-10.166l-3.745-8.16  l26.753-64.476l7.09,15.784L49.727,407.232z M40.765,375.395c-12.039,18.594-16.186-5.083-14.581-26.352  s17.122-27.155,17.122-27.155l-7.09-17.791l5.886-17.256l16.052,38.601l-3.879,10.347C28.057,346.08,29.395,357.203,31,364.694  s6.02,0,6.02,0L40.765,375.395z M75.544,469.433c13.243,8.561,27.155,16.587,52.704,17.122c25.55,0.535,11.669-15.593,7.892-19.129  c-15.647-14.651-25.951-18.861-51.634-19.931C58.824,446.425,62.302,460.872,75.544,469.433z M118.271,466.63  c2.153,1.32,10.152,7.458-3.803,8.132s-21.757-2.137-29.208-5.19c-7.451-3.053-9.729-8.865,4.313-9.323  C103.615,459.791,109.349,461.16,118.271,466.63z M94.004,491.371l71.699,14.581l7.223,11.37l-54.042-13.424l13.912,10.883  l-10.291-1.07L94.004,491.371z M287.059,488.379c10.839-4.182,18.298-12.91,18.298-23.004c0-14.16-14.673-25.639-32.773-25.639  c-18.1,0-32.773,11.479-32.773,25.639c0,10.094,7.459,18.821,18.298,23.004c-7.849,3.736-13.081,10.417-13.081,18.041  c0,11.71,12.337,21.202,27.556,21.202c15.219,0,27.556-9.492,27.556-21.202C300.14,498.797,294.908,492.116,287.059,488.379z   M272.584,512.774c-4.827,0-8.739-3.913-8.739-8.739c0-4.827,3.913-8.739,8.739-8.739c4.827,0,8.739,3.913,8.739,8.739  C281.323,508.861,277.41,512.774,272.584,512.774z M272.584,480.982c-6.575,0-11.905-5.33-11.905-11.905  c0-6.575,5.33-11.905,11.905-11.905s11.905,5.33,11.905,11.905C284.489,475.652,279.159,480.982,272.584,480.982z M409.407,466.089  l51.654-3.21l3.478-13.644h11.771l-3.612,13.377l-6.956,8.026l-67.017,8.695L409.407,466.089z M437.519,485.753  c-37.275,2.711-61.005,19.986-68.013,30.15c-1.989,2.885-0.016,6.871,3.483,7.068c29.207,1.645,50.518-19.628,50.619-22.972  c0.064-2.143-3.21-3.143-3.21-3.143s16.052-5.217,14.848,0c-1.204,5.217-12.039,8.829-12.039,8.829l-5.217,7.357  C424.543,512.64,466.947,483.613,437.519,485.753z M401.785,511.74c-6.969,2.638-13.373,2.784-14.304,0.326  c-0.931-2.459,3.964-6.591,10.933-9.229c6.969-2.638,13.373-2.784,14.304-0.326C413.649,504.97,408.754,509.102,401.785,511.74z"/></svg>',
  dmg: '<svg viewBox="0 0 24 24" class="dnd-svg-icon"><path d="M14.5 17.5L3 6V3h3l11.5 11.5-3 3zM10 5l11 11v3h-3L7 8l3-3z"/></svg>',
  init: '<svg viewBox="0 0 24 24" class="dnd-svg-icon"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
};

for(var i=0;i<lines.length;i++){
  var l=lines[i].trim();
  if(!l)continue;
  
  if(l.match(/^━━━◇ (?:D20|Damage|Init|先攻)/)){
    if(inCard){html+=bodyHtml+'</div></div></div>';}
    
    var m=l.match(/\(([^)]+)\)/);
    var title=m?m[1]:'检定';
    var type=l.match(/D20/)?'d20':l.match(/Damage/)?'dmg':'init';
    var subType = l.match(/D20/)?'D20 CHECK':l.match(/Damage/)?'DAMAGE':'INITIATIVE';
    var icon=type==='d20'?icons.d20:type==='dmg'?icons.dmg:icons.init;
    
    headInfo = {title: title, sub: subType, icon: icon, type: type, natClass: ''};
    bodyHtml='<div class="dnd-body">';
    inCard=true;
  }
  else if(l.match(/^Total:/)){
    var m=l.match(/Total:\s*([^\n]+)/); 
    var fullVal = m ? m[1].trim() : l.substring(6).trim();
    var val = fullVal;
    var tag = '';
    
    var tagMatch = fullVal.match(/(\[.*?\])$/);
    if(tagMatch) {
        tag = tagMatch[1].replace(/[\[\]]/g,'');
        val = fullVal.substring(0, fullVal.length - tagMatch[1].length).trim();
    }
    
    var tagCls='';
    if(tag.indexOf('大成功')>=0||tag.indexOf('暴击')>=0)tagCls=' crit';
    else if(tag.indexOf('大失败')>=0||tag.indexOf('失误')>=0)tagCls=' fail';
    
    var resClass = '';
    if(fullVal.indexOf('成功')>=0 || fullVal.indexOf('通过')>=0 || fullVal.indexOf('命中')>=0) resClass=' success';
    else if(fullVal.indexOf('失败')>=0 || fullVal.indexOf('未通过')>=0 || fullVal.indexOf('拦截')>=0 || fullVal.indexOf('未命中')>=0 || fullVal.indexOf('擦伤')>=0) resClass=' fail';
    
    if(!val.match(/^[\d\-+ ]+$/)) resClass += ' text-mode';

    var headHtml = '<div class="dnd-head">'+
      '<div class="dnd-accent-bar"></div>'+
      '<div class="dnd-icon-box"><div class="dnd-icon-wrap">'+headInfo.icon+'</div></div>'+
      '<div class="dnd-title-group"><div class="dnd-title">'+headInfo.title+'</div><div class="dnd-subtitle">'+headInfo.sub+'</div></div>'+
      '<div class="dnd-summary">'+
        '<span class="dnd-res-val'+resClass+'">'+val+'</span>'+
      '</div>'+
      (tag?'<div class="dnd-tag-mini'+tagCls+'">'+tag+'</div>':'')+
      '<div class="dnd-chevron">▼</div>'+
      '<div class="dnd-head-line"></div>'+
      '</div>';
      
    html += '<div class="dnd-card-container type-'+headInfo.type+'" data-head="placeholder"><div class="dnd-card collapsed'+(headInfo.natClass||'')+'">' + headHtml + bodyHtml + '</div></div>';
    inCard = false;
    bodyHtml = '';
  }
  else if(l.startsWith('━━━◇')){
    var m=l.match(/━━━◇ (.*?) ◇?/);
    bodyHtml+='<div class="dnd-row" style="margin-top:8px;margin-bottom:4px;opacity:0.5;font-size:0.75em;letter-spacing:1px;text-transform:uppercase">'+(m?m[1]:l)+'</div>';
  }
  else if(l.startsWith('•')){
    var rollM=l.match(/(?:Roll Outcome|掷骰结果):\s*(\d+)\s*\/\s*(\d+)/);
    if(rollM){
      var pct=Math.round(parseInt(rollM[1])/parseInt(rollM[2])*100);
      var rollVal = parseInt(rollM[1]);
      var maxVal = parseInt(rollM[2]);
      if(inCard){
         if(rollVal === maxVal && maxVal === 20) headInfo.natClass = ' nat-20';
         else if(rollVal === 1 && maxVal === 20) headInfo.natClass = ' nat-1';
      }

      bodyHtml+='<div class="dnd-row"><span class="dnd-row-label">掷骰结果</span><strong class="dnd-row-val">'+rollM[1]+'<span style="opacity:0.5;font-size:0.8em"> / '+rollM[2]+'</span></strong></div>'+
      '<div class="dnd-bar-wrap"><div class="dnd-bar" style="width:'+pct+'%"></div></div>';
    }else{
      var p=l.substring(2).split(':');
      var label = (p[0]||'').trim();
      if(label.match(/力量|敏捷|体质|智力|感知|魅力/)) label = '<span class="highlight-attr">'+label+'</span>';
      bodyHtml+='<div class="dnd-row"><span class="dnd-row-label">'+label+'</span><strong class="dnd-row-val">'+(p[1]||'').trim()+'</strong></div>';
    }
  }
  else if(l.startsWith('→')){
    var m=l.match(/→\s*([+-])\s*(\d+)\s*(.*)/);
    if(m){
      var cls=m[1]==='+'?'pos':'neg';
      bodyHtml+='<div class="dnd-row" style="justify-content:flex-start"><span class="dnd-pill '+cls+'">'+m[1]+m[2]+'</span><span style="color:rgba(255,255,255,0.8)">'+m[3]+'</span></div>';
    }
  }
}
if(inCard){
    var headHtml = '<div class="dnd-head">...</div>';
    html += '<div class="dnd-card-container"><div class="dnd-card collapsed">' + headHtml + bodyHtml + '</div></div>';
}

var container = document.getElementById('dndContainer');
container.innerHTML=html;

var headers = container.querySelectorAll('.dnd-head');
headers.forEach(function(h){
  h.onclick = function(){
    var card = this.closest('.dnd-card');
    card.classList.toggle('collapsed');
  }
});

})();
</script>
</body>
</html>
```