async function getModDir() {
    let modPath = await idbKeyval.get('ModPath');
    let options = modPath ? { startIn: modPath, mode: 'readwrite' } : { mode: 'readwrite' };
    window.dirHandleModDir = await window.showDirectoryPicker(options);
    await idbKeyval.set('ModPath', window.dirHandleModDir);
}

async function getFile(handle, path, create) {
    if (path.length == 1) {
        return await (await handle.getFileHandle(path[0], { create }));
    }
    else {
        var folder = path.splice(0, 1)[0];
        return getFile(await handle.getDirectoryHandle(folder), path, create);
    }
}

async function tryGetFile(handle, path, create) {
    try {
        return await getFile(handle, path, create)
    }
    catch
    {
        return null;
    }
}

async function getFolder(handle, path, create) {
    if (path.length == 1) {
        return await handle.getDirectoryHandle(path[0], { create });
    }
    else {
        var folder = path.splice(0, 1)[0];
        return getFolder(await handle.getDirectoryHandle(folder, { create }), path, create);
    }
}

async function tryGetFolder(handle, path, create) {
    try {
        return await getFolder(handle, path, create)
    }
    catch
    {
        return null;
    }
}

async function writeFile(fileHandle, contents, append) {
    const writeable = await fileHandle.createWritable({ keepExistingData: append });

    if (append) {
        let offset = (await fileHandle.getFile()).size;
        writeable.seek(offset);
        if(offset === 0) {
            contents = contents.trim();
        }
    }

    await writeable.write(contents);
    await writeable.close();
}
