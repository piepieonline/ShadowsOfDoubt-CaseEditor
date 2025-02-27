const OPTION_NULL_VALUE = -1;
const OPTION_CUSTOM_VALUE = -2;
const OPTION_CUSTOM_NEW_VALUE = -3;

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function addTreeElement(path, parent, readOnly, editorCallbacks) {
    let selectorSafePath = path.replace(/\//g, '_').replace('.json', '');

    if(document.querySelector(`#file-window-${selectorSafePath}`) !== null) return false;

    // DOM GENERATION

    // Container
    const div = fastDiv("file-window");
    div.id = `file-window-${selectorSafePath}`;
    div.setAttribute('path', path);
    const jsontreeEle = fastDiv( "jsontree-container");
    div.appendChild(jsontreeEle);
    parent.appendChild(div);

    if (path === "murdermanifest.sodso.json") {
        // Manifest Panel
        let filesOrderList = fastDiv("files-order");
        parent.appendChild(filesOrderList);
        let ul = fastElement("ul");
        filesOrderList.appendChild(ul);
        jsontreeEle.classList.add("hidden");
    } else {
        //Tree Panel
        // Editor bar
        const editorBar = document.createElement("nav");
		editorBar.className = "editor-bar";
		jsontreeEle.appendChild(editorBar);
		const ul_left = document.createElement("ul");
		editorBar.appendChild(ul_left);

		const titleEle = document.createElement("li");
		titleEle.innerHTML = `<h5 title=${path}>${path.split('.')[0]}</h5>`;
		ul_left.appendChild(titleEle);

		const buttons = document.createElement("li");
		ul_left.appendChild(buttons);

		const group = document.createElement("div");
		group.setAttribute("role", "group");
        group.classList.add('jsontree-editor-bar-button-group')
		buttons.appendChild(group);

        if(!readOnly) {
            const saveChanges = document.createElement("button");
            saveChanges.innerText = "Save";
            saveChanges.addEventListener('click', () => editorCallbacks.save(true))
            group.appendChild(saveChanges);
        }

		const copySource = document.createElement("button");
		copySource.innerText = "Copy";
		copySource.addEventListener('click', editorCallbacks.copySource)
		group.appendChild(copySource);

		if(path !== 'murdermanifest') {
			const closeCross = document.createElement("button");
			closeCross.innerText = 'Close';
			closeCross.addEventListener('click', () => {
				deleteTree(div);
			})
			group.appendChild(closeCross);
		}

        // "Select Override Fields"
        if(!readOnly) {
            const showFieldSelectButtonLI = document.createElement('li');
            ul_left.appendChild(showFieldSelectButtonLI);
    
            const showFieldSelectButtonGroup = document.createElement("div");
            showFieldSelectButtonGroup.setAttribute("role", "group");
            showFieldSelectButtonLI.appendChild(showFieldSelectButtonGroup);
    
            const showFieldSelectButton = document.createElement('button');
            showFieldSelectButton.innerText = 'Select Override Fields';
            showFieldSelectButton.classList.add('jsontree-editor-bar-field-select-button')
            showFieldSelectButton.addEventListener('click', editorCallbacks.showSelectFieldsDialog);
            showFieldSelectButtonGroup.appendChild(showFieldSelectButton);
        }
    }

    return jsontreeEle;
}

function deleteTree(treeEleToClose) {
    treeEleToClose.remove();
}

function getJSONPointer(node) {
    if (node.isRoot) {
        return "";
    }

    return getJSONPointer(node.parent) + "/" + node.label;
}

function createInputElement(domNode, readOnly, onUpdateCallback) {
    let inputElement = document.createElement("input");
    let initialValue = domNode.innerText.replace(/"/g, '');
    inputElement.value = initialValue;
    inputElement.readOnly = readOnly;
    inputElement.setAttribute('size', Math.max(initialValue.length, 5));
    inputElement.addEventListener('input', (e) => {
        e.target.setAttribute('size', Math.max(e.target.value.length, 5));
    });
    domNode.replaceChildren(inputElement);

    // Test for a GUID. If it is one, deeplink to the DDS Editor
    if(GUID_PATTERN.test(initialValue))
    {
        var linkButton = document.createElement("span");
        linkButton.innerText = "➥";
        linkButton.addEventListener('click', async () => {
            // Use the link href value instead of duplicating it
            let documentType = 'unknown';

            if(window.ddsMap.trees.indexOf(initialValue) != -1) documentType = 'tree';
            else if(window.ddsMap.messages.indexOf(initialValue) != -1) documentType = 'message';
            else if(window.ddsMap.blocks.indexOf(initialValue) != -1) documentType = 'block';

            const urlToOpen = window.forceLocalDDS ? 'https://localhost:8080' : document.querySelector('#dds-viewer-tool-link').href;
            window.open(`${urlToOpen}?documentType=${documentType}&documentId=${initialValue}&selectedMod=${document.getElementById('select-loaded-mod').value}&caseEditorLink=true`, '_blank').focus();
        });
        domNode.appendChild(linkButton);
    }

    inputElement.addEventListener('blur', async (e) => {
        if(initialValue != e.target.value)
        {
            onUpdateCallback(e.target.value);
        }
    });
}

function createSOSelectElement(domNode, options, selectedSO, readOnly, onUpdateCallback) {
    var selectedOptionMatch = selectedSO.match(/(?:REF:)?([\w-]+)\|([\w-]+).*/);
    var selectedOption = OPTION_CUSTOM_VALUE;

    let foundType = false;
    if(selectedOptionMatch) {
        let foundIndex = options.indexOf(selectedOptionMatch[2]);
        selectedOption = foundIndex >= 0 ? foundIndex : OPTION_CUSTOM_VALUE;
        foundType = selectedOptionMatch[1];
    } else if (selectedSO == 'null') {
        selectedOption = OPTION_NULL_VALUE;
        foundType = true;
    }

    var createdNodes = createEnumSelectElement(domNode, options, selectedOption, foundType, readOnly, onUpdateCallback);

    if(createdNodes.selectedCustomOption)
        createdNodes.selectedCustomOption.text = `Custom: ${selectedSO.replace(/"/g, "").replace("REF:", "").replace(/\w+\|/, '').trim()}`;

    var selectElement = $(domNode).find('select');

    // Инициализация select2
    selectElement.select2({dropdownParent: $('#trees')});

    // Синхронизация select2 и обычного select
    selectElement.on('change', function() {
        let value = selectElement[0].value;
        let newCustomValue;
        if(value == OPTION_CUSTOM_NEW_VALUE)
        {
            let res = prompt('Enter prefab name', '');

            if (res === null) {
                return;
            }

            if ((res != 'null' && res !== null)) {
                res = makeCSVSafe(res);
            }

            newCustomValue = JSON.parse(res);
        }
        onUpdateCallback(value, newCustomValue);
    });

    return createdNodes;
}

function createEnumSelectElement(domNode, options, selectedIndex, soFileType, readOnly, onUpdateCallback) {
    //Create and append select list
    let selectList = document.createElement("select");
    domNode.replaceChildren(selectList);

    let selectedCustomOption;
    let selectedNullOption;

    selectList.disabled = readOnly;

    if(soFileType) {
        var option = document.createElement("option");

        // Option to enter a custom object manually
        option.value = OPTION_CUSTOM_NEW_VALUE;
        option.text = "Custom...";
        option.selected = selectedIndex == OPTION_CUSTOM_NEW_VALUE;
        selectList.appendChild(option);

        // Option that shows an object that isn't base game
        if(selectedIndex === OPTION_CUSTOM_VALUE || selectedIndex === OPTION_CUSTOM_NEW_VALUE)
        {
            selectedCustomOption = document.createElement("option");
            selectedCustomOption.value = OPTION_CUSTOM_VALUE;
            selectedCustomOption.text = "Custom:";
            selectedCustomOption.selected = OPTION_CUSTOM_VALUE == selectedIndex;
            selectList.appendChild(selectedCustomOption);
        }
        
        // If we are selecting SOs, it could also be null
        selectedNullOption = document.createElement("option");
        selectedNullOption.value = OPTION_NULL_VALUE;
        selectedNullOption.text = "Nothing (null)";
        selectedNullOption.selected = OPTION_NULL_VALUE == selectedIndex;
        selectList.appendChild(selectedNullOption);


        if(selectedIndex == OPTION_CUSTOM_VALUE || window.dirHandleExportedSOPath || window.onlineTypes.includes(soFileType))
        {
            var linkButton = document.createElement("span");
            linkButton.innerText = "➥";
            linkButton.addEventListener('click', () => {

                if(selectedIndex == OPTION_CUSTOM_VALUE) {
                    // Custom files load from the mod folder
                    const soName = selectedCustomOption.text.replace("Custom:", "").trim();
                    loadFile(soName, false);
                } else if(window.dirHandleExportedSOPath) {
                    // If we have loaded the game files locally, use those
                    const soName = selectList[selectList.selectedIndex].innerText.trim();
                    loadFileFromFolder(soFileType + '/' + soName + ".json", window.dirHandleExportedSOPath, true, soFileType);
                } else {
                    // Get the game files that are shared as part of this repo
                    const soName = selectList[selectList.selectedIndex].innerText.trim();
                    loadFileFromOnlineRepo(soFileType + '/' + soName + ".json", soFileType);
                }

            });
            domNode.appendChild(linkButton);
        }
    }
    
    //Create and append the options
    for (var i = 0; i < options.length; i++) {
        var option = document.createElement("option");

        option.value = i;
        option.text = options[i];
        option.selected = i == selectedIndex;

        selectList.appendChild(option);
    }

    // console.log(selectList)
    // $(selectList).select2();
    selectList.addEventListener('change', async (e) => {
        let newCustomValue;
        if(e.target.value == OPTION_CUSTOM_NEW_VALUE)
        {
            let res = prompt('Enter prefab name', '');

            if (res === null) {
                return;
            }

            if ((res != 'null' && res !== null)) {
                res = makeCSVSafe(res);
            }

            newCustomValue = JSON.parse(res);
        }
        onUpdateCallback(e.target.value, newCustomValue);
    });
    return { list: selectList, selectedCustomOption };
}