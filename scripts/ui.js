// Autosaving INIT
window.onload = () => {
	setSaving(JSON.parse(localStorage.getItem('SOD_MurderCaseBuilder_Autosave')) ?? true);
	document.querySelector('#fileType').innerHTML = document.querySelector('#asset-model-type-list').innerHTML;
}

//Manifest Panel
function toggleManifestPanel() {
	document.querySelector('#manifest_panel .jsontree-container').classList.toggle("hidden");
	document.querySelector('#manifest_panel .files-order').classList.toggle("hidden");
}

// Assets loading
async function loadFromGUI() {
	if (window.dirHandleModDir == null) {
		try {
			await getModDir();
			window.loadedMods = await refreshModList();
			window.selectedMod = null;

			updateSelect('select-loaded-mod', ['None', ...window.loadedMods.map(mod => mod.modName)]);
		}
		catch { }
	}

	if(window.selectedMod != null) {
		await initAndLoad('murdermanifest');
	}
	document.querySelector('#load_popup').removeAttribute("open")
	// updateFavButton();
}

// Murder loading
async function updateSelectedMod() {
	document.querySelector('#manifest_panel>div').replaceChildren();
	window.selectedMod = window.loadedMods.find(mod => mod.modName == document.getElementById('select-loaded-mod').value);

	if(window.selectedMod != null) {
		await initAndLoad('murdermanifest');
	}
}



async function newMod() {
	if (window.dirHandleModDir == null) {
		alert('Please load a parent mod folder first');
		throw 'Please load a parent mod folder first';
	}

	let modName = prompt('Enter a new mod name');

	if (modName == null)
		return;

	await openModFolder(modName, true);

	window.loadedMods = await refreshModList();
	updateSelect('select-loaded-mod', ['None', ...window.loadedMods.map(mod => mod.modName)]);
	window.selectedMod = window.loadedMods.filter(mod => mod.modName == modName)[0];
	document.getElementById('select-loaded-mod').value = modName;
	updateSelectedMod();
}

function setSaving(saving) {
	window.savingEnabled = saving;
	localStorage.setItem('SOD_MurderCaseBuilder_Autosave', saving)

	let ele = document.getElementById('autosaving_switch');
	if(saving)
	{
		ele.toggleAttribute('checked');
	}
	else
	{
		ele.removeAttribute('checked');
	}
}

function toggleDefaultValues() {
	document.querySelectorAll('.default-value-node').forEach(ele => {
		ele.classList.toggle('hidden-default-value-node');
	});
}

function updateAssetModel(firstRun) {
	let typeList = document.getElementById('asset-model-type-list');

	if(firstRun)
	{
		Object.keys(window.typeMap).sort().forEach(type => {
			var option = document.createElement("option");
			option.text = type;
			typeList.appendChild(option);
		});
	}

	let assetList = document.getElementById('asset-model-asset-list');
	assetList.innerHTML = '';

	window.typeMap[typeList.value]?.sort().forEach(SO => {
		let tr = document.createElement('tr');
		var option = document.createElement("td");
		option.innerText = SO;

		if(window.dirHandleExportedSOPath) {
			option.classList.add('link-element');
			option.addEventListener('click', (e) => {
				loadFileFromFolder(typeList.value + '/' + SO + ".json", window.dirHandleExportedSOPath, true, typeList.value);
			});
		}
		tr.appendChild(option)
		assetList.appendChild(tr);
	});
}

async function loadExportedSOs() {
	let exportedSOPath = await idbKeyval.get('ExportedSOPath');
	let options = exportedSOPath ? { startIn: exportedSOPath, mode: 'read' } : { mode: 'read' };
	window.dirHandleExportedSOPath = await window.showDirectoryPicker(options);
	await idbKeyval.set('ExportedSOPath', window.dirHandleExportedSOPath);
	updateAssetModel(false);
}