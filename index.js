const DUMMY_KEYS = {
    'LOCALISATION_DUMMY_KEY': '_ENG Localisation_',
    'NEWSPAPER_DUMMY_KEY': '_Newspaper Article Configuration_'
};

async function initAndLoad(path) {
    await loadFile(path, 0);
    window.maxTreeCount = 0;
}

async function loadFile(path, thisTreeCount, parentData) {
    var treeEle = addTreeElement(thisTreeCount, path, document.getElementById('trees'), { copySource, save })

    var data = JSON.parse(await (await (await tryGetFile(window.selectedMod.baseFolder, (path + '.sodso.json').split('/')))?.getFile())?.text());

    var fileType = data.type || "Manifest";

    // Show actual text
    // createDummyKeys(data);

    // Create json-tree
    var tree = jsonTree.create(data, treeEle);
    runTreeSetup();

    let fileName = path.split('/').at(-1);
    if (['tree', 'msg', 'block'].includes(fileName.split('.')[1]) && fileName.split('.')[0] != data.id) {
        alert('Filename doesn\'t match id! File will not work in game!');
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
                return window.typeLayout[typeList[0]][typeList[1]]?.Item1;
            }
        }
        else
        {
            typeList[1] = window.typeLayout[typeList[0]][typeList[1]]?.Item1;
            typeList.splice(0, 1);
            return mapSplitPath(typeList);
        }
    }

    async function modifyTreeElement(jsonPointer, newValue) {
        data = jsonpatch.applyPatch(data, [
            {
                op: 'replace',
                path: jsonPointer,
                value: newValue
            }
        ]).newDocument;
        data = createDummyKeys(data);
        tree.loadData(data);
        runTreeSetup();
        await save();
    }

    async function runTreeSetup() {
        // Auto-expand the useful keys
        let expandedNodes = ['fileOrder', 'blocks', 'replacements']
        tree.expand(function (node) {
            if (expandedNodes.includes(node.label)) {
                node.childNodes.forEach(child => child.expand !== undefined && child.expand());
                return true;
            }
        });

        // Set paths
        tree.findAndHandle(item => {
            return true;
        }, item => {
            calculatePathToItem(item);
        });

        // Links for trees and blocks
        tree.findAndHandle(item => {
            // return item.el.querySelector('.jsontree_value_string')?.innerText?.includes("REF:");
            var typeMatch = item.el.querySelector('.jsontree_value_string')?.innerText?.match(/REF:(\w+)/)
            return typeMatch && !window.typeMap[typeMatch[1]];
        }, async item => {
            var ele = item.el.querySelector('.jsontree_value_string');
            const refPath = ele.innerText.replace(/"/g, "").replace("REF:", "").replace(/\w+\|/, '');

            ele.classList.add('link-element')

            ele.addEventListener('click', () => {
                loadFile(refPath, thisTreeCount + 1, data);
            });
        });

        // Editing operations

        // Simple types, direct editing and enums
        tree.findAndHandle(item => {
            return !item.isComplex;
        }, item => {
            var ele = item.el.querySelector('.jsontree_value');
            var splitPath = [fileType, ...item.pathToItem.replace(/\/-$/, '').split('/-/')];

            var mappedType = mapSplitPath(splitPath);

            // TODO: Convert this into the if branch below
            if (mappedType && window.enums[mappedType]?.length > 0) {
                createEnumSelectElement(
                    item.el.querySelector('.jsontree_value'),
                    window.enums[mappedType],
                    ele.innerText,
                    false,
                    async (selectedIndex) => {
                        await modifyTreeElement(getJSONPointer(item), parseInt(selectedIndex));
                    }
                );
            } else if (window.typeMap[mappedType]) {
                createSOSelectElement(
                    item.el.querySelector('.jsontree_value'),
                    window.typeMap[mappedType],
                    ele.innerText,
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
                        await modifyTreeElement(getJSONPointer(item), replacementValue);
                    }
                );
            } else if (mappedType === "FileType") {
                // Do nothing, not editable
            } else {
                ele.addEventListener('contextmenu', async (e) => {
                    e.preventDefault();
                    
                    if (!window.selectedMod) {
                        alert('Please select a mod to save in first');
                        throw 'Please select a mod to save in first';
                    }

                    let previousValue = item.el.querySelector('.jsontree_value').innerText;

                    // If it's a string, auto-handle quotes
                    if (item.type == 'string') {
                        previousValue = previousValue.substring(1, previousValue.length - 1);

                        // Double quotes
                        if (previousValue.startsWith('"')) {
                            previousValue = previousValue.substring(1, previousValue.length - 1);
                        }
                    }

                    let res = prompt('Enter new value', previousValue);

                    if (res === null) {
                        return;
                    }

                    if ((item.type == 'string' && res != 'null' && res !== null)) {
                        res = makeCSVSafe(res);
                    }

                    let parsed = JSON.parse(res);
                    if (parsed || parsed === false || parsed === 0 || parsed === '' || res === 'null') {
                        await modifyTreeElement(getJSONPointer(item), parsed);
                    }
                });
            }
        });

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
                    data = jsonpatch.applyPatch(data, [
                        {
                            op: 'remove',
                            path: getJSONPointer(item)
                        }
                    ]).newDocument;
                    data = createDummyKeys(data);
                    tree.loadData(data);
                    runTreeSetup();
                    await save();
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
                    let splitPath = [fileType, ...item.pathToItem.replace(/\/-$/, '').split('/-/')];
                    let mappedType = mapSplitPath(splitPath);

                    let newContent = await getTemplateForItem(mappedType);

                    if (newContent === null) return;

                    data = jsonpatch.applyPatch(data, [
                        {
                            op: 'add',
                            path: getJSONPointer(item) + '/-',
                            value: newContent
                        }
                    ]).newDocument;
                    data = createDummyKeys(data);
                    tree.loadData(data);
                    runTreeSetup();
                    await save();
                }
            });
        });
    }

    function calculatePathToItem(actualItem) {
        if(actualItem.pathToItem === undefined) {
            actualItem.pathToItem = actualItem.label.toString().replace(/\d+/, '-');
            let item = actualItem.parent;
            while(item.label != null) {
                actualItem.pathToItem = item.label.toString().replace(/\d+/, '-') + '/' + actualItem.pathToItem;
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

        writeFile(await tryGetFile(window.selectedMod.baseFolder, (path + '.sodso.json').split('/'), true), getSaveSafeJSON(), false);
    }

    function getSaveSafeJSON() {
        return JSON.stringify(data, (key, value) => (Object.keys(DUMMY_KEYS).includes(key) ? undefined : value), 2);
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
    switch (templateName) {
        case 'MOLeads':
            newTemplate.name = prompt(`Name`);
            return newTemplate;
        case 'Graffiti':
            newTemplate.ddsMessageTextList = prompt(`DDS Message ID`);
            return newTemplate;
        default:
            return newTemplate;
    }
}