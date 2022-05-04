let ctx;
let tempctx;
let loaded_text_files;
let loaded_images;
let current_tool = "Pencil";
let current_tool_size = 1;
let current_tool_color = "#000000";
let current_tool_alpha = 1;
let current_tool_secondary_color = "#FFFFFF"
let current_tool_buffer = [];
let buttons_held = new Set();
let unsaved_changes_warning = false;

function zipEditorInit() {
	document.body.innerHTML += 
	`
	<div class="ze" style="top:100vh" onmouseup="releaseWindows();" onmousemove="moveWindows();">
		<div class="topbar">
			<button class="button" onclick="zipEditorImport()">Import</button>
			<button class="button" onclick="zipEditorExport()">Export</button>
			<div class="darkbutton" onclick="toggleTheme()">
				<svg viewBox="0 0 512 512"><path fill="white" d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z"/></svg>
			</div>
			<div class="closebutton" onclick="zipEditorClose()">
				<svg height="50" width="50">
					<line x1="10" y1="10" x2="40" y2="40" style="stroke:#FFF; stroke-width:5; stroke-linecap:round" />
					<line x1="10" y1="40" x2="40" y2="10" style="stroke:#FFF; stroke-width:5; stroke-linecap:round" />
				</svg>
			</div>
		</div>
		<div class="sidebar"></div>
		<div class="main">
			<div class="textedit" style="display:none;">
				<p></p>
				<p class="unsavedchanges"> (Unsaved Changes)</p>
				<textarea spellcheck="false" oninput="textUnsavedChanges()"></textarea>
			</div>
			<div class="imageedit" onwheel="zoomCanvas()" onmousemove="moveCanvas()" style="display:none;">
				<p></p>
				<div class="window" style="left:450px;top:100px;" onmousedown="startWindowDrag(this);">
					<p class="currenttooltext">Pencil</p>
					<div class="contents">
						<svg height="30" width="30" class="brushsize">
							<circle id="toolsize" fill="white" cx="15" cy="15" r="1"></circle>
						</svg>
						<input type="range" min="1" max="15" value="1" step="0.2" oninput="changeToolSize(this.value)">
						<input type="color" class="colorinput" oninput="changeToolColor(this.value, false)" value="#000000">
						<input type="color" class="secondarycolorinput" oninput="changeToolColor(this.value, true)" value="#FFFFFF">
						<svg height="30" width="30" class="brushalpha">
							<circle id="toolalpha" fill="black" fill-opacity="1" cx="15" cy="15" r="12"></circle>
						</svg>
						<input type="range" min="0" max="1" step="0.01" value="1" class="alphainput" oninput="changeToolAlpha(this.value, true)" >
					</div>
				</div>
				<div class="window" style="left:690px;top:100px;" onmousedown="startWindowDrag(this);">
					<p>Tools</p>
					<div class="contents">
						<button class="pencil selectedtool" onclick="selectTool('Pencil')"></button>
						<button class="eraser" onclick="selectTool('Eraser')"></button>
						<button class="eyedropper" onclick="selectTool('Eyedropper')"></button>
						<button class="selection" onclick="selectTool('Selection')"></button>
					</div>
				</div>
				<div class="canvascontainer" onmousemove="canvasActionMove()" onmousedown="canvasActionDown()" onmouseup="canvasActionUp()" oncontextmenu="event.preventDefault()">
					<canvas id="layer0"></canvas>
					<canvas class="tempcanvas"></canvas>
					<div class="cursor"></div>
				</div>
			</div>
			<button class="savechangesbutton" onclick="textSaveChanges()" style="display:none">Save Changes</button>
		</div>
		<input id="zipinput" type="file" style="display:none" accept=".zip" onchange="zipEditorImportZip()">
	</div>
	`
	document.body.onkeydown = keyDown;
	document.body.onkeyup = keyUp;;
	setTimeout(function() {
		document.querySelector('.ze').style.top = 0;
	}, 1)
}

function toggleTheme() {
	var old_theme = document.documentElement.getAttribute('theme')
	var new_theme = (old_theme == 'dark' ? 'main' : 'dark')
	document.documentElement.setAttribute('theme', new_theme);
	localStorage.setItem('jwbpTheme', new_theme)
	document.querySelector('.ze .topbar .darkbutton')
}

document.documentElement.setAttribute('theme', 'main');
if (localStorage.getItem('jwbpTheme') == 'dark') {
	toggleTheme()
}

