/*
            _  ____   _____  ________  _ ____ 
           / |/  _  \|__ __\/  __/\  \///  __\
           | || / \ |  / \  |  \   \  / |  \/|
        /\_| || |-| |  | |  |  /_  /  \ |  __/
        \____/\_/ \_/  \_/  \____\/__/\\\_/   
              v 1.0  all right reserved
*/
function insertSorted(a, o) {var lo = 0, hi = a.length;while (lo < hi) {var mid = (lo + hi) >> 1;if (a[mid].z > o.z) hi = mid; else lo = mid + 1;}a.splice(lo, 0, o);} function mergeSortedArrays(arr) {var indices = new Array(arr.length).fill(0), merged = []; while (true) { var minIdx = -1, minZ = Infinity;for (var i = 0; i < arr.length; i++) {if (indices[i] < arr[i].length) {var z = arr[i][indices[i]].z;if (z < minZ) { minZ = z; minIdx = i; }}}if (minIdx === -1) break;merged.push(arr[minIdx][indices[minIdx]++]);}return merged; } function jtxEngine() {var engine = {};
engine.canvas = null;engine.ctx = null;engine.maps = [];engine.textures = {};engine.scrollX = 0;engine.scrollY = 0;engine.zoom = 1;engine.Canvas = function(selector) {engine.canvas = document.querySelector(selector);engine.ctx = engine.canvas.getContext("2d");engine.ctx.imageSmoothingEnabled = false;engine.ctx.mozImageSmoothingEnabled = false;engine.ctx.webkitImageSmoothingEnabled = false;engine.ctx.msImageSmoothingEnabled = false;return engine.canvas;};engine.setCanvas = function(canvasElement) {engine.canvas = canvasElement;engine.ctx = engine.canvas.getContext("2d");engine.ctx.imageSmoothingEnabled = false;engine.ctx.mozImageSmoothingEnabled = false;engine.ctx.webkitImageSmoothingEnabled = false;engine.ctx.msImageSmoothingEnabled = false;return engine.canvas;};engine.Textures = function(textureDict) {var count = Object.keys(textureDict).length, loaded = 0;for (var key in textureDict) { if (textureDict.hasOwnProperty(key)) {var img = new Image();img.src = textureDict[key];img.onload = function() { loaded++; if (loaded === count) engine.render(); };engine.textures[key] = img; }}};engine.Map = function() {var map = {};map.offscreen = { w: 0, h: 0 };map.scrollX=0; map.scrollY=0;map.zlayer = 0;map.objs = [];map.grid = {};map.cellSize = 64;map.type = "static";map.OBJ = function(obj) { obj.data = obj.data || {}; map.objs.push(obj); if (map.type === "static") {var cellX = Math.floor(obj.x / map.cellSize);var cellY = Math.floor(obj.y / map.cellSize);var key = cellX + "_" + cellY;if (!map.grid[key]) map.grid[key] = [];insertSorted(map.grid[key], obj); }};function rebuildGrid() { map.grid = {}; for (var i = 0; i < map.objs.length; i++) {var obj = map.objs[i];var cellX = Math.floor(obj.x / map.cellSize);var cellY = Math.floor(obj.y / map.cellSize);var key = cellX + "_" + cellY;if (!map.grid[key]) map.grid[key] = [];insertSorted(map.grid[key], obj); }}function hasName(nested, searchName) { if (searchName === "") return true; if (Array.isArray(nested)) return nested.indexOf(searchName) !== -1; if (typeof nested === "object" && nested !== null) {for (var key in nested) {if (key === searchName) return true;if (hasName(nested[key], searchName)) return true;} } return false;}map.EditOBJS = function(searchName, params) { for (var i = 0; i < map.objs.length; i++) {var obj = map.objs[i];if (obj.name && hasName(obj.name, searchName)) {for (var key in params) { if (params.hasOwnProperty(key)) {if (key.indexOf("add") === 0) {var base = key.slice(3);base = base.toLowerCase() === "rotation" ? "r" : base.toLowerCase();obj[base] = (obj[base] || 0) + params[key];} else {obj[key] = key === "rotation" ? params[key] : params[key];} }}} } if (map.type === "static") rebuildGrid();};map.editVisibleOBJS = function(searchName, params) { if (map.type !== "static") return; var viewX = engine.scrollX, viewY = engine.scrollY,viewW = engine.canvas.width / engine.zoom, viewH = engine.canvas.height / engine.zoom,marginW = map.offscreen ? map.offscreen.w : 0, marginH = map.offscreen ? map.offscreen.h : 0,extendedX = viewX - marginW, extendedY = viewY - marginH,extendedW = viewW + 2 * marginW, extendedH = viewH + 2 * marginH,cs = map.cellSize,minCellX = Math.floor(extendedX / cs),maxCellX = Math.floor((extendedX + extendedW) / cs),minCellY = Math.floor(extendedY / cs),maxCellY = Math.floor((extendedY + extendedH) / cs),cellArrays = []; for (var cx = minCellX; cx <= maxCellX; cx++) {for (var cy = minCellY; cy <= maxCellY; cy++) {var key = cx + "_" + cy;
if (map.grid[key]) cellArrays.push(map.grid[key]);} } var visibleObjs = mergeSortedArrays(cellArrays); for (var i = 0; i < visibleObjs.length; i++) {var obj = visibleObjs[i];if (obj.name && hasName(obj.name, searchName)) {for (var key in params) { if (params.hasOwnProperty(key)) {if (key.indexOf("add") === 0) {var base = key.slice(3);base = base.toLowerCase() === "rotation" ? "r" : base.toLowerCase();obj[base] = (obj[base] || 0) + params[key];} else {obj[key] = key === "rotation" ? params[key] : params[key];} }}} } rebuildGrid();};map.RmOBJS = function(searchName) { var newObjs = []; for (var i = 0; i < map.objs.length; i++) {var obj = map.objs[i];if (obj.name && hasName(obj.name, searchName)) continue;newObjs.push(obj); } map.objs = newObjs; if (map.type === "static") rebuildGrid();};
map.removeOBJ = function(obj) {let index = map.objs.indexOf(obj);
if (index !== -1) {map.objs[index] = map.objs[map.objs.length - 1]; map.objs.pop(); }if (map.type === "static") {
let cellX = Math.floor(obj.x / map.cellSize);let cellY = Math.floor(obj.y / map.cellSize);let key = cellX + "_" + cellY;
if (map.grid[key]) {
let gridIndex = map.grid[key].indexOf(obj);
if (gridIndex !== -1) {
map.grid[key].splice(gridIndex, 1); }}}};
map.ScrollBy = function(x, y) { map.scrollX += x; map.scrollY += y; };map.SetScroll = function(x, y) { map.scrollX = x; map.scrollY = y; }
map.updateObjectPosition = function(obj) {
  if (!obj) return;var newCellX = Math.floor(obj.x / map.cellSize);var newCellY = Math.floor(obj.y / map.cellSize);var newCellKey = newCellX + "_" + newCellY;
  if (!obj._cell) {obj._cell = newCellKey; return;} if (obj._cell === newCellKey) return; var oldCellKey = obj._cell;if (map.grid[oldCellKey]) {var index = map.grid[oldCellKey].indexOf(obj);if (index !== -1) {map.grid[oldCellKey].splice(index, 1); }  } if (!map.grid[newCellKey]) map.grid[newCellKey] = [];insertSorted(map.grid[newCellKey], obj);
  obj._cell = newCellKey;};map.GetOBJS = function(searchName) { var results = []; for (var i = 0; i < map.objs.length; i++) {var obj = map.objs[i];if (obj.name && hasName(obj.name, searchName)) results.push(obj); } return results;};map.getAllOBJS = map.GetOBJS; map.getVisibleOBJS = function(searchName) { if (map.type !== "static") return map.objs;var viewX = engine.scrollX,viewY = engine.scrollY,viewW = engine.canvas.width / engine.zoom,viewH = engine.canvas.height / engine.zoom,marginW = map.offscreen ? map.offscreen.w : 0,marginH = map.offscreen ? map.offscreen.h : 0,extendedX = viewX - marginW,extendedY = viewY - marginH,extendedW = viewW + 2 * marginW,extendedH = viewH + 2 * marginH,cs = map.cellSize,minCellX = Math.floor(extendedX / cs),maxCellX = Math.floor((extendedX + extendedW) / cs),minCellY = Math.floor(extendedY / cs),
maxCellY = Math.floor((extendedY + extendedH) / cs);var visibleObjs = [];for (var cx = minCellX; cx <= maxCellX; cx++) {for (var cy = minCellY; cy <= maxCellY; cy++) {var key = cx + "_" + cy;if (map.grid[key]) {for (var obj of map.grid[key]) {if (obj.x + obj.w > extendedX && obj.x < extendedX + extendedW &&obj.y + obj.h > extendedY && obj.y < extendedY + extendedH) {if (obj.name && hasName(obj.name, searchName)) {visibleObjs.push(obj); } } } } } }return visibleObjs;};
return map;}; 
engine.Background = function(textureSrc, options) {
  if (!engine.textures[textureSrc]) {
    var img = new Image();
    img.src = textureSrc;
    engine.textures[textureSrc] = img;
  }
  if (options.infinite === true) {
    if (typeof options.x === "undefined") options.x = null;
    if (typeof options.y === "undefined") options.y = null;
  } else {
    options.x = (typeof options.x !== "undefined") ? options.x : 0;
    options.y = (typeof options.y !== "undefined") ? options.y : 0;
  }
  
  var bg = {
    texture: textureSrc,
    options: options,
    stopFlags: { w: false, h: false },
    fixedScroll: { w: null, h: null },
    render: function(ctx, tileX, tileY) {
      var img = engine.textures[textureSrc];
      if (!img || !img.complete) return;
      var w = (typeof options.width === "string" && options.width.indexOf("%") !== -1) ? engine.canvas.width : options.width;
      var h = (typeof options.height === "string" && options.height.indexOf("%") !== -1) ? engine.canvas.height : options.height;
      var scrollX = options.xy.x,
        scrollY = options.xy.y;
      var camFactorX = (Math.abs(options.camerafollowX) || 1);
      var camFactorY = (Math.abs(options.camerafollowY) || 1);
      
      var effectiveScrollX = ((bg.stopFlags.w ? bg.fixedScroll.w : scrollX) + options.x) * camFactorX;
      var effectiveScrollY = ((bg.stopFlags.h ? bg.fixedScroll.h : scrollY) + options.y) * camFactorY;
      
      ctx.drawImage(img, tileX - effectiveScrollX, tileY - effectiveScrollY, w + 1, h + 1);
    },
    stop: function(axis) {
      if (axis === "w" && !bg.stopFlags.w) {
        bg.fixedScroll.w = engine.scrollX;
        bg.stopFlags.w = true;
      }
      if (axis === "h" && !bg.stopFlags.h) {
        bg.fixedScroll.h = engine.scrollY;
        bg.stopFlags.h = true;
      }
      return bg;
    },
    continue: function(axis) {
      if (axis === "w") {
        bg.stopFlags.w = false;
        bg.fixedScroll.w = null;
      }
      if (axis === "h") {
        bg.stopFlags.h = false;
        bg.fixedScroll.h = null;
      }
      return bg;
    },
    remove: function() { bg.removed = true; }
  };
  
  return bg;
};

engine.drawBg = function(ctx,thisbg){
  if (thisbg) {ctx.save();thisbg.forEach(function(bg) {if (!bg || !bg.render || bg.removed) return;ctx.save();if (bg.options.bgrepeat) {
    var bgWidth = bg.options.width || engine.canvas.width;var bgHeight = bg.options.height || engine.canvas.height;
     if(bg.stopFlags.w || bg.stopFlags.h){
    var effectiveScrollX = (bg.stopFlags.w ? bg.fixedScroll.w : bg.options.xy.x/engine.zoom) + bg.options.x;
    var effectiveScrollY = (bg.stopFlags.h ? bg.fixedScroll.h : bg.options.xy.y/engine.zoom) + bg.options.y;
     }else {
       var effectiveScrollX = (bg.options.infinite && bg.options.x === null) ? 0 : Math.floor(bg.options.xy.x + bg.options.x) * (Math.abs(bg.options.camerafollowX) || 1);var effectiveScrollY = (bg.options.infinite && bg.options.y === null) ? 0 : Math.floor(bg.options.xy.y + bg.options.y) * (Math.abs(bg.options.camerafollowY) || 1);
     }
var startX = bg.options.infinite ? 0 : effectiveScrollX - (effectiveScrollX % bgWidth) - engine.canvas.width;var startY = bg.options.infinite ? 0 : effectiveScrollY - (effectiveScrollY % bgHeight) - engine.canvas.height;var endX = bg.options.infinite ? engine.canvas.width : effectiveScrollX + (engine.canvas.width + 100 )/ engine.zoom;
var endY = bg.options.infinite ? engine.canvas.height : effectiveScrollY + (engine.canvas.height + 100 )/ engine.zoom;for (var x = startX; x < endX; x += bgWidth) {for (var y = startY; y < endY; y += bgHeight) {
if(bg.options.infinite && bg.options.x === null && bg.options.y === null) {bg.render(ctx, x, y);
} else {bg.render(ctx, x, y );}}}} else {bg.render(ctx, 0, 0);} ctx.restore();});ctx.restore();}
}
engine.SetRenderer = function(maps) {engine.maps = maps;engine.render();};
 
engine.render = function() {if (!engine.canvas || !engine.ctx) return;if (typeof engine.renderScriptBefore === "function") {engine.renderScriptBefore(ctx);}var ctx = engine.ctx;ctx.imageSmoothingEnabled = false;ctx.mozImageSmoothingEnabled = false;ctx.webkitImageSmoothingEnabled = false;ctx.msImageSmoothingEnabled = false;
  ctx.save();ctx.scale(engine.zoom, engine.zoom);ctx.clearRect(0, 0, engine.canvas.width / engine.zoom, engine.canvas.height / engine.zoom);
  engine.drawBg(ctx,this.bgs)
 

engine.maps.sort(function(a, b) { return a.zlayer - b.zlayer; });for (var m = 0; m < engine.maps.length; m++) {
var map = engine.maps[m],vx = engine.scrollX-map.scrollX, vy = engine.scrollY-map.scrollX,vw = engine.canvas.width / engine.zoom, vh = engine.canvas.height / engine.zoom,mw = map.offscreen ? map.offscreen.w : 0, mh = map.offscreen ? map.offscreen.h : 0,ex = vx - mw, ey = vy - mh, ew = vw + 2 * mw, eh = vh + 2 * mh;if (map.type === "static") {var cs = map.cellSize, mcx = Math.floor(ex / cs), MCX = Math.floor((ex + ew) / cs),mcy = Math.floor(ey / cs), MCY = Math.floor((ey + eh) / cs), cells = [];
for (var cx = mcx; cx <= MCX; cx++) {for (var cy = mcy; cy <= MCY; cy++) {
var key = cx + "_" + cy;if (map.grid[key]) cells.push(map.grid[key]);}}var vis = mergeSortedArrays(cells);for (var i = 0; i < vis.length; i++) {var o = vis[i];if (o.x + o.w < ex || o.x > ex + ew || o.y + o.h < ey || o.y > ey + eh) continue;ctx.save();ctx.globalAlpha = (o.alpha !== undefined ? o.alpha : 1);var cxPos = o.x + o.w / 2 - vx, cyPos = o.y + o.h / 2 - vy;ctx.translate(cxPos, cyPos);ctx.rotate(o.r || 0);var img = engine.textures[o.t];
if (img && img.complete) ctx.drawImage(img, -o.w / 2, -o.h / 2, o.w+1, o.h+1);
else { ctx.fillStyle = "red"; ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); }ctx.restore();}} else {
for (var i = 0; i < map.objs.length; i++) {
var o = map.objs[i];ctx.save();ctx.globalAlpha = (o.alpha !== undefined ? o.alpha : 1);var cxPos = o.x + o.w / 2 - vx, cyPos = o.y + o.h / 2 - vy;ctx.translate(cxPos, cyPos);ctx.rotate(o.r || 0);var img = engine.textures[o.t];
if (img && img.complete) ctx.drawImage(img, -o.w / 2, -o.h / 2, o.w+1, o.h+1);
else { ctx.fillStyle = "red"; ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); }ctx.restore();}}}ctx.restore();
engine.drawBg(ctx,this.bgs2)
if (typeof engine.renderScriptAfter === "function") {engine.renderScriptAfter(ctx);}};
engine.ScrollBy = function(x, y) { engine.scrollX += x; engine.scrollY += y; };engine.SetScroll = function(x, y) { engine.scrollX = x; engine.scrollY = y; };engine.UpdateRenderer = function() { engine.render(); };engine.Zoom = function(scale) { engine.zoom = scale; };
engine.OBJSclick = function(cb, nozoom,custom) {engine.canvas.addEventListener("click", function(e) { var r = engine.canvas.getBoundingClientRect(),
x = (e.clientX - r.left) / engine.zoom + engine.scrollX;
y = (e.clientY - r.top) / engine.zoom + engine.scrollY;
if(nozoom){x = (e.clientX - r.left) + engine.scrollX,
  y = (e.clientY - r.top)  + engine.scrollY;}
  if(custom){
x = (e.clientX/ custom - r.left)  + engine.scrollX;
y = (e.clientY/ custom - r.top) + engine.scrollY;
  }
engine.maps.forEach(function(map) { var objs = (map.type === "static") ? map.getVisibleOBJS("") : map.objs;objs.forEach(function(o) {if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) cb(o);}); });});};

