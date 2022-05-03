let zipEditorWindow;
function zipEditorInit() {
	document.body.innerHTML += 
	`
	<div class="ze" style="top:100vh">
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
				<button class="savechangesbutton" onclick="textSaveChanges()" style="display:none">Save Changes</button>
			</div>
			<div class="imageedit" onwheel="zoomCanvas()" onmousemove="moveCanvas()" style="display:none;">
				<p></p>
				<div class="canvascontainer" onmousemove="canvasActionMove()" onmousedown="canvasActionDown()" onmouseup="canvasActionUp()">
					<canvas></canvas>
					<canvas class="tempcanvas"></canvas>
				</div>
			</div>
		</div>
		<input type="file" style="display:none" accept=".zip" onchange="zipEditorImportZip()">
	</div>
	`
	document.body.onkeydown = () => buttons_held.add(event.key);
	document.body.onkeyup = () => buttons_held.delete(event.key);
	zipEditorWindow = document.querySelector('.ze');
	setTimeout(function() {
		zipEditorWindow.style.top = 0;
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

function zipEditorImport() {
	document.querySelector('.ze input').click();
}

function zipEditorClose() {
	zipEditorWindow.style.top = "100vh"
	setTimeout(function() {
		zipEditorWindow.remove();
	}, 500)
}

let loaded_text_files;
let loaded_images;
let sortedFilePaths;
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

const buttons_held = new Set();

function checkIfSaved() {
	return !(unsaved_changes_warning && !confirm("You have unsaved, proceed anyway?"))
}

let ctx;
let tempctx;
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
	imgcanvas.width = image.width;
	imgcanvas.height = image.height;
	imgtempcanvas.width = image.width;
	imgtempcanvas.height = image.height;
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
	const newzoom = Math.min(10, Math.max(0.1, oldzoom * zoomfactor));
	imgcanvascontainer.style.transform = `scale(${newzoom})`;
	imgcanvascontainer.setAttribute('zoom', newzoom)
}

function moveCanvas() {
	if ((event.buttons === 1 && buttons_held.has(" ")) || event.buttons === 4) {
		const imgcanvascontainer = document.querySelector('.ze .main .imageedit .canvascontainer');
		imgcanvascontainer.style.left = parseInt(imgcanvascontainer.style.left.replace('px','')) + event.movementX + "px";
		imgcanvascontainer.style.top = parseInt(imgcanvascontainer.style.top.replace('px','')) + event.movementY + "px";
	}
}
let current_tool = "pencil";
let current_tool_size = 0.5;
let current_tool_color = "#000"
let current_tool_buffer = [];

function canvasActionUp() {
	if (event.which === 1) {
		const imgcanvas = document.querySelector('.ze .main .imageedit canvas');
		const zoom = imgcanvas.getAttribute('zoom')
		switch (current_tool) {
			case "pencil":
				drawBuffer(false)
				break;
		}
	} 
}
function canvasActionDown() {
	if (event.buttons === 1) {
		const imgcanvas = document.querySelector('.ze .main .imageedit canvas');
		const zoom = imgcanvas.getAttribute('zoom')
		switch (current_tool) {
			case "pencil":
				if (event.buttons === 1) {
					current_tool_buffer = [[event.layerX, event.layerY]];
				}
				break;
		}
	}
}
function canvasActionMove() {
	if (event.buttons === 1) {
		const imgcanvas = document.querySelector('.ze .main .imageedit canvas');
		const zoom = imgcanvas.getAttribute('zoom')
		const tempcanvas = document.querySelector('.ze .main .imageedit .tempcanvas');

		switch (current_tool) {
			case "pencil":
				if (event.buttons === 1) {
					console.log(current_tool_buffer)
					current_tool_buffer.push([event.layerX, event.layerY]);
				}
				drawBuffer(true)
				break;
		}
	}
}
function drawBuffer(temp) {
	const context = (temp ? tempctx : ctx)
	tempctx.clearRect(0, 0, 10000, 10000)
	context.strokeStyle = current_tool_color;
	context.beginPath();
	context.lineCap = "round";
	context.moveTo(current_tool_buffer[0][0]+0.5,current_tool_buffer[0][1]+0.5)
	for (var i = 1; i < current_tool_buffer.length; i ++) {
		context.lineTo(current_tool_buffer[i][0]+0.5,current_tool_buffer[i][1]+0.5)
	}
	context.lineWidth = current_tool_size;
	context.stroke()
	context.stroke()
}

var unsaved_changes_warning = false;
function textUnsavedChanges() {
	unsaved_changes_warning = true;
	const save_button = document.querySelector('.ze .main .textedit .savechangesbutton');
	save_button.style.display = 'block';
	const unsaved_warning = document.querySelector('.ze .main .textedit .unsavedchanges');
	unsaved_warning.style.display = 'inline';
}
function textSaveChanges() {
	unsaved_changes_warning = false;
	const textarea = document.querySelector('.ze .main .textedit textarea');
	loaded_text_files[textarea.getAttribute('path')] = textarea.value;
	const save_button = document.querySelector('.ze .main .textedit .savechangesbutton');
	save_button.style.display = 'none';
	const unsaved_warning = document.querySelector('.ze .main .textedit .unsavedchanges');
	unsaved_warning.style.display = 'none';
}
function textDiscardChanges() {
	unsaved_changes_warning = false;
	const save_button = document.querySelector('.ze .main .textedit .savechangesbutton');
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