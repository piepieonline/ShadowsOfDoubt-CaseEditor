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

            // TODO: Convert this into the if branch below
            if (window.enums[item.label]?.length > 0) {
                createEnumSelectElement(
                    item.el.querySelector('.jsontree_value'),
                    window.enums[item.label],
                    ele.innerText
                ).addEventListener('change', async (e) => {
                    await modifyTreeElement(getJSONPointer(item), parseInt(e.target.value));
                });
            } else if (window.enums[window.pathToTypeMap[item.pathToItem]]?.length > 0) {
                createEnumSelectElement(
                    item.el.querySelector('.jsontree_value'),
                    window.enums[window.pathToTypeMap[item.pathToItem]],
                    ele.innerText
                ).addEventListener('change', async (e) => {
                    await modifyTreeElement(getJSONPointer(item), parseInt(e.target.value));
                });
            } else if (window.pathToTypeMap[item.pathToItem] && window.typeMap[window.pathToTypeMap[item.pathToItem]]) {
                createSOSelectElement(
                    item.el.querySelector('.jsontree_value'),
                    window.typeMap[window.pathToTypeMap[item.pathToItem]],
                    ele.innerText
                ).addEventListener('change', async (e) => {
                    let replacementValue = 'PLACEHOLDER';
                    if(e.target.value >= 0) {
                        replacementValue = `REF:${window.pathToTypeMap[item.pathToItem]}|${window.typeMap[window.pathToTypeMap[item.pathToItem]][e.target.value]}`;
                    }
                    await modifyTreeElement(getJSONPointer(item), replacementValue);
                });
            } else {
                ele.addEventListener('contextmenu', async (e) => {
                    e.preventDefault();

                    // TODO:
                    if(window.pathToTypeMap[item.pathToItem]) {
                        console.log(window.pathToTypeMap[item.pathToItem])
                    }

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
                    let newContent = await getTemplateForItem(item);

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

async function getTemplateForItem(item) {
    switch (item.label.toLowerCase()) {
        case 'messages':
            let message = cloneTemplate('treeMessage');
            message.msgID = prompt(`Existing GUID (Or cancel to create a new file)`) || await createNewFile('message');
            message.instanceID = crypto.randomUUID();
            return message;
        case 'links':
            let treeMessageLinks = cloneTemplate('treeMessageLinks');
            treeMessageLinks.to = prompt(`Existing instanceID`) || '';
            treeMessageLinks.from = item.parent.childNodes.find(node => node.label == 'instanceID').el.querySelector('.jsontree_value').innerText.replaceAll('"', '');
            return treeMessageLinks;
        case 'traits':
            return prompt(`Trait name`) || null;
        case 'blocks':
            let block = cloneTemplate('messageBlock');
            block.blockID = prompt(`Existing GUID (Or cancel to create a new file)`) || await createNewFile('block');
            block.instanceID = crypto.randomUUID();
            return block;
        case 'replacements':
            let replacement = cloneTemplate('blockReplacement');
            let guid = prompt(`Existing GUID (Or cancel to create a new file)`);
            if (guid) {
                replacement.replaceWithID = guid;
            } else {
                replacement.replaceWithID = crypto.randomUUID();
                await addToStrings(replacement.replaceWithID, prompt(`English Line`));
            }
            return replacement;
        case 'triggers':
            return prompt(`Trigger index`) || null;
        case 'moleads':
            let molead = cloneTemplate('molead');
            molead.name = prompt(`Name`);
            molead.spawnItem = prompt(`Spawn Item Reference`, 'REF:InteractablePreset|');
            return molead;
        default:
            return 'PLACEHOLDER';
    }
}