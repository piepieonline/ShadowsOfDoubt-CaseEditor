async function refreshModList() {
    let mods = [];
    for await (const entry of window.dirHandleModDir.values()) {
        if (entry.kind === "directory") {
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
        createFileIfNotExisting('murdermanifest');
    }

    return modFolders;
}

function cloneTemplate(template) {
    return JSON.parse(JSON.stringify(window.templates[template]))
}

async function createNewFile(type) {
    async function createNewFileImpl(folderHandle, callback) {
        let guid = crypto.randomUUID();
        let newHandle = await getFile(folderHandle, [guid + ".sodso.json"], true);

        let newContent = cloneTemplate(type);

        newContent.id = guid;

        await callback(newContent);

        await writeFile(newHandle, JSON.stringify(newContent));

        return guid;
    }

    switch (type) {
        case 'murdermanifest':
            return createNewFileImpl(window.selectedMod.baseFolder, async newContent => {

            });
    }
}

async function createFileIfNotExisting(type) {
    let handle, filename, contentType;

    switch(type) {
        case 'newspaper':
            handle = window.selectedMod.messages;
            filename = [`${guid}.newspaper`];
            contentType = 'newspaper';
            break;
        default:
            throw 'Not implemented'
    }

    let file = await tryGetFile(window.selectedMod.baseFolder, type)
    if(!file)
    {
        file = await getFile(handle, filename, true);
        await writeFile(file, JSON.stringify(cloneTemplate(contentType)));
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