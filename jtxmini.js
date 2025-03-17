/* you can make your own distribution its free and opensource parser */
 (function(){
  function tokenize(input) {
    let tokens = [];
    let current = "";
    let inString = false, stringChar = "";
    let inRegex = false, escaped = false;
    for (let i = 0; i < input.length; i++) {
      let ch = input[i];
      if (escaped) {
        current += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        current += ch;
        escaped = true;
        continue;
      }
      if (!inString && !inRegex && input.substr(i,2) === "//") {
        while (i < input.length && input[i] !== "\n") { i++; }
        continue;
      }
      if (!inString && !inRegex && ch === "#") {
        while (i < input.length && input[i] !== "\n") { i++; }
        continue;
      }
      if (inString) {
        current += ch;
        if (ch === stringChar) {
          inString = false;
          stringChar = "";
        }
        continue;
      }
      if (inRegex) {
        current += ch;
        if (ch === "/" && !escaped) { inRegex = false; }
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = true;
        stringChar = ch;
        current += ch;
        continue;
      }
      if (ch === "/") {
        let trimmed = current.trim();
        if (trimmed === "" || /[\(\=\:\,\{\[\;]$/.test(trimmed)) { inRegex = true; }
        current += ch;
        continue;
      }
      if (ch === ";" || ch === "\n") {
        if (current.trim() !== "") { tokens.push(current.trim()); }
        current = "";
        continue;
      }
      current += ch;
    }
    if (current.trim() !== "") { tokens.push(current.trim()); }
    return tokens;
  }
  function replacePrintfOutsideLiterals(line) {
    let result = "";
    let inString = false, stringChar = "";
    let inRegex = false, escaped = false;
    for (let i = 0; i < line.length; i++) {
      let ch = line[i];
      if (escaped) {
        result += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        result += ch;
        escaped = true;
        continue;
      }
      if (inString) {
        result += ch;
        if (ch === stringChar) { inString = false; stringChar = ""; }
        continue;
      }
      if (inRegex) {
        result += ch;
        if (ch === "/" && !escaped) { inRegex = false; }
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = true;
        stringChar = ch;
        result += ch;
        continue;
      }
      if (ch === "/") {
        let trimmed = result.trim();
        if (trimmed === "" || /[\(\=\:\,\{\[\;]$/.test(trimmed)) { inRegex = true; }
        result += ch;
        continue;
      }
      if (line.slice(i, i+7) === "printf(") {
        result += "console.log(";
        i += 6;
        continue;
      }
      result += ch;
    }
    return result;
  }
  function minijsToJs(input) {
    let tokens = tokenize(input);
    let outputLines = [];
    let declaredVariables = new Set();
        let funcCallStack = { wait: 0, fun: 0, fori:0, all:0 };
    let waitTimes=[]
    tokens.forEach(token => {
      let line = token;

 let waitMatch = line.match(/^wait\s+(\d+)\s*:?$/);
if (waitMatch) {
  let ms = waitMatch[1];
  waitTimes.push(ms);
  funcCallStack["wait"]++;
  outputLines.push(`setTimeout( function() {`);
  return;
}
      if (line.startsWith("fun ")) {
        let funcName = line.slice(4).trim();
        if (funcName.endsWith(":")) {
          funcName = funcName.slice(0, -1).trim();
          funcCallStack["fun"]++;
          outputLines.push(`function ${funcName} {`);
        }
        
        return;
      }

      
if (line.startsWith("for ")) {
  let header = line.slice(4).trim();
  if (header.endsWith(":")) {
    header = header.slice(0, -1).trim();
  }
  header = header.replace(/,/g, ';');
  header = header.replace(/(\w+)\.\./g, '$1.length');
  funcCallStack["fori"]++;
  outputLines.push(`for (${header}) {`);
  return;
}
    if (line === "end" ) {
if (funcCallStack["wait"] > 0 &&  funcCallStack["fun"] > 0) {
  let ms = waitTimes.shift();
  outputLines.push(`},${ms});`);
  funcCallStack["wait"]--;
  return;
}  if (funcCallStack["fun"] > 0) {
  outputLines.push("}");
  funcCallStack["fun"]--;
  return;
}if (funcCallStack["wait"] > 0 ) {
  let ms = waitTimes.shift();
  outputLines.push(`},${ms});`);
  funcCallStack["wait"]--;
  return;
} else if (funcCallStack["for"] > 0 ) {
        outputLines.push("}");
        funcCallStack["fori"]--;
        return;
      }
    }


      let regexIf = /^if\s+(.*)$/;
      if (regexIf.test(line)) {
        let condition = line.match(regexIf)[1];
        if (condition.endsWith(";")) { condition = condition.slice(0, -1); }
        condition = condition.replace(/!=/g, "!==");
        condition = condition.replace(/(?<![=!])=(?![=])/g, "==");
        outputLines.push(`if(${condition}){`);
        return;
      }
 let regexIf2 = /^else if\s+(.*)$/;
if (regexIf2.test(line)) {
  let condition = line.match(regexIf2)[1];
  if (condition.endsWith(";")) { condition = condition.slice(0, -1); }
  condition = condition.replace(/!=/g, "!==");
  condition = condition.replace(/(?<![=!])=(?![=])/g, "==");
  outputLines.push(`} else if(${condition}){`);
  return;
}
let regexIf3 = /^else/;
if (regexIf3.test(line)) {
  outputLines.push(`} else {`);
  return;
}
if (line === "end") {
  outputLines.push("}");
  return;
}
      let assignmentMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignmentMatch) {
        let varName = assignmentMatch[1];
        let expression = assignmentMatch[2].trim();
        if (!declaredVariables.has(varName)) {
          declaredVariables.add(varName);
          line = `  ${varName}=${expression};`;
        } else {
          line = `${varName}=${expression};`;
        }
      } else {
        if (!line.endsWith(";") && !line.endsWith("{") && !line.endsWith("}")) {
          line = line + ";";
        }
      }
      line = replacePrintfOutsideLiterals(line);
      outputLines.push(line);
    });
    return outputLines.filter(l => l.trim() !== "").join("\n");
  }
  document.addEventListener("DOMContentLoaded", function(){
    let scripts = document.querySelectorAll('script[type="jtx"]');
    scripts.forEach(script => {
      let code = script.textContent;
      let transpiled = minijsToJs(code);
      let newScript = document.createElement("script");
//document.documentElement.innerText=transpiled
//alert(transpiled)
      newScript.type = "application/javascript";
      newScript.text = transpiled;
      document.body.appendChild(newScript);
    });
  });
})();

function createscreen(id, zindex) {
  var canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = zindex;
  canvas.style.backgroundColor = 'transparent';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  
  function resizeCanvas() {
    var tempCanvas = document.createElement("canvas");
    var tempCtx = tempCanvas.getContext("2d");
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
  }
  
  window.addEventListener('resize', resizeCanvas);
  
  return {
    canvas: canvas,
    ctx: ctx,
    get width() { return canvas.width; },
    get height() { return canvas.height; },
    alpha: 1.0,
    clear: function() { ctx.clearRect(0, 0, canvas.width, canvas.height); },
drawbox: function(x1, y1, x2, y2, fill) {
  ctx.beginPath();
  ctx.rect(x1, y1, x2 - x1, y2 - y1);
  if (typeof fill === 'number') {
    let hex = fill.toString(16);
    hex = hex.padStart(6, '0');
    fill = '#' + hex;
  }
  if (typeof fill === 'string') {
    ctx.fillStyle = fill;
    ctx.fill();
  } else if (fill instanceof Image) {
    ctx.drawImage(fill, x1, y1, x2 - x1, y2 - y1);
  }
  ctx.closePath();
},
    drawtriangle: function(x1, y1, x2, y2, x3, y3, fill) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
 if (typeof fill === 'number') {
  let hex = fill.toString(16);
  hex = hex.padStart(6, '0');
  fill = '#' + hex;
}
      if (typeof fill === 'string') {
        ctx.fillStyle = fill;
        ctx.fill();
      } else if (fill instanceof Image) {
        var pattern = ctx.createPattern(fill, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fill();
      }
    },
    texture: function(src) {
      var img = new Image();
      img.src = src;
      return img;
    },
    scale: function(sx, sy) { ctx.scale(sx, sy); },
    translate: function(tx, ty) { ctx.translate(tx, ty); },
    rotate: function(angle) { ctx.rotate(angle); },
    drawpointbox: function(x1, y1, x2, y2, x3, y3, x4, y4, fill, stretch3d) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
 if (typeof fill === 'number') {
  let hex = fill.toString(16);
  hex = hex.padStart(6, '0');
  fill = '#' + hex;
}
      if (typeof fill === 'string') {
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = fill;
        ctx.stroke();
      } else if (fill instanceof Image) {
        if (stretch3d) {
          ctx.save();
          var w = fill.width,
            h = fill.height;
          var a = x2 - x1;
          var b = y2 - y1;
          var c = x4 - x1;
          var d = y4 - y1;
          ctx.setTransform(a / w, b / w, c / h, d / h, x1, y1);
          ctx.drawImage(fill, 0, 0, w, h);
          ctx.restore();
        } else {
          var pattern = ctx.createPattern(fill, 'repeat');
          ctx.fillStyle = pattern;
          ctx.fill();
        }
      }
    },
 drawtext: function(x, y, text, textSize, colorOrTexture, fontStyle) {
  ctx.font = ` normal ${textSize}px Arial`; 
  if(fontStyle){
    ctx.font = fontStyle; 
  }
  if (typeof colorOrTexture === 'number') {
  let hex = colorOrTexture.toString(16);
  hex = hex.padStart(6, '0');
  colorOrTexture = '#' + hex;
}
  if (colorOrTexture instanceof Image) {
    var pattern = ctx.createPattern(colorOrTexture, 'repeat');
    ctx.fillStyle = pattern;
  } else {
    ctx.fillStyle = colorOrTexture;
  }
  ctx.fillText(text, x, y); 
},

    
    drawsphere: function(x, y, fill) {
      var r = 50;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.closePath();
 if (typeof fill === 'number') {
  let hex = fill.toString(16);
  hex = hex.padStart(6, '0');
  fill = '#' + hex;
}
      if (typeof fill === 'string') {
        ctx.fillStyle = fill;
        ctx.fill();
      } else if (fill instanceof Image) {
        var pattern = ctx.createPattern(fill, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fill();
      }
    },
    drawline: function(x1, y1, x2, y2, thickness, fill) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
if (typeof fill === 'number') {
  let hex = fill.toString(16);
  hex = hex.padStart(6, '0');
  fill = '#' + hex;
}
      if (typeof fill === 'string') {
        ctx.strokeStyle = fill;
      } else if (fill instanceof Image) {
        var pattern = ctx.createPattern(fill, 'repeat');
        ctx.strokeStyle = pattern;
      }
      ctx.stroke();
    }
  };
}
function audio(src) {
  var aud = new Audio(src);
  aud.loop = false;
  return {
    get time() { return aud.currentTime; },
    set time(val) { aud.currentTime = val; },
    play: function() { aud.play(); },
    stop: function() { aud.pause(); },
    remove: function() { aud.src = ""; },
    get src() { return aud.src; },
    set src(val) { aud.src = val; },
    get loop() { return aud.loop; },
    set loop(val) { aud.loop = val; }
  };
} 