engine.renderBg = function(layers) {engine.bgs=layers; engine.render()};engine.renderBgAbove = function(layers) {engine.bgs2=layers; engine.render()};
engine.OBJSpress = function(cb) {engine.canvas.addEventListener("mousedown", function(e) { var r = engine.canvas.getBoundingClientRect(),x = (e.clientX/ engine.zoom  - r.left) +engine.scrollX,y = (e.clientY/ engine.zoom  - r.top)+ engine.scrollY; engine.maps.forEach(function(map) {var objs = (map.type === "static") ? map.getVisibleOBJS("") : map.objs;objs.forEach(function(o) {if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) cb(o);}); });});};return engine; } function collides(a, b) {return !(a.x + a.w <= b.x || a.x >= b.x + b.w || a.y + a.h <= b.y || a.y >= b.y + b.h); } const PI = Math.PI; const TWO_PI = 2 * PI; function mod(x, m) {while (x < 0) x += m;while (x >= m) x -= m;return x; } function sin(x) {x = mod(x, TWO_PI);const x2 = x * x;return x - (x2 * x) / 6 + (x2 * x2 * x) / 120 - (x2 * x2 * x2 * x) / 5040; } function cos(x) {x = mod(x, TWO_PI);const x2 = x * x;return 1 - x2 / 2 + (x2 * x2) / 24 - (x2 * x2 * x2) / 720; } function tan(x) {return sin(x) / cos(x); } function abs(x) {return x < 0 ? -x : x; } function atan(x) {let absX = abs(x);if (absX > 1) {return (x < 0 ? -PI/2 : PI/2) - atan(1/absX);}return (PI / 4) * x - x * (absX - 1) * (0.2447 + 0.0663 * absX); } function atan2(y, x) {if (x === 0) {if (y > 0) return PI / 2;if (y < 0) return -PI / 2;return 0;}let angle = atan(y / x);if (x > 0) return angle;return y >= 0 ? angle + PI : angle - PI; } function angleBetween(x1, y1, x2, y2) {return atan2(y2 - y1, x2 - x1); }
function getscreem(id) {
  var canvas = document.getElementById(id);var ctx = canvas.getContext('2d');ctx.imageSmoothingEnabled = true;  function resizeCanvas() {
    var tempCanvas = document.createElement("canvas");var tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;tempCanvas.height = canvas.height;tempCtx.drawImage(canvas, 0, 0);canvas.width = window.innerWidth;canvas.height = window.innerHeight;ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
  }window.addEventListener('resize', resizeCanvas);
  return {
    canvas: canvas,ctx: ctx,get width() { return canvas.width; },get height() { return canvas.height; },alpha: 1.0,clear: function() { ctx.clearRect(0, 0, canvas.width, canvas.height); },drawbox: function(x1, y1, x2, y2, fill) {
ctx.beginPath();ctx.rect(x1, y1, x2 - x1, y2 - y1);if (typeof fill === 'number') {let hex = fill.toString(16);hex = hex.padStart(6, '0');fill = '#' + hex;}if (typeof fill === 'string') {ctx.fillStyle = fill;
ctx.fill();} else if (fill instanceof Image) {ctx.drawImage(fill, x1, y1, x2 - x1, y2 - y1);}ctx.closePath();},drawtriangle: function(x1, y1, x2, y2, x3, y3, fill) {ctx.beginPath();ctx.moveTo(x1, y1);ctx.lineTo(x2, y2);ctx.lineTo(x3, y3);ctx.closePath();if (typeof fill === 'number') {let hex = fill.toString(16);hex = hex.padStart(6, '0');fill = '#' + hex;
}if (typeof fill === 'string') {
ctx.fillStyle = fill;ctx.fill();} else if (fill instanceof Image) {var pattern = ctx.createPattern(fill, 'repeat');ctx.fillStyle = pattern;ctx.fill();}},texture: function(src) {var img = new Image();img.src = src;return img;},
click: function(callback) {if (typeof callback === 'function') {this.clickHandler = (event) => {var x = event.offsetX;var y = event.offsetY;callback(x, y);};this.canvas.addEventListener('click', this.clickHandler);}},press: function(onPress, onRelease) {this.pressStartHandler = (event) => {var x = event.offsetX;var y = event.offsetY;
onPress(x, y);};this.pressEndHandler = (event) => {onRelease();};this.canvas.addEventListener('mousedown', this.pressStartHandler);this.canvas.addEventListener('mouseup', this.pressEndHandler);
},rmevent: function() {this.canvas.removeEventListener('click', this.clickHandler);this.canvas.removeEventListener('mousedown', this.pressStartHandler);this.canvas.removeEventListener('mouseup', this.pressEndHandler);},pressHandler: function(event) {var x = event.offsetX;var y = event.offsetY;callback(x, y);},scale: function(sx, sy) { ctx.scale(sx, sy); },translate: function(tx, ty) { ctx.translate(tx, ty); },rotate: function(angle) { ctx.rotate(angle); },
drawpointbox: function(x1, y1, x2, y2, x3, y3, x4, y4, fill, stretch3d) {ctx.beginPath();ctx.moveTo(x1, y1);ctx.lineTo(x2, y2);ctx.lineTo(x3, y3);ctx.lineTo(x4, y4);ctx.closePath();ctx.lineJoin = "round";ctx.lineCap = "round";
if (typeof fill === 'number') {let hex = fill.toString(16);hex = hex.padStart(6, '0');fill = '#' + hex;}
if (typeof fill === 'string') {ctx.fillStyle = fill;ctx.fill();ctx.strokeStyle = fill;ctx.stroke();} else if (fill instanceof Image) {if (stretch3d) {
ctx.save();var w = fill.width,h = fill.height;
var a = x2 - x1;var b = y2 - y1;var c = x4 - x1;var d = y4 - y1;ctx.setTransform(a / w, b / w, c / h, d / h, x1, y1);ctx.drawImage(fill, 0, 0, w, h);ctx.restore();} else {var pattern = ctx.createPattern(fill, 'repeat');ctx.fillStyle = pattern;ctx.fill();}}},drawtext: function(x, y, text, textSize, colorOrTexture, fontStyle) {ctx.font = ` normal ${textSize}px Arial`;if (fontStyle) {ctx.font = fontStyle;}if (typeof colorOrTexture === 'number') {let hex = colorOrTexture.toString(16);hex = hex.padStart(6, '0');colorOrTexture = '#' + hex;}
if (colorOrTexture instanceof Image) {var pattern = ctx.createPattern(colorOrTexture, 'repeat');ctx.fillStyle = pattern;} else {ctx.fillStyle = colorOrTexture;}ctx.fillText(text, x, y);},drawsphere: function(x, y, fill) {
var r = 50;ctx.beginPath();ctx.arc(x, y, r, 0, Math.PI * 2);ctx.closePath();if (typeof fill === 'number') {let hex = fill.toString(16);hex = hex.padStart(6, '0');fill = '#' + hex;}if (typeof fill === 'string') {ctx.fillStyle = fill;ctx.fill();} else if (fill instanceof Image) {var pattern = ctx.createPattern(fill, 'repeat');ctx.fillStyle = pattern;ctx.fill(); } }, drawline: function(x1, y1, x2, y2, thickness, fill) {  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);   ctx.lineWidth = thickness;  ctx.lineCap = "round";if (typeof fill === 'number') { let hex = fill.toString(16); hex = hex.padStart(6, '0');   fill = '#' + hex;}if (typeof fill === 'string') { ctx.strokeStyle = fill;} else if (fill instanceof Image) { var pattern = ctx.createPattern(fill, 'repeat');ctx.strokeStyle = pattern;} ctx.stroke();}};}
function CSS(selector, styles) {document.querySelectorAll(selector).forEach(function(el) {el.style.cssText = styles;});} 
function CSS_STYLES( styles ) {  
  let stylecss= document.createElement('style')
  stylecss.innerHTML=styles
  document.documentElement.appendChild(stylecss) }
function parseVar(value, bynum) {
  return Math.round(value / bynum) * bynum;
}
function getBase64Image(key, rsrc) {
      if (typeof rsrc !== "undefined" && rsrc[key]) {return "data:image/png;base64," + rsrc[key];} else {console.warn(`err: ${key}`);}}