function keyDown() {
	switch (event.key) {
		case "1":
			selectTool('Pencil');
			break;
		case "2":
			selectTool('Eraser');
			break;
		case "3":
			selectTool('Eyedropper');
			break;
		case "4":
			selectTool('Selection');
			break;
		case " ":
			buttons_held.add(event.key);
			break;
	}
}
function keyUp() {
	switch (event.key) {
		case " ":
			buttons_held.delete(event.key);
			break;
	}
}

function adjustPxString(str, diff) {
	return parseInt(str.replace('px','')) + diff + "px";
}

function startWindowDrag(elem) {
	if (event.layerY < 30) {
		elem.classList.add('dragged');
	}
}
function releaseWindows() {
	document.querySelectorAll('.dragged').forEach(elem => elem.classList.remove('dragged'))
}
function moveWindows() {
	const draggedWindow = document.querySelector('.dragged')
	if (draggedWindow !== null) {
		draggedWindow.style.left = adjustPxString(draggedWindow.style.left, event.movementX)
		draggedWindow.style.top = adjustPxString(draggedWindow.style.top, event.movementY)
	}
}

function zipEditorImport() {
	document.querySelector('.ze #zipinput').click();
}

function zipEditorClose() {
	document.querySelector('.ze').style.top = "100vh"
	setTimeout(function() {
		document.querySelector('.ze').remove();
	}, 500)
}

function zipEditorImportZip() {
	const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;

	for (let i = 0, f; f = files[i]; i++) {
		const loadedZip = new JSZip();
		loaded_text_files = {}
		loaded_images = {}
		document.querySelector('.sidebar').innerHTML = '';
		loadedZip.loadAsync(f).then(function (zip) {
			const folders = new Set();
			for (const [key, value] of Object.entries(zip.files)) {
				const itemPath = key.split("/")
				if (itemPath[0] !== "__MACOSX") {
					for (let i = 1; i < itemPath.length; i ++) {
						folders.add(itemPath.slice(0, i).join("/"))
					};
				};
			};
			const sortedFilePaths = Array.from(folders).sort()
			for (let p = 0; p < sortedFilePaths.length; p ++) {
				const item = sortedFilePaths[p];
				const itemArray = item.split("/")
				const folderName = itemArray.pop()
				var prefixDot = "";
				if (itemArray.length) {
					prefixDot = " ."
				}
				const destination = '.ze .sidebar' + prefixDot + itemArray.join(" .")
				document.querySelector(destination).innerHTML += `
				<div class="zipEditorFolder ${folderName}" onclick="toggleFolder(this)" style="height:30px">
					<p class="zipEditorFolderText">${folderName}</p>
					<svg height="10000" width="25">
						<line x1="4" y1="4" x2="21" y2="4" style="stroke:#555; stroke-width:3; stroke-linecap:round" />
						<line x1="21" y1="4" x2="21" y2="10000" style="stroke:#555; stroke-width:3; stroke-linecap:round" />
					</svg>
				</div>
				`
			}
			for (const [key, value] of Object.entries(zip.files)) {
				const itemPath = key.split("/")
				if (itemPath[0] !== "__MACOSX") {
					const temp = itemPath[itemPath.length - 1].split(".");
					itemExtension = temp[temp.length-1]
					if (['png','jpeg','jpg'].includes(itemExtension)) {
						const imagePathString = key;
						const imagePathArray = imagePathString.split("/");
						const imageName = imagePathArray.pop()
						var prefixDot = "";
						if (imagePathArray.length) {
							prefixDot = " ."
						}
						const destinationPath = '.ze .sidebar' + prefixDot + imagePathArray.join(" .") + ' .images'
						if (document.querySelector(destinationPath) == null) {
							document.querySelector(destinationPath.replace('.images', '')).innerHTML += 
							`<div class="images"></div>`
						}
						loadedZip.file(imagePathString).async("blob").then(function(blob) {
							const src = URL.createObjectURL(blob)
							loaded_images[imagePathString] = src;
							document.querySelector(destinationPath).innerHTML += 
							`<img path="${imagePathString}" onclick="if (checkIfSaved()) {closeAllTools();let path=this.getAttribute('path');initializeImageEditor(loaded_images[path],path)}" name="${imageName}" src="${src}">`
						})
					} else if (['txt','json','html','js','css'].includes(itemExtension)) {
						const filePathString = key;
						const filePathArray = filePathString.split("/");
						const fileName = filePathArray.pop()
						var prefixDot = "";
						if (filePathArray.length) {
							prefixDot = " ."
						}
						const destinationPath = '.ze .sidebar' + prefixDot + filePathArray.join(" .")
						loadedZip.file(filePathString).async("blob").then(function(blob) {
							blob.text().then(function (text) {
								loaded_text_files[filePathString] = text;
								document.querySelector(destinationPath).innerHTML += 
								`<p path="${filePathString}" onclick="if (checkIfSaved()) {closeAllTools();let path=this.getAttribute('path');initializeTextarea(loaded_text_files[path],path)}" class="zipEditorFileName">${fileName}</p>`
							})
						})
					}
				}
			};
		}, function () {
			alert("Not a valid zip file")
		});
	}
}

