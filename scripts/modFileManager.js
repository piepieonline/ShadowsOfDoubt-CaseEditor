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
        await createFileIfNotExisting(modName, 'murdermo', modFolders.baseFolder, (content) => {
            content.name = modName;
            content.notes = modName;
            return content;
        });
        await createFileIfNotExisting('murdermanifest', 'murdermanifest', modFolders.baseFolder, (content) => {
            content.fileOrder.push(`REF:${modName.toLowerCase()}`);
            return content;
        });
    }

    return modFolders;
}

function cloneTemplate(template) {
    return JSON.parse(JSON.stringify(window.templates[template]))
}

async function createFileIfNotExisting(fileName, type, handle, newFileContentCallback) {
    let contentType;

    filename = [`${fileName}.sodso.json`];
    contentType = type;

    let file = await tryGetFile(handle, type)
    if(!file)
    {
        file = await getFile(handle, filename, true);
        let newContent = newFileContentCallback(cloneTemplate(contentType));
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