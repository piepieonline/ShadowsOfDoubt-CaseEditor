const DUMMY_KEYS = {
    'LOCALISATION_DUMMY_KEY': '_ENG Localisation_',
    'NEWSPAPER_DUMMY_KEY': '_Newspaper Article Configuration_'
};

async function initAndLoad(path) {
    let openWindows = document.querySelectorAll('.file-window');
    for(let i = openWindows.length - 1; i >= 0; i--)
    {
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
    
    let treeEle = addTreeElement(path, document.getElementById('trees'), { copySource, save });

    if(!treeEle) return;

    var data = JSON.parse(await (await (loadedFile)?.getFile())?.text());

    let fileType = data.fileType || type || "Manifest";

    // Show actual text
    // createDummyKeys(data);

    // Create json-tree
    var tree = jsonTree.create(data, treeEle);
    runTreeSetup();
    markDefaultValues();

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
        // Set paths & titles
        tree.findAndHandle(item => {
            return true;
        }, item => {
            calculatepathToItemGeneric(item);

            // Add tooltip text
            var splitPath = [fileType, ...item.pathToItemGeneric.replace(/\/-$/, '').split('/-/')];

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

            if(!ele.classList.contains('link-element'))
            {
                ele.classList.add('link-element')
    
                ele.addEventListener('click', () => {
                    loadFile(refPath, false);
                }); 
            }
        });

        // Editing operations
        // Simple types, direct editing and enums
        tree.findAndHandle(item => {
            return !item.isComplex;
        }, item => {
            var ele = item.el.querySelector('.jsontree_value');
            
            var splitPath = [fileType, ...item.pathToItemGeneric.replace(/\/-$/, '').split('/-/')];

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

                    if (!window.selectedMod) {
                        alert('Please select a mod to save in first');
                        throw 'Please select a mod to save in first';
                    }

                    if (confirm('Add Element?')) {
                        let splitPath = [fileType, ...item.pathToItemGeneric.replace(/\/-$/, '').split('/-/')];
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
                                path: getJSONPointer(item) + '/-',
                                value: newContent
                            }
                        ]);
                    }
                });
            });
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

    function calculatepathToItemGeneric(actualItem) {
        if(actualItem.pathToItemGeneric === undefined) {
            actualItem.pathToItem = actualItem.label.toString();
            actualItem.pathToItemGeneric = actualItem.label.toString().replace(/\d+/, '-');
            let item = actualItem.parent;
            while(item.label != null) {
                actualItem.pathToItem = item.label.toString() + '/' + actualItem.pathToItem;
                actualItem.pathToItemGeneric = item.label.toString().replace(/\d+/, '-') + '/' + actualItem.pathToItemGeneric;
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

        if (!window.savingEnabled && !force) return;

        writeFile(await tryGetFile(window.selectedMod.baseFolder, (path).split('/'), true), getSaveSafeJSON(), false);
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
        let newFileName = prompt(`Name`);
        let newFileType = prompt(`Type`);

        await createFileIfNotExisting(newFileName, newFileType, window.selectedMod.baseFolder, (content) => {
            content.name = newFileName;
            content.presetName = newFileName;
            content.type = newFileType;
            content.copyFrom = null;
            return content;
        });

        return `REF:${newFileName}`;
    }

    newTemplate = cloneTemplate(templateName);
    newTemplate.copyFrom = null;
    return newTemplate;
}