function checkIfSaved() {
	return !(unsaved_changes_warning && !confirm("You have unsaved, proceed anyway?"))
}

function initializeImageEditor(blob,path) {
	textDiscardChanges()
	const imgwindow = document.querySelector('.ze .main .imageedit');
	imgwindow.style.display = 'block';
	imgwindow.setAttribute('path', path);
	imgwindowrect = imgwindow.getBoundingClientRect()
	imgwindowmaxsize = Math.min(imgwindowrect.width, imgwindowrect.height)
	const imgname = document.querySelector('.ze .main .imageedit p');
	imgname.innerText = path;
	const imgcanvascontainer = document.querySelector('.ze .main .imageedit .canvascontainer');
	const imgcanvas = document.querySelector('.ze .main .imageedit .canvascontainer canvas');
	ctx = imgcanvas.getContext('2d');
	const imgtempcanvas = document.querySelector('.ze .main .imageedit .canvascontainer .tempcanvas');
	tempctx = imgtempcanvas.getContext('2d');
	const image = new Image()
	image.src = blob;
	document.querySelectorAll('.ze .main .imageedit .canvascontainer canvas').forEach((elem) => {
		elem.width = image.width;
		elem.height = image.height;
	})
	imgcanvascontainer.style.width = image.width + "px";
	imgcanvascontainer.style.height = image.height + "px";
	imgcanvascontainer.style.left = (window.innerWidth - 400) / 2 - image.width / 2 + "px";
	imgcanvascontainer.style.top = (window.innerHeight) / 2 - image.height / 2 + "px";
	const imgzoom = Math.min(4, imgwindowmaxsize / Math.max(image.width, image.height) / 1.5);
	imgcanvascontainer.setAttribute('zoom', imgzoom)
	imgcanvascontainer.style.transform = `scale(${imgzoom})`;
	ctx.drawImage(image, 0, 0);
}

function zoomCanvas() {
	const imgcanvascontainer = document.querySelector('.ze .main .imageedit .canvascontainer');
	const oldzoom = imgcanvascontainer.getAttribute('zoom')
	const zoomfactor = (event.deltaY < 0 ? 1.1 : 0.9090909);
	const newzoom = Math.min(15, Math.max(0.1, oldzoom * zoomfactor));
	imgcanvascontainer.style.transform = `scale(${newzoom})`;
	imgcanvascontainer.setAttribute('zoom', newzoom)
}

function moveCanvas() {
	if ((event.buttons === 1 && buttons_held.has(" ")) || event.buttons === 4) {
		const imgcanvascontainer = document.querySelector('.ze .main .imageedit .canvascontainer');
		imgcanvascontainer.style.left = adjustPxString(imgcanvascontainer.style.left, event.movementX)
		imgcanvascontainer.style.top = adjustPxString(imgcanvascontainer.style.top, event.movementY)
	}
}

