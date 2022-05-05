let ctx;
let tempctx;
let loaded_text_files;
let loaded_images;
let loaded_zip_name;
let current_tool = "Pencil";
let current_tool_size = 1;
let current_tool_color = "#000000";
let current_tool_alpha = 1;
let current_tool_secondary_color = "#FFFFFF"
let current_tool_buffer = [];
let current_selection;
let current_view_type;
let buttons_held = new Set();
let unsaved_changes_warning = false;
let undo_history;
let generated_zip;
let generated_zip_remaining_images;
let awaiting_paste;
let checked_pixels;
let original_pixel_values;
let imgcanvascontainer;
let imgcanvas;
let imgctx;
let fill_tolerance = 100;
let fill_glow = 0.25;
let fill_boundaries = {x: 0, y: 0, w: 0, h: 0};
let effect_parameters;
const pixelcvs = document.createElement('canvas');
pixelcvs.width = 1;
pixelcvs.height = 1;
const pixelctx = pixelcvs.getContext('2d');
 
function zipEditorInit() {
	try {
		if (navigator.userAgentData.mobile) {
			alert("The online .zip editor is not usable on mobile devices");
			return;
		}
	} catch (err) {}
	document.body.innerHTML += 
	`
	<div class="ze" style="top:100vh" onmouseup="releaseWindows();" onmousemove="moveWindows();">
		<div class="loading" style="display:none;">
			<h1>Please wait...</h1>
			<h2>This may take a few seconds.</h2>
		</div>
		<div class="effects" style="display:none;">
			<div class="window">
				<div class="closebutton" onclick="closeEffect()">
					<svg height="50" width="50">
						<line x1="10" y1="10" x2="40" y2="40" style="stroke:#FFF; stroke-width:5; stroke-linecap:round" />
						<line x1="10" y1="40" x2="40" y2="10" style="stroke:#FFF; stroke-width:5; stroke-linecap:round" />
					</svg>
				</div>
				<h1 class="title"></h1>
				<div class="inputs">
				</div>
				<canvas class="preview" width="1" height="1"></canvas>
				<canvas class="previewafter" width="1" height="1"></canvas>
				<hr>
				<button class="apply" onclick="applyEffectAndClose()">Apply</button>
			</div>
		</div>
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
		<div class="main">
			<div class="info">
				<p class="filepathname"></p>
				<p class="unsavedchanges"> (Unsaved Changes, press Ctrl+S to save)</p>
			</div>
			<div class="textedit" style="display:none;">
				<textarea spellcheck="false" oninput="unsavedChanges()"></textarea>
			</div>
			<div class="imageedit" onmousemove="moveCanvas()" style="display:none;" onwheel="zoomCanvas();event.preventDefault();" onscroll="zoomCanvas();event.preventDefault()">
				<div class="window" style="left:410px;top:80px;" onmousedown="startWindowDrag(this);">
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
						<div class="fillcontents" style="display:none;">
							<p class="label">Fill Tolerance:</p>
							<input type="range" min="10" max="300" step="1" value="100" oninput="fill_tolerance = this.value;" >
							<p class="label">Fill Glow:</p>
							<input type="range" min="0" max="1" step="0.01" value="0.25" oninput="fill_glow = this.value;" >
						</div>
					</div>
				</div>
				<div class="window" style="left:410px;top:350px" onmousedown="startWindowDrag(this);">
					<p>Toolbox</p>
					<div class="contents" style="text-align:center;">
						<button class="squarebutton pencil selectedtool" onclick="selectTool('Pencil')"></button>
						<button class="squarebutton eraser" onclick="selectTool('Eraser')"></button>
						<button class="squarebutton eyedropper" onclick="selectTool('Eyedropper')"></button>
						<button class="squarebutton selection" onclick="selectTool('Selection')"></button>
						<button class="squarebutton fill" onclick="selectTool('Fill')"></button>
					</div>
					<p>Extras</p>
					<div class="contents" style="">
						<button class="effectsbutton" onclick="openEffect(0)">Hue & Saturation</button>
					</div>
				</div>
				<div class="canvascontainer" onmousemove="canvasActionMove()" onmousedown="canvasActionDown()" onmouseup="canvasActionUp()" oncontextmenu="event.preventDefault()">
					<canvas id="layer0"></canvas>
					<canvas class="tempcanvas"></canvas>
					<div class="cursor"></div>
				</div>
			</div>
			<button class="savechangesbutton" onclick="saveChanges()" style="display:none">Save Changes</button>
		</div>
		<div class="sidebar"></div>
		<svg width="40" height="40" class="sidebarbutton" onclick="toggleSidebar()">
			<polygon points="30,0 10,20 30,40" style="fill:white"/>
		</svg>
		<input id="zipinput" type="file" style="display:none" accept=".zip" onchange="zipEditorImportZip()">
	</div>
	`
	document.body.onkeydown = keyDown;
	document.body.onkeyup = keyUp;
	imgcanvas = document.querySelector('.ze .main .imageedit canvas');
	imgctx = imgcanvas.getContext('2d');
	imgcanvascontainer = document.querySelector('.ze .main .imageedit .canvascontainer');
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
		case "5":
			selectTool('Fill');
			break;
		case "a":
			if (event.ctrlKey) {
				selectEntireCanvas()
			}
			break;
		case "c":
			if (event.ctrlKey) {
				copySelectionToClipboard();
			}
			break;
		case "v":
			if (event.ctrlKey) {
				pasteClipboardToCanvas();
			}
			break;
		case "s":
			if (event.ctrlKey) {
				event.preventDefault();
				if (unsaved_changes_warning) {
					saveChanges();
				}
			}
			break;
		case "Delete":
		case "Backspace":
			wipeCanvas();
			break;
		case "z":
			if (event.ctrlKey) {
				event.preventDefault();
				goBackToLastSnapshot();
			}
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

function toggleSidebar() {
	const sidebar = document.querySelector('.ze .sidebar')
	const sidebarbutton = document.querySelector('.ze .sidebarbutton')
	if (sidebar.style.transform === "translateX(-350px)") {
		sidebar.style.transform = ""
		sidebarbutton.style.transform = "";
	} else {
		sidebar.style.transform = "translateX(-350px)"
		sidebarbutton.style.transform = "rotateZ(180deg)";
	}
}

function zipEditorImport() {
	document.querySelector('.ze #zipinput').click();
}
function zipEditorExport() {
	document.querySelector('.ze .loading').style.display = 'block'
	generated_zip = new JSZip();
	generated_zip_remaining_images = Object.keys(loaded_images).length;
	for (let [key, value] of Object.entries(loaded_text_files)) {
    	generated_zip.file(key, value)
	}
	for (let [key, value] of Object.entries(loaded_images)) {
    	const file = fetch(value)
    	.then(r => r.blob())
    	.then(blobFile => new File([blobFile], key.split("/")[key.split("/").length-1], { type: "image/png" }))
    	.then((blobFile) => {
    		generated_zip.file(key, blobFile)
    		zipEditorAddLoading();
    	})
	}
}
function zipEditorAddLoading() {
	generated_zip_remaining_images --;
	if (generated_zip_remaining_images == 0) {
		generated_zip.generateAsync({type:"blob"})
		.then((content) => {
			saveAs(content, loaded_zip_name);
			document.querySelector('.ze .loading').style.display = 'none'
		});
	}
}

function zipEditorClose() {
	document.querySelector('.ze').style.top = "100vh"
	setTimeout(function() {
		document.querySelector('.ze').remove();
	}, 500)
}

function zipEditorImportZip() {
	current_view_type = undefined;
	closeAllTools()
	const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;
	for (let i = 0, f; f = files[i]; i++) {
		const loadedZip = new JSZip();
		loaded_zip_name = f.name;
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
					if (itemExtension == 'png') {
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
							`<img path="${imagePathString}" id="${imagePathString.replaceAll('.','').replaceAll('/','')}" onclick="if (checkIfSaved()) {closeAllTools();let path=this.getAttribute('path');initializeImageEditor(loaded_images[path],path)}" name="${imageName}" src="${src}">`
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
	discardChanges();
	current_view_type = "Image";
	deleteSelection();
	const imgwindow = document.querySelector('.ze .main .imageedit');
	imgwindow.style.display = 'block';
	imgwindow.setAttribute('path', path);
	imgwindowrect = imgwindow.getBoundingClientRect()
	imgwindowmaxsize = Math.min(imgwindowrect.width, imgwindowrect.height)
	const imgname = document.querySelector('.ze .main .filepathname');
	imgname.innerText = path;
	ctx = imgcanvas.getContext('2d');
	const imgtempcanvas = document.querySelector('.ze .main .imageedit .canvascontainer .tempcanvas');
	tempctx = imgtempcanvas.getContext('2d');
	const image = new Image()
	image.onload = function() {
		document.querySelectorAll('.ze .main .imageedit .canvascontainer canvas').forEach((elem) => {
			elem.width = image.width;
			elem.height = image.height;
		})
		imgcanvascontainer.style.width = image.width + "px";
		imgcanvascontainer.style.height = image.height + "px";
		imgcanvascontainer.style.left =  (window.innerWidth + 400) / 2 - image.width / 2 + "px";
		imgcanvascontainer.style.top = (window.innerHeight) / 2 - image.height / 2 + "px";
		const imgzoom = Math.min(4, imgwindowmaxsize / Math.max(image.width, image.height) / 1.5);
		imgcanvascontainer.setAttribute('zoom', imgzoom)
		imgcanvascontainer.style.transform = `scale(${imgzoom})`;
		ctx.drawImage(image, 0, 0);
		undo_history = [imgcanvas.toDataURL(0, 0, imgcanvas.width, imgcanvas.height)];
	}
	image.src = blob;
}

function zoomCanvas() {
	const oldzoom = imgcanvascontainer.getAttribute('zoom')
	const zoomfactor = (event.deltaY < 0 ? 1.1 : 0.9090909);
	const newzoom = Math.min(15, Math.max(0.1, oldzoom * zoomfactor));
	imgcanvascontainer.style.transform = `scale(${newzoom})`;
	imgcanvascontainer.setAttribute('zoom', newzoom)
}

function moveCanvas() {
	if ((event.buttons === 1 && buttons_held.has(" ")) || event.buttons === 4) {
		imgcanvascontainer.style.left = adjustPxString(imgcanvascontainer.style.left, event.movementX)
		imgcanvascontainer.style.top = adjustPxString(imgcanvascontainer.style.top, event.movementY)
	}
}

function selectEntireCanvas() {
	deleteSelection()
	const selectionbox = document.createElement('div')
	selectionbox.style.left = "0px";
	selectionbox.style.top = "0px";
	selectionbox.style.width = imgcanvas.width + "px";
	selectionbox.style.height = imgcanvas.height + "px"
	selectionbox.setAttribute('x', 0)
	selectionbox.setAttribute('y', 0)
	selectionbox.classList.add('selection')
	current_selection = {type: "rect", x: 0, y: 0, w: imgcanvas.width, h: imgcanvas.height}
	imgcanvascontainer.appendChild(selectionbox);
}
function deleteSelection() {
	const selectionbox = document.querySelector('.ze .main .imageedit .canvascontainer .selection');
	if (selectionbox) {
		selectionbox.remove()
		current_selection = undefined;
	}
}
function copySelectionToClipboard() {
	if (current_selection) {
		const tempcvs = document.createElement('canvas');
		const tempctx = tempcvs.getContext('2d');
		const s = current_selection;
		tempcvs.width = s.w;
		tempcvs.height = s.h;
		tempctx.drawImage(imgcanvas, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
		const dataURL = tempcvs.toDataURL(0, 0, s.w, s.h);
		navigator.clipboard.writeText(dataURL);
	}
}
function pasteClipboardToCanvas() {
	if (awaiting_paste) return;
	const cursor = document.querySelector('.ze .main .imageedit .canvascontainer .cursor');
	const cx = Math.round(cursor.style.left.replace('px',''))
	const cy = Math.round(cursor.style.top.replace('px',''))
	try {
		navigator.clipboard.readText().then(clipText => drawDataOnCanvas(clipText, cx, cy))
	} catch (err) {
		const input = document.createElement('input');
		awaiting_paste = true;
		input.style.position = "fixed";
		input.style.left = "0";
		input.style.top = "0";
		input.style.opacity = 0;
		input.oninput = function() {
			drawDataOnCanvas(this.value, cx, cy)
			awaiting_paste = false;
			this.remove()
		}
		document.querySelector('.ze').appendChild(input);
		input.select();
		setTimeout(function() {
			input.remove();
			awaiting_paste = false;
		}, 1000)
	}
}
function drawDataOnCanvas(data, x, y) {
	const tempimg = document.createElement('img');
	tempimg.src = data;
	imgctx.clearRect(x, y, tempimg.width, tempimg.height)
	imgctx.drawImage(tempimg, x, y)
	takeImageSnapshot();
}

function canvasActionUp() {
	if ((event.which === 1 || event.which === 3) && !buttons_held.has(" ")) {
		switch (current_tool) {
			case "Pencil":
				const secondary = (event.which === 3)
				drawBuffer(false, secondary)
				takeImageSnapshot();
				break;
			case "Eraser":
				takeImageSnapshot();
				break;
			case "Selection":
				const oldselectionbox = document.querySelector('.ze .main .imageedit .canvascontainer .selection');
				if (oldselectionbox && (oldselectionbox.style.width == "0px" || oldselectionbox.style.height == "0px")) {
					deleteSelection()
				}
				break;
		}
	} 
}
function canvasActionDown() {
	if ((event.which === 1 || event.which === 3) && !buttons_held.has(" ")) {
		const zoom = imgcanvascontainer.getAttribute('zoom')
		const rect = imgcanvascontainer.getBoundingClientRect()
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
					pixelctx.drawImage(imgcanvas, Math.round(x), Math.round(y), 1, 1, 0, 0, 1, 1)
					const p = pixelctx.getImageData(0,0,1,1).data;
					changeToolColor(rgbToHex(p), (event.which === 3))
					changeToolAlpha(p[3] / 255)
				}
				break;
			case "Selection":
				const oldselectionbox = document.querySelector('.ze .main .imageedit .canvascontainer .selection');
				if (current_selection) {
					deleteSelection()
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
					current_selection = {type: "rect", x: Math.round(x), y: Math.round(y), w: 0, h: 0}
					imgcanvascontainer.appendChild(selectionbox);
				}
				break;
			case "Fill":
				imgctx.fillStyle = (event.which === 1 ? current_tool_color : current_tool_secondary_color);
				startAtPixel(Math.round(x), Math.round(y));
				let last_pixel_amt = checked_pixels.size;
				var waiting_for_snapshot = setInterval(function() {
					if (checked_pixels.size == last_pixel_amt) {
						takeImageSnapshot();
						clearInterval(waiting_for_snapshot)
					}
					last_pixel_amt = checked_pixels.size;
				}, 10)
				break;
		}
	}
}

function startAtPixel(x, y) {
	checked_pixels = new Set();
	checked_pixels.add(x+','+y)
	if (current_selection) {
		fill_boundaries.x = current_selection.x;
		fill_boundaries.y = current_selection.y;
		fill_boundaries.w = current_selection.x + current_selection.w;
		fill_boundaries.h = current_selection.y + current_selection.h;
	} else {
		fill_boundaries.x = 0;
		fill_boundaries.y = 0;
		fill_boundaries.w = imgcanvas.width;
		fill_boundaries.h = imgcanvas.height;
	}
	pixelctx.drawImage(imgcanvas, Math.round(x), Math.round(y), 1, 1, 0, 0, 1, 1)
	original_pixel_values = pixelctx.getImageData(0,0,1,1).data;
	imgctx.globalAlpha = current_tool_alpha;
	imgctx.fillRect(x, y, 1, 1)
	imgctx.globalAlpha = 1;
	checkNeighbouring(x, y)
}
function checkNeighbouring(x, y) {
	const neighbours = [[-1, 0],[1, 0],[0, 1],[0, -1]];
	const f = fill_boundaries;
	for (var n = 0; n < 4; n ++) {
		const nx = x + neighbours[n][0];
		const ny = y + neighbours[n][1];
		if (!checked_pixels.has(nx+','+ny) && nx >= f.x && ny >= f.y && nx < f.w && ny < f.h) {
			checked_pixels.add(nx+','+ny)
			pixelctx.drawImage(imgcanvas, Math.round(nx), Math.round(ny), 1, 1, 0, 0, 1, 1)
			const this_pixel_values = pixelctx.getImageData(0,0,1,1).data;
			let diff = 0;
			for (var i = 0; i < 4; i ++) {
				diff += Math.abs(this_pixel_values[i] - original_pixel_values[i])
			}
			if (diff < fill_tolerance) {
				imgctx.globalAlpha = current_tool_alpha;
				imgctx.fillRect(nx, ny, 1, 1)
				setTimeout(function() {
					checkNeighbouring(nx, ny)
				}, 1)
				imgctx.globalAlpha = 1;
			} else {
				imgctx.globalAlpha = fill_glow * current_tool_alpha;
				imgctx.fillRect(nx, ny, 1, 1)
				imgctx.globalAlpha = 1;
			}
		}
	}
}

function canvasActionMove() {
	const rect = imgcanvas.getBoundingClientRect()
	const zoom = imgcanvascontainer.getAttribute('zoom')
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
					pixelctx.drawImage(imgcanvas, Math.round(x), Math.round(y), 1, 1, 0, 0, 1, 1)
					const p = pixelctx.getImageData(0,0,1,1).data;
					changeToolColor(rgbToHex(p), (event.buttons === 2))
					changeToolAlpha(p[3] / 255)
				}
				break;
			case "Selection":
				if (event.which === 1 || event.which === 3) {
					const selectionbox = document.querySelector('.ze .main .imageedit .canvascontainer .selection')
					if (current_selection) {
						const sx = selectionbox.getAttribute('x')
						const sy = selectionbox.getAttribute('y')
						const nx = Math.round(Math.min(x, sx));
						const ny = Math.round(Math.min(y, sy));
						const nw = Math.round(Math.abs(Math.round(x) - sx));
						const nh = Math.round(Math.abs(Math.round(y) - sy));
						selectionbox.style.left = nx + "px";
						selectionbox.style.top = ny + "px";
						selectionbox.style.width = nw + "px";
						selectionbox.style.height = nh + "px";
						current_selection = {type: "rect", x: nx, y: ny, w: nw, h: nh}
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
	document.querySelector('.ze .main .imageedit .canvascontainer .cursor').style.display = (["Pencil","Eraser"].includes(tool) ? 'block' : 'none')
	document.querySelector('.ze .main .imageedit .currenttooltext').innerText = tool;
	document.querySelector('.ze .main .imageedit .selectedtool').classList.remove('selectedtool')
	document.querySelector('.ze .main .imageedit .' + tool.toLowerCase()).classList.add('selectedtool');
	if (tool === "Fill") {
		document.querySelector('.ze .main .imageedit .fillcontents').style.display = 'block';
	} else {
		document.querySelector('.ze .main .imageedit .fillcontents').style.display = 'none';
	}
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
	if (current_selection) {
		context.save();
		context.beginPath()
		context.rect(current_selection.x, current_selection.y, current_selection.w, current_selection.h);
		context.clip();
	}
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
	if (current_selection) {
		context.restore();
	}
}
function wipeCanvas() {
	if (current_selection) {
		const s = current_selection;
		imgctx.clearRect(s.x, s.y, s.w, s.h);
		takeImageSnapshot();
		deleteSelection();
	}
}

function takeImageSnapshot() {
	const imgcanvas = document.querySelector('.ze .main .imageedit .canvascontainer canvas');
	undo_history.push(imgcanvas.toDataURL(0, 0, imgcanvas.width, imgcanvas.height));
	unsavedChanges();
}
function goBackToLastSnapshot() {
	if (undo_history.length <= 1) return;
	const data = undo_history[undo_history.length - 2]
	const img = new Image();
	img.onload = function() {
		imgctx.clearRect(0, 0, imgcanvas.width, imgcanvas.height);
		imgctx.drawImage(img, 0, 0)
	}
	img.src = data;
	undo_history.pop();
}

function unsavedChanges() {
	unsaved_changes_warning = true;
	const save_button = document.querySelector('.ze .main .savechangesbutton');
	save_button.style.display = 'block';
	const unsaved_warning = document.querySelector('.ze .main .unsavedchanges');
	unsaved_warning.style.display = 'inline';
}
function saveChanges() {
	unsaved_changes_warning = false;
	if (current_view_type == "Text") {
		const textarea = document.querySelector('.ze .main .textedit textarea');
		loaded_text_files[textarea.getAttribute('path')] = textarea.value;
	} else if (current_view_type == "Image") {
		const imgwindow = document.querySelector('.ze .main .imageedit');;
		const path = imgwindow.getAttribute('path')
		const imgcanvas = document.querySelector('.ze .main .imageedit .canvascontainer canvas');
		imgcanvas.toBlob(function(blob) {
			const objurl = URL.createObjectURL(blob);
			loaded_images[path] = objurl;
			document.getElementById(path.replaceAll('/','').replaceAll('.','')).src = objurl;
		})
	}
	const save_button = document.querySelector('.ze .main .savechangesbutton');
	save_button.style.display = 'none';
	const unsaved_warning = document.querySelector('.ze .main .unsavedchanges');
	unsaved_warning.style.display = 'none';
}
function discardChanges() {
	unsaved_changes_warning = false;
	const save_button = document.querySelector('.ze .main .savechangesbutton');
	save_button.style.display = 'none';
	const unsaved_warning = document.querySelector('.ze .main .unsavedchanges');
	unsaved_warning.style.display = 'none';
}

function initializeTextarea(text,path) {
	discardChanges()
	current_view_type = "Text";
	const textwindow = document.querySelector('.ze .main .textedit')
	textwindow.style.display = 'block';
	textwindow.setAttribute('path', path);
	const textname = document.querySelector('.ze .main .filepathname')
	textname.innerText = path;
	const textarea = document.querySelector('.ze .main .textedit textarea');
	textarea.value = text;
	textarea.setAttribute('path', path);
}

function closeAllTools() {
	const filepathname = document.querySelector('.ze .main .filepathname')
	filepathname.innerText = "";
	discardChanges()
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

function openEffect(type) {
	const effects = document.querySelector('.ze .effects')
	effects.style.display = 'block';
	const title = document.querySelector('.ze .effects .window .title')
	const preview = document.querySelector('.ze .effects .window .preview')
	const previewafter = document.querySelector('.ze .effects .window .previewafter')
	preview.width = imgcanvas.width;
	previewafter.width = imgcanvas.width;
	preview.height = imgcanvas.height;
	previewafter.height = imgcanvas.height;
	const previewctx = preview.getContext('2d');
	previewctx.drawImage(imgcanvas, 0, 0)
	const previewafterctx = previewafter.getContext('2d');
	previewafterctx.drawImage(imgcanvas, 0, 0)
	const inputs = document.querySelector('.ze .effects .window .inputs')
	switch (type) {
		case 0:
			title.innerText = "Hue & Saturation";
			effect_parameters = [0,50,0];
			inputs.innerHTML = `
			<p>Hue (<span>0</span>)</p>
			<input type="range" min="-180" max="180" value="0" style="width:100%;" oninput="updateEffectValue(0, 0, this.value, false);" onchange="updateEffectValue(0, 0, this.value, true);">
			<p>Saturation (<span>50</span>)</p>
			<input type="range" min="0" max="99" value="50" style="width:100%;" oninput="updateEffectValue(1, 0, this.value, false);" onchange="updateEffectValue(1, 0, this.value, true);">
			<p>Lightness (<span>0</span>)</p>
			<input type="range" min="-1" max="1" value="0" step="0.01" style="width:100%;" oninput="updateEffectValue(2, 0, this.value, false);" onchange="updateEffectValue(2, 0, this.value, true);">`
			break;
	}
}
function closeEffect() {
	const effects = document.querySelector('.ze .effects')
	effects.style.display = 'none';
}

function updateEffectValue(index, effect, value, updatePreview) {
	document.querySelectorAll('.ze .effects .window .inputs span')[index].innerText = value;
	effect_parameters[index] = parseFloat(value);

	if (updatePreview) {
		const preview = document.querySelector('.ze .effects .window .preview')
		const previewctx = preview.getContext('2d');
		const data = previewctx.getImageData(0, 0, preview.width, preview.height).data;
		const previewafter = document.querySelector('.ze .effects .window .previewafter')
		const previewafterctx = previewafter.getContext('2d');
		previewafterctx.clearRect(0, 0, preview.width, preview.height);

		for (let d = 0; d < data.length; d += 4) {
			const hsl = rgbToHsl(data[d], data[d + 1], data[d + 2])
			hsl[0] = (hsl[0] * 360 + effect_parameters[0]) % 360
			hsl[1] = hsl[1] + effect_parameters[1]
			hsl[2] = Math.max(0, Math.min(1, hsl[2] + effect_parameters[2]));
			previewafterctx.globalAlpha = data[d + 3];
			previewafterctx.fillStyle = hslToHex(hsl);
			previewafterctx.fillRect((d / 4) % preview.width, Math.floor(d / 4 / preview.width), 1, 1)
			previewafterctx.globalAlpha = 1;
		}
	}
}

function applyEffectAndClose() {
	const previewafter = document.querySelector('.ze .effects .window .previewafter')
	const previewafterctx = previewafter.getContext('2d');
	imgctx.clearRect(0, 0, imgcanvas.width, imgcanvas.height);
	imgctx.drawImage(previewafter, 0, 0);
	closeEffect();
	unsavedChanges();
	takeImageSnapshot();
}

function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0;
    }else{
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}
function hslToHex(hsl) {
	const a = hsl[1] * Math.min(hsl[2], 1 - hsl[2]) / 100;
	const f = n => {
		const k = (n + hsl[0] / 30) % 12;
		const color = hsl[2] - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}