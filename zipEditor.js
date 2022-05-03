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
			<div class="textedit">
				<p></p>
				<textarea spellcheck="false" style="display:none;" oninput="raw_files[this.getAttribute('path')] = this.value;"></textarea>
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


let raw_files;
let loadedZip;
let zipFileObject;
let sortedFilePaths;
function zipEditorImportZip() {
	const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;

	for (let i = 0, f; f = files[i]; i++) {
		loadedZip = new JSZip();
		zipFileObject = {}
		raw_files = {}
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
							document.querySelector(destinationPath).innerHTML += 
							`<img path="${imagePathString}" name="${imageName}" src="${URL.createObjectURL(blob)}">`
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
								raw_files[filePathString] = text;
								document.querySelector(destinationPath).innerHTML += 
								`<p path="${filePathString}" onclick="let path=this.getAttribute('path');initializeTextarea(raw_files[path],path)" class="zipEditorFileName">${fileName}</p>`
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

function initializeTextarea(text,path) {
	const textname = document.querySelector('.ze .main .textedit p')
	textname.innerText = path;
	const textarea = document.querySelector('.ze .main .textedit textarea');
	textarea.value = text;
	textarea.style.display = 'block';
	textarea.setAttribute('path', path);
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