function canvasActionUp() {
	if ((event.which === 1 || event.which === 3) && !buttons_held.has(" ")) {
		const imgcanvas = document.querySelector('.ze .main .imageedit canvas');
		switch (current_tool) {
			case "Pencil":
				const secondary = (event.which === 3)
				drawBuffer(false, secondary)
				break;
			case "Selection":
				const oldselectionbox = document.querySelector('.ze .main .imageedit .canvascontainer .selection');
				if (oldselectionbox && (oldselectionbox.style.width == "0px" || oldselectionbox.style.height == "0px")) {
					oldselectionbox.remove()
				}
				break;
		}
	} 
}
function canvasActionDown() {
	if ((event.which === 1 || event.which === 3) && !buttons_held.has(" ")) {
		const imgcanvas = document.querySelector('.ze .main .imageedit canvas');
		const imgcontainer = document.querySelector('.ze .main .imageedit .canvascontainer');
		const zoom = imgcontainer.getAttribute('zoom')
		const rect = imgcanvas.getBoundingClientRect()
		const x = (event.clientX - rect.left) / zoom;
		const y = (event.clientY - rect.top) / zoom;
		switch (current_tool) {
			case "Pencil":
				if (event.which === 1 || event.which === 3) {
					current_tool_buffer = [[x, y],[x+0.01,y+0.01]];
					const secondary = (event.which === 3)
					drawBuffer(true, secondary)
				}
				break;
			case "Eraser":
				if (event.which === 1 || event.which === 3) {
					const ctx = imgcanvas.getContext('2d');
					ctx.save();
					ctx.beginPath()
					ctx.arc(x, y, current_tool_size / 2, 0, Math.PI * 2);
					ctx.clip();
					ctx.globalAlpha = current_tool_alpha;
					ctx.clearRect(0, 0, imgcanvas.width, imgcanvas.height);
					ctx.globalAlpha = 1;
					ctx.restore();
				}
				break;
			case "Eyedropper":
				if (event.which === 1 || event.which === 3) {
					const pixelcvs = document.createElement('canvas');
					pixelcvs.width = 1;
					pixelcvs.height = 1;
					const pixelctx = pixelcvs.getContext('2d');
					pixelctx.drawImage(imgcanvas, Math.round(x), Math.round(y), 1, 1, 0, 0, 1, 1)
					const p = pixelctx.getImageData(0,0,1,1).data;
					changeToolColor(rgbToHex(p), (event.which === 3))
					changeToolAlpha(p[3] / 255)
				}
				break;
			case "Selection":
				const oldselectionbox = document.querySelector('.ze .main .imageedit .canvascontainer .selection');
				if (oldselectionbox) {
					oldselectionbox.remove()
				}
				if (event.which === 1 || event.which === 3) {
					const selectionbox = document.createElement('div')
					selectionbox.style.left = Math.round(x) + "px";
					selectionbox.style.top = Math.round(y) + "px";
					selectionbox.style.width = "0px";
					selectionbox.style.height = "0px"
					selectionbox.setAttribute('x', x)
					selectionbox.setAttribute('y', y)
					selectionbox.classList.add('selection')
					imgcontainer.appendChild(selectionbox);
				}
				break;
		}
	}
}

