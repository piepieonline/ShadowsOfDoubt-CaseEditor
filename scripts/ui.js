// Autosaving INIT
document.addEventListener("DOMContentLoaded", () => {
	setSaving(JSON.parse(localStorage.getItem('SOD_MurderCaseBuilder_Autosave')) ?? true);
	document.querySelector('#new-file-modal-file-type').innerHTML = document.querySelector('#asset-model-type-list').innerHTML;

	if(!window.localStorage.getItem('SOD_MurderCaseBuilder_SpoilerWarningDismissed')) {
		document.querySelector('#spoiler-warning-modal').setAttribute("open", null);
		document.querySelector('#before-you-start-modal').removeAttribute("open");
	}

	if(window.queryParams.viewOnly) {
		enableAssetOnlyMode(window.queryParams.openDefaultFiles);
	}

	if(window.queryParams.openDefaultFiles) {
		let openDefaultFiles;
		try
		{
			JSON.parse(window.queryParams.openDefaultFiles).forEach(file => {
				loadFileFromOnlineRepo(file.type + '/' + file.name + ".json", file.type);
			});
		}
		catch {}
	}
});

//Manifest Panel
function toggleManifestPanel() {
	document.querySelector('#manifest_panel .jsontree-container').classList.toggle("hidden");
	document.querySelector('#manifest_panel .files-order').classList.toggle("hidden");
}

function shareOpen() {
	let openFiles = [...document.querySelectorAll('.file-window')].map(el => el.getAttribute('path').split('.')[0]).map(file => ({
		type: file.split('/')[0],
		name: file.split('/')[1]
	}));

	navigator.clipboard.writeText(`${location.href.replace('/' + location.search, '')}/?viewOnly=true&openDefaultFiles=${JSON.stringify(openFiles)}`).then(() => {
		alert('Link copied to clipboard');
	})
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

	toggleEditMode(true);

	document.querySelector('#before-you-start-modal').removeAttribute("open");
	// updateFavButton();
}

async function enableAssetOnlyMode(skipAssetModel) {
	toggleEditMode(false);
	document.querySelector('#before-you-start-modal').removeAttribute("open");
	if(!skipAssetModel)
		document.querySelector('#asset-explorer-modal').toggleAttribute('open')
}

async function toggleEditMode(editingMode) {
	document.getElementById('manifest_panel').classList.toggle('hidden', !editingMode)
	document.getElementById('files-section-container').classList.toggle('file-section-edit-mode', editingMode)
	document.getElementById('editing-mode-control-group').classList.toggle('hidden', !editingMode)
	document.getElementById('viewing-mode-control-group').classList.toggle('hidden', editingMode)
}

function dismissSpoilerWarning() {
	window.localStorage.setItem('SOD_MurderCaseBuilder_SpoilerWarningDismissed', true);
	document.querySelector('#spoiler-warning-modal').removeAttribute("open");
	document.querySelector('#before-you-start-modal').setAttribute("open", null);
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

	let {modName, type, createDDSFolders } = await showNewCasePopup();
	closeNewCasePopup();

	if (modName == null)
		return;

	await openModFolder(modName, true, type, createDDSFolders);

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

function updateAssetModel(rebuildList, hasLocalFiles) {
	let typeListEle = document.getElementById('asset-model-type-list');
	
	if(rebuildList)
	{
		typeListEle.innerHTML = '';
		let typeList = Object.keys(window.typeMap).sort();

		if(!hasLocalFiles) {
			typeList = [
				...window.onlineTypes,
				'------',
				...typeList.filter(type => !window.onlineTypes.includes(type))
			];
		}

		typeList.forEach(type => {
			var option = document.createElement("option");
			option.text = type;
			typeListEle.appendChild(option);
		});
	}

	let assetList = document.getElementById('asset-model-asset-list');
	assetList.innerHTML = '';

	window.typeMap[typeListEle.value]?.sort().forEach(SO => {
		let tr = document.createElement('tr');
		var option = document.createElement("td");
		option.innerText = SO;

		if(window.dirHandleExportedSOPath) {
			option.classList.add('link-element');
			option.addEventListener('click', (e) => {
				loadFileFromFolder(typeListEle.value + '/' + SO + ".json", window.dirHandleExportedSOPath, true, typeListEle.value);
			});
		} else if(window.onlineTypes.includes(typeListEle.value)) {
			option.classList.add('link-element');
			option.addEventListener('click', (e) => {
				loadFileFromOnlineRepo(typeListEle.value + '/' + SO + ".json", typeListEle.value);
			});
		}
		tr.appendChild(option)
		assetList.appendChild(tr);
	});

	assetList.classList.toggle('asset-loaded-link', window.dirHandleExportedSOPath || window.onlineTypes.includes(typeListEle.value))
}

function updateNewFileCopyFrom() {
	let type = document.querySelector('#new-file-modal-file-type').value;
	let ele = document.querySelector('#new-file-modal-copy-from');
	ele.replaceChildren();
	['None', ...window.typeMap[type]?.sort()].forEach(SO => {
		var option = document.createElement("option");
		option.text = SO;
		ele.appendChild(option);
	});
}

function updateSelectAllCopyFrom() {
	let checked = document.querySelector('#select-fields-modal-select-all').checked;
	document
		.querySelector('#select-fields-modal-field-list')
		.querySelectorAll('input[type="checkbox"]')
		.forEach((checkbox) => {
			checkbox.checked = checked;
		});
}

async function loadExportedSOs() {
	let exportedSOPath = await idbKeyval.get('ExportedSOPath');
	let options = exportedSOPath ? { startIn: exportedSOPath, mode: 'read' } : { mode: 'read' };
	window.dirHandleExportedSOPath = await window.showDirectoryPicker(options);
	await idbKeyval.set('ExportedSOPath', window.dirHandleExportedSOPath);
	updateAssetModel(true, true);
}
