async function refreshModList() {
    let mods = [];
    for await (const entry of window.dirHandleModDir.values()) {
        if (entry.kind === "directory" && entry.name !== '.git') {
            mods.push(await openModFolder(entry.name, false));
        }
    }
    return mods;
}

async function openModFolder(modName, create) {
    let modFolders = { modName };

    modFolders.baseFolder = await tryGetFolder(window.dirHandleModDir, [modName], create)

    if(create)
    {
        await createFileIfNotExisting(modName, 'MurderMO', modFolders.baseFolder, (content) => {
            content.name = modName;
            content.presetName = modName;
            content.notes = modName;
            content.copyFrom = null;
            return content;
        });
        await createFileIfNotExisting('murdermanifest', 'MurderManifest', modFolders.baseFolder, (content) => {
            content.fileOrder.push(`REF:${modName.toLowerCase()}`);
            return content;
        });
    }

    return modFolders;
}

function cloneTemplate(template) {
    var templateToClone = window.templates[template];
    if(!templateToClone)
    {
        function remapTemplate(obj)
        {
            let keys = Object.keys(obj);
            for(let i = 0; i < keys.length; i++)
            {
                let childType = obj[keys[i]].Item1;
                let isArray = obj[keys[i]].Item2;

                let newVal = JSON.parse(JSON.stringify(window.basicTypes[childType] ?? childType));
                
                if(newVal === childType && !(childType in window.typeMap) && !(childType in window.enums))
                {
                    console.warn(`TypeMap is missing: ${childType}`);
                }

                if(isArray) {
                    newVal = [];
                }
                else if(childType in window.typeMap)
                {
                    newVal = `REF:${childType}|${window.typeMap[childType][0]}`;
                }

                obj[keys[i]] = newVal;
            }

            return obj;
        }

        templateToClone = remapTemplate(JSON.parse(JSON.stringify(window.typeLayout[template])));
    }
    return JSON.parse(JSON.stringify(templateToClone));
}

async function createFileIfNotExisting(fileName, type, handle, newFileContentCallback) {
    let contentType;

    filename = [`${fileName}.sodso.json`];
    contentType = type;

    let file = await tryGetFile(handle, type)
    if(!file)
    {
        file = await getFile(handle, filename, true);
        let newContentTemplate = cloneTemplate(contentType);
        if(type !== 'MurderManifest') {
            newContentTemplate.fileType = type;
        }
        let newContent = newFileContentCallback(newContentTemplate);
        await writeFile(file, JSON.stringify(newContent));
    }
}

function makeNameFieldSafe(name) {
    return name.replaceAll(/[^a-zA-Z0-9\-]/g, "");
}

function makeCSVSafe(line) {
    line = line.replace(/\\/g, '\\\\');

    // Allow double quoted for included commas etc
    if (line.includes(",")) {
        line = '\\"' + line + '\\"';
    }

    line = '"' + line + '"';

    return line;
}