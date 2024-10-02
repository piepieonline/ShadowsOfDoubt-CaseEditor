const DUMMY_KEYS = {
    'LOCALISATION_DUMMY_KEY': '_ENG Localisation_',
    'NEWSPAPER_DUMMY_KEY': '_Newspaper Article Configuration_'
};

async function initAndLoad(path) {
    let openWindows = document.querySelectorAll('.file-window');
    for(let i = openWindows.length - 1; i >= 0; i--) {
        deleteTree(openWindows[i]);
    }
    await loadFile(path, false);
}

async function loadFile(path, readOnly, type) {
    loadFileFromFolder(path + '.sodso.json', window.selectedMod.baseFolder, readOnly, type);
}

async function loadFileFromFolder(path, folderHandle, readOnly, type) {
    let loadedFile = await tryGetFile(folderHandle, path.split('/'));

    if(!loadedFile) {
        alert(`${path} doesn't exist or is a vanilla asset - create it in the manifest first`);
        return;
    }

    const isManifestFile = path === 'murdermanifest.sodso.json';

    // Manifest Frame
    let DOMtarget = isManifestFile ? document.querySelector('#manifest_panel>div') : document.getElementById('trees');

    let treeEle = addTreeElement(path, DOMtarget, readOnly, { copySource, save, showSelectFieldsDialog });

    if(!treeEle) return;

    var rawTextData = await (await (loadedFile)?.getFile())?.text();
    
    // Strip whitespace
    var data = JSON.parse(rawTextData);
    // Replace Unity references with string refs
    rawTextData = JSON.stringify(data).replaceAll(/({"m_FileID.*?(\d+).*?})/g, (rawMatch, fullMatch, id) => {
        return window.pathIdMap[id] ? `"REF:${window.pathIdMap[id]}"` : null;
    });
    
    data = JSON.parse(rawTextData);

    let fileType = data.fileType || type || "Manifest";

    // Show actual text
    // createDummyKeys(data);

    // Create json-tree
    var tree = jsonTree.create(data, treeEle);
    runTreeSetup();
    markDefaultValues();

    if(isManifestFile) {
        document.querySelector('#manifest_add_item_button').onclick = () => { tree.addNewArrayElement(['Manifest', 'fileOrder'], '/fileOrder') };
    }

    function createDummyKeys(data) {
        return data;
    }

    function mapSplitPath(typeList)
    {
        if(typeList.length == 1)
        {
            typeList = [fileType, ...typeList];
        }
        
        if(typeList.length == 2)
        {
            if(typeList[0] === fileType && typeList[1] === "type") {
                return "FileType";
            } else if(typeList[0] !== fileType && window.typeMap[typeList[0]]) {
                return window.typeMap[typeList[0]];
            } else {
                var soType = window.typeLayout[typeList[0]][typeList[1]]?.Item1;
                return soType;
            }
        }
        else
        {
            typeList[1] = window.typeLayout[typeList[0]][typeList[1]]?.Item1;
            typeList.splice(0, 1);
            return mapSplitPath(typeList);
        }
    }

    async function runTreeSetup() {
        // Nasty, but this code is shocking anyway
        tree.addNewArrayElement = addNewArrayElement;
        tree.updateTree = updateTree;

        // If we are rebuilding the manifest tree, empty out the buttons from the visual manifest panel
        if(isManifestFile) {
            document.querySelector('#manifest_panel .files-order ul').replaceChildren();
        }

        // Set paths & titles
        tree.findAndHandle(item => {
            return true;
        }, item => {
            calculatePathToItemGeneric(item);

            // Add tooltip text
            var splitPath = [fileType, ...item.pathToItemSplit];

            try
            {
                if(splitPath.length > 2) {
                    splitPath[splitPath.length - 2] = window.typeLayout[splitPath.at(-3)][splitPath.at(-2)].Item1;
                }
            } catch {} // Nothing found

            var labelEle = item.el.querySelector('.jsontree_label');
            try
            {
                labelEle.title = window.soCustomDescriptions[splitPath.at(-2)][splitPath.at(-1)] || "";
            } catch {}
            
            try
            {
                let officialDescription = window.typeLayout[splitPath.at(-2)][item.label].Item3 || "";
                if(labelEle.title != "" && officialDescription != "") labelEle.title += "\n\n";
                if(officialDescription != "") labelEle.title += 'Official description: ' + officialDescription;
            } catch {}
        });

        // Auto-expand the useful keys
        let expandedNodes = ['fileOrder', 'blocks', 'replacements'];
        tree.expand(function (node) {
            if (expandedNodes.includes(node.label)) {
                node.childNodes.forEach(child => child.expand !== undefined && child.expand());
                return true;
            }
        });

        // Links for trees and blocks
        tree.findAndHandle(item => {
            // return item.el.querySelector('.jsontree_value_string')?.innerText?.includes("REF:");
            var typeMatch = item.el.querySelector('.jsontree_value_string')?.innerText?.match(/REF:(\w+)/)
            return typeMatch && !window.typeMap[typeMatch[1]];
        }, async item => {
            var ele = item.el.querySelector('.jsontree_value_string');
            const refPath = ele.innerText.replace(/"/g, "").replace("REF:", "").replace(/\w+\|/, '');

            if(!ele.classList.contains('link-element')) {
                ele.classList.add('link-element')
    
                ele.addEventListener('click', () => {
                    loadFile(refPath, false);
                }); 
            }

            if (isManifestFile && !item.isComplex) {
                let ul = document.querySelector('#manifest_panel .files-order ul');
                let li = fastElement("li");
                let file_link = fastElement("button", "secondary");
                file_link.setAttribute('type', 'submit');
                file_link.innerText = ele.innerText.replace(/REF:|"|'/g, '');
                file_link.addEventListener('click', () => {
                    loadFile(refPath, false);
                });
                li.appendChild(file_link);
                ul.appendChild(li);
            }
        });

        // Editing operations
        // Simple types, direct editing and enums
        tree.findAndHandle(item => {
            return !item.isComplex;
        }, item => {
            var ele = item.el.querySelector('.jsontree_value');
            
            var splitPath = [fileType, ...item.pathToItemSplit];

            var mappedType = mapSplitPath(splitPath);
            
            if(splitPath[splitPath.length - 1] === "copyFrom") {
                mappedType = fileType;
            }

            let currentValue = ele.innerText;
            if(currentValue === "false") currentValue = 0;
            if(currentValue === "true") currentValue = 1;

            // TODO: Convert this into the if branch below
            if (mappedType && window.enums[mappedType]?.length > 0) {
                createEnumSelectElement(
                    item.el.querySelector('.jsontree_value'),
                    window.enums[mappedType],
                    currentValue,
                    false,
                    readOnly,
                    async (selectedIndex) => {
                        await updateTree([
                            {
                                op: 'replace',
                                path: getJSONPointer(item),
                                value: parseInt(selectedIndex)
                            }
                        ]);
                    }
                );
            } else if (window.typeMap[mappedType]) {
                createSOSelectElement(
                    item.el.querySelector('.jsontree_value'),
                    window.typeMap[mappedType],
                    currentValue,
                    readOnly,
                    async (selectedIndex, customValue) => {
                        let replacementValue = item.el.querySelector('.jsontree_value');
                        if(selectedIndex >= 0)
                        {
                            replacementValue = `REF:${mappedType}|${window.typeMap[mappedType][selectedIndex]}`;
                        }
                        else
                        {
                            replacementValue = `REF:${mappedType}|${customValue}`;
                        }
                        await updateTree([
                            {
                                op: 'replace',
                                path: getJSONPointer(item),
                                value: replacementValue
                            }
                        ]);
                    }
                );
            } else if (mappedType === "FileType") {
                // Do nothing, not editable
            } else {
                createInputElement(item.el.querySelector('.jsontree_value'), readOnly || splitPath.at(-1) === 'fileType', async (newValue) => {
                    if (!window.selectedMod) {
                        alert('Please select a mod to save in first');
                        throw 'Please select a mod to save in first';
                    }

                    if (newValue === null) {
                        return;
                    }

                    if ((item.type == 'string' && newValue != 'null' && newValue !== null)) {
                        newValue = makeCSVSafe(newValue);
                    }

                    let parsed = JSON.parse(newValue);
                    if (parsed || parsed === false || parsed === 0 || parsed === '' || newValue === 'null') {
                        await updateTree([
                            {
                                op: 'replace',
                                path: getJSONPointer(item),
                                value: parsed
                            }
                        ]);
                    }
                });
            }
        });

        if(!readOnly) {
            // Removing element
            tree.findAndHandle(item => {
                return item.parent.type === 'array';
            }, item => {
                var ele = item.el.querySelector('.jsontree_label');
                ele.addEventListener('contextmenu', async (e) => {
                    e.preventDefault();

                    if (!window.selectedMod) {
                        alert('Please select a mod to save in first');
                        throw 'Please select a mod to save in first';
                    }

                    if (confirm('Remove Element?')) {
                        updateTree([
                            {
                                op: 'remove',
                                path: getJSONPointer(item)
                            }
                        ]);
                    }
                });
            });

            // Adding element
            tree.findAndHandle(item => {
                return item.type === 'array';
            }, item => {
                var ele = item.el.querySelector('.jsontree_label');
                ele.addEventListener('contextmenu', async (e) => {
                    e.preventDefault();
                    addNewArrayElement([fileType, ...item.pathToItemSplit], getJSONPointer(item));
                });
            });
        }

        async function addNewArrayElement(splitPath, addToPath) {
            if (!window.selectedMod) {
                alert('Please select a mod to save in first');
                throw 'Please select a mod to save in first';
            }
            let mappedType = mapSplitPath(splitPath);

            let newContent;
            if(window.typeMap[mappedType])
                newContent = `REF:${mappedType}|${window.typeMap[mappedType][0]}`;
            else
                newContent = await getTemplateForItem(mappedType);

            if (newContent === null) return;

            updateTree([
                {
                    op: 'add',
                    path: addToPath + '/-',
                    value: newContent
                }
            ]);
        }

        async function updateTree(patch)
        {
            let openPaths = [];
            tree.findAndHandle(item => {
                return item.el.classList.contains('jsontree_node_expanded');
            }, item => {
                openPaths.push(item.pathToItem);
            });

            // Patch the data
            data = jsonpatch.applyPatch(data, patch).newDocument;
            data = createDummyKeys(data);
            tree.loadData(data);

            // Recreate the tree
            runTreeSetup();
            // Save the new data
            await save();

            // Reopen previously opened paths
            tree.findAndHandle(item => {
                return openPaths.includes(item.pathToItem);
            }, item => {
                item.expand();
            });

            markDefaultValues();
        }
    }

    function calculatePathToItemGeneric(actualItem) {
        if(actualItem.pathToItemGeneric === undefined) {
            actualItem.pathToItem = actualItem.label.toString();
            actualItem.pathToItemGeneric = actualItem.label.toString().replace(/\d+/, '-');
            actualItem.pathToItemSplit = []

            if(actualItem.label.toString().replace(/\d+/, '') !== '') {
                actualItem.pathToItemSplit.splice(0, 0, actualItem.label.toString());
            }

            let item = actualItem.parent;
            while(item.label != null) {
                actualItem.pathToItem = item.label.toString() + '/' + actualItem.pathToItem;
                actualItem.pathToItemGeneric = item.label.toString().replace(/\d+/, '-') + '/' + actualItem.pathToItemGeneric;

                if(item.label.toString().replace(/\d+/, '') !== '') {
                    actualItem.pathToItemSplit.splice(0, 0, item.label.toString());
                }

                item = item.parent;
            }
        }
    }

    async function copySource() {
        navigator.clipboard.writeText(getSaveSafeJSON());
    }

    async function save(force) {
        if (!window.selectedMod) {
            alert('Please select a mod to save in first');
            throw 'Please select a mod to save in first';
        }

        // console.log(getSaveSafeJSON());
        if (!window.savingEnabled && !force) return;
        writeFile(await tryGetFile(window.selectedMod.baseFolder, (path).split('/'), true), getSaveSafeJSON(), false);
    }

    async function showSelectFieldsDialog() {
        let fieldList = document.querySelector('#select-fields-modal-field-list');
        fieldList.replaceChildren();
        document.querySelector('#select-fields-modal').setAttribute("open", null);

        let hiddenFields = ['presetName', 'copyFrom', 'name', 'type'];
        let dataToShow = Object.keys(window.templates[data.fileType]).filter(el => !hiddenFields.includes(el));
        let currentFields = Object.keys(data).filter(el => !hiddenFields.includes(el));

        dataToShow.forEach(key => {
            let li = document.createElement('li');
            let label = document.createElement('label');
			let checkbox = document.createElement("input");
			checkbox.type = 'checkbox';
			checkbox.value = key;

            if(currentFields.includes(key)) {
                checkbox.setAttribute('checked', true);
            }

            label.appendChild(checkbox)
            label.innerHTML += key;
			li.appendChild(label);
			fieldList.appendChild(li);
		});

        // We only want the one handler
        document.querySelector('#select-fields-submit-button').onclick = () => {
            let patches = [];

            fieldList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
                // If it's currently included, but unchecked, delete it
                if(currentFields.includes(checkbox.value) && !checkbox.checked) {
                    patches.push({
                        op: 'remove',
                        path: '/' + checkbox.value
                    });
                }
                // If it's not currently included, but is now checked, add it with the default value
                else if(!currentFields.includes(checkbox.value) && checkbox.checked) {
                    patches.push({
                        op: 'add',
                        path: '/' + checkbox.value,
                        value: window.templates[data.fileType][checkbox.value]
                    });
                }
            });
            
            tree.updateTree(patches);
            document.querySelector('#select-fields-modal').removeAttribute('open');
        }
    }

    function getSaveSafeJSON() {
        return JSON.stringify(data, (key, value) => (Object.keys(DUMMY_KEYS).includes(key) ? undefined : value), 2);
    }

    function markDefaultValues()
    {
        tree.findAndHandle(item => {
            return item.parent.isRoot;
        }, item => {
            let itemLabel = item.label;
            if(fileType in window.templates && itemLabel in window.templates[fileType] && JSON.stringify(data[itemLabel]) === JSON.stringify(window.templates[fileType][itemLabel]))
            {
                item.el.classList.add('default-value-node');
            }
        });
    }
}

async function getTemplateForItem(templateName) {
    let newTemplate = 'PLACEHOLDER';

    if(templateName === "FileType")
    {
        let { name, type, copyFrom } = await showNewFilePopup();
        closeNewFilePopup();

        if(name == null || type == null)
        {
            console.log("cancelled");
            return null;
        }

        await createFileIfNotExisting(name, type, window.selectedMod.baseFolder, (content) => {
            content.name = name;
            content.presetName = name;
            content.type = type;
            content.copyFrom = copyFrom ? `REF:${type}|${copyFrom}` : null;
            return content;
        });

        return `REF:${name}`;
    }

    newTemplate = cloneTemplate(templateName);
    return newTemplate;
}

async function showNewFilePopup() {
    let popupPromise = new Promise((resolve, reject) => {
        window.newFilePromiseResolve = (name, type, copyFrom) => resolve({ name, type, copyFrom: (copyFrom === 'None' ? null : copyFrom) });
        window.newFilePromiseReject = () => reject({ name: null, type: null, copyFrom: null });
    });

    document.querySelector('#new-file-modal').toggleAttribute('open', true);

    return popupPromise;
}

function closeNewFilePopup() {
    document.querySelector('#new-file-modal').toggleAttribute('open', false);
    document.querySelector('#new-file-modal-file-name').value = '';
}

function deepReplace (obj, keyName, replacer) {
    if(obj.hasOwnProperty(keyName)) {
        return replacer(obj[keyName]);
    } else {
        let keys = Object.keys(obj);
        for (ki = 0; ki < keys.length; ki++) {
            let key = keys[ki];
            if (Array.isArray(obj[keys[ki]])) {
                for(i = 0; i < obj[key].length; i++) {
                    obj[key][i] = deepReplace(obj[key][i], keyName, replacer)
                }
            } else if (typeof obj[key] === "object") {
                obj[key] = deepReplace(obj[key], keyName, replacer);
            }
        }
    }

    return obj;
}