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
		<div class="sidebar">
	
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

let loadedZip;
let zipFileObject;
let sortedFilePaths;
function zipEditorImportZip() {
	const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;

	for (let i = 0, f; f = files[i]; i++) {
		loadedZip = new JSZip();
		zipFileObject = {}
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
				<div class="zipEditorFolder ${folderName}" onclick="toggleFolder(this)">
					<p class="zipEditorFolderText">${folderName}</p>
					<svg height="2500" width="25">
						<line x1="4" y1="4" x2="21" y2="4" style="stroke:#555; stroke-width:3; stroke-linecap:round" />
						<line x1="21" y1="4" x2="21" y2="2500" style="stroke:#555; stroke-width:3; stroke-linecap:round" />
					</svg>
				</div>
				`
			}
		}, function () {
			alert("Not a valid zip file")
		});
	}
}

function toggleFolder(elem) {
	const rect = elem.getBoundingClientRect()
	if (event.clientY - rect.top <= 30) {
		elem.style.height = (elem.style.height == "auto" ? "30px" : "auto")
	}
}