function canvasActionMove() {
	const imgcanvas = document.querySelector('.ze .main .imageedit canvas');
	const rect = imgcanvas.getBoundingClientRect()
	const imgcontainer = document.querySelector('.ze .main .imageedit .canvascontainer');
	const zoom = imgcontainer.getAttribute('zoom')
	const x = (event.clientX - rect.left) / zoom;
	const y = (event.clientY - rect.top) / zoom;
	const cursor = document.querySelector('.ze .main .imageedit .canvascontainer .cursor');
	cursor.style.left = x + "px";
	cursor.style.top = y + "px";
	cursor.style.width = current_tool_size + "px";
	cursor.style.height = current_tool_size + "px";
	if ((event.buttons === 1 || event.buttons === 2) && !buttons_held.has(" ")) {
		switch (current_tool) {
			case "Pencil":
				if (event.buttons === 1 || event.buttons === 2) {
					current_tool_buffer.push([x, y]);
					const secondary = (event.buttons === 2)
					drawBuffer(true, secondary)
				}
				break;
			case "Eraser":
				if (event.buttons === 1 || event.buttons === 2) {
					const ctx = imgcanvas.getContext('2d');
					ctx.save()
					ctx.beginPath()
					ctx.arc(x, y, current_tool_size / 2, 0, Math.PI * 2);
					ctx.clip()
					ctx.clearRect(0, 0, imgcanvas.width, imgcanvas.height);
					ctx.restore()
				}
				break;
			case "Eyedropper":
				if (event.buttons === 1 || event.buttons === 2) {
					const pixelcvs = document.createElement('canvas');
					pixelcvs.width = 1;
					pixelcvs.height = 1;
					const pixelctx = pixelcvs.getContext('2d');
					pixelctx.drawImage(imgcanvas, Math.round(x), Math.round(y), 1, 1, 0, 0, 1, 1)
					const p = pixelctx.getImageData(0,0,1,1).data;
					changeToolColor(rgbToHex(p), (event.buttons === 2))
					changeToolAlpha(p[3] / 255)
				}
				break;
			case "Selection":
				if (event.which === 1 || event.which === 3) {
					const selectionbox = document.querySelector('.ze .main .imageedit .canvascontainer .selection')
					if (selectionbox) {
						const sx = selectionbox.getAttribute('x')
						const sy = selectionbox.getAttribute('y')
						selectionbox.style.left = Math.round(Math.min(x, sx)) + "px";
						selectionbox.style.top = Math.round(Math.min(y, sy)) + "px";
						selectionbox.style.width = Math.round(Math.abs(x - sx)) + "px";
						selectionbox.style.height = Math.round(Math.abs(y - sy)) + "px";
					}
				}
				break;
		}
	}
}
function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(rgb) {
  return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

function selectTool(tool) {
	current_tool = tool;
	document.querySelector('.ze .main .imageedit .currenttooltext').innerText = tool;
	document.querySelector('.ze .main .imageedit .selectedtool').classList.remove('selectedtool')
	document.querySelector('.ze .main .imageedit .' + tool.toLowerCase()).classList.add('selectedtool');
}
function changeToolColor(value, secondary) {
	if (!secondary) {
		current_tool_color = value;
		document.querySelector('.ze .main .imageedit .colorinput').value = value;
	} else {
		current_tool_secondary_color = value;
		document.querySelector('.ze .main .imageedit .secondarycolorinput').value = value;
	}
}
function changeToolSize(value) {
	document.querySelector('.ze .main .imageedit .window .brushsize circle').setAttribute('r', value);
	current_tool_size = value;
}
function changeToolAlpha(value, selfinflicted) {
	if (!selfinflicted) {
		document.querySelector('.ze .main .imageedit .window .alphainput').value = value;
	}
	document.querySelector('.ze .main .imageedit .window .brushalpha #toolalpha').setAttribute('fill-opacity', value);
	current_tool_alpha = value;
}

function drawBuffer(temp, colorSlot) {
	const context = (temp ? tempctx : ctx)
	tempctx.clearRect(0, 0, 10000, 10000)
	context.strokeStyle = (colorSlot ? current_tool_secondary_color : current_tool_color)
	context.globalAlpha = current_tool_alpha;
	context.beginPath();
	context.lineCap = "round";
	context.lineJoin = "round";
	context.moveTo(current_tool_buffer[0][0],current_tool_buffer[0][1])
	for (var i = 1; i < current_tool_buffer.length; i ++) {
		context.lineTo(current_tool_buffer[i][0],current_tool_buffer[i][1])
	}
	context.lineWidth = current_tool_size;
	context.stroke()
	if (!temp) {
		current_tool_buffer = []
	}
	context.globalAlpha = 1;
}

function textUnsavedChanges() {
	unsaved_changes_warning = true;
	const save_button = document.querySelector('.ze .main .savechangesbutton');
	save_button.style.display = 'block';
	const unsaved_warning = document.querySelector('.ze .main .textedit .unsavedchanges');
	unsaved_warning.style.display = 'inline';
}
function textSaveChanges() {
	unsaved_changes_warning = false;
	const textarea = document.querySelector('.ze .main .textedit textarea');
	loaded_text_files[textarea.getAttribute('path')] = textarea.value;
	const save_button = document.querySelector('.ze .main .savechangesbutton');
	save_button.style.display = 'none';
	const unsaved_warning = document.querySelector('.ze .main .textedit .unsavedchanges');
	unsaved_warning.style.display = 'none';
}
function textDiscardChanges() {
	unsaved_changes_warning = false;
	const save_button = document.querySelector('.ze .main .savechangesbutton');
	save_button.style.display = 'none';
	const unsaved_warning = document.querySelector('.ze .main .textedit .unsavedchanges');
	unsaved_warning.style.display = 'none';
}

function initializeTextarea(text,path) {
	textDiscardChanges()
	const textwindow = document.querySelector('.ze .main .textedit')
	textwindow.style.display = 'block';
	textwindow.setAttribute('path', path);
	const textname = document.querySelector('.ze .main .textedit p')
	textname.innerText = path;
	const textarea = document.querySelector('.ze .main .textedit textarea');
	textarea.value = text;
	textarea.setAttribute('path', path);
}

function closeAllTools() {
	const textwindow = document.querySelector('.ze .main .textedit')
	textwindow.style.display = 'none';
	const imgwindow = document.querySelector('.ze .main .imageedit')
	imgwindow.style.display = 'none';
}

function blobToImage(blob) {
	const url = URL.createObjectURL(blob);
	const image = new Image();
	image.src = url;
	return image;
}

function toggleFolder(elem) {
	const rect = elem.getBoundingClientRect()
	if (event.clientY - rect.top <= 30) {
		if (elem.style.height == "30px") {
			elem.style.height = "auto";
		} else {
			elem.style.height = "30px";
		}
	}
}