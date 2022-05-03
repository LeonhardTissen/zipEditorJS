let zipEditorWindow;
function zipEditorInit() {
	document.body.innerHTML += 
	`
	<div class="ze" style="top:100vh">
		<div class="topbar">
			<button class="button" onclick="zipEditorImport()">Import</button>
			<button class="button" onclick="zipEditorExport()">Export</button>
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
				<textarea spellcheck="false" oninput="loaded_text_files[this.getAttribute('path')] = this.value;"></textarea>
			</div>
			<div class="imageedit" onwheel="zoomCanvas()" style="display:none;">
				<p></p>
				<canvas></canvas>
			</div>
		</div>
		<input type="file" style="display:none" accept=".zip" onchange="zipEditorImportZip()">
	</div>
	`
	zipEditorWindow = document.querySelector('.ze');
	setTimeout(function() {
		zipEditorWindow.style.top = 0;
	}, 1)
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
							`<img path="${imagePathString}" onclick="closeAllTools();let path=this.getAttribute('path');initializeImageEditor(loaded_images[path],path)" name="${imageName}" src="${src}">`
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
								`<p path="${filePathString}" onclick="closeAllTools();let path=this.getAttribute('path');initializeTextarea(loaded_text_files[path],path)" class="zipEditorFileName">${fileName}</p>`
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

let ctx;
function initializeImageEditor(blob,path) {
	const imgwindow = document.querySelector('.ze .main .imageedit');
	imgwindow.style.display = 'block';
	imgwindow.setAttribute('path', path);
	const imgname = document.querySelector('.ze .main .imageedit p');
	imgname.innerText = path;
	const imgcanvas = document.querySelector('.ze .main .imageedit canvas');
	ctx = imgcanvas.getContext('2d');
	const image = new Image()
	image.src = blob;
	console.log(image)
	imgcanvas.width = image.width;
	imgcanvas.height = image.height;
	imgcanvas.style.transformOrigin = "center";
	imgcanvas.style.left = (window.innerWidth - 400) / 2 - image.width / 2 + "px";
	imgcanvas.style.top = (window.innerHeight) / 2 - image.height / 2 + "px";
	imgcanvas.setAttribute('zoom', '1')
	imgcanvas.style.transform = 'scale(1)';
	ctx.drawImage(image, 0, 0);
}

function zoomCanvas() {
	const imgcanvas = document.querySelector('.ze .main .imageedit canvas');
	const oldzoom = imgcanvas.getAttribute('zoom')
	const zoomfactor = (event.deltaY < 0 ? 1.1 : 0.9090909);
	const newzoom = Math.min(10, Math.max(0.1, oldzoom * zoomfactor));
	imgcanvas.style.transform = `scale(${newzoom})`;
	imgcanvas.setAttribute('zoom', newzoom)
}

function initializeTextarea(text,path) {
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