function addTreeElement(thisTreeCount, path, parent, editorCallbacks) {
    deleteTree(thisTreeCount);

    window.maxTreeCount = thisTreeCount;

    const div = document.createElement("div");
    div.id = "file-window-" + thisTreeCount;
    div.className = "file-window";
    parent.appendChild(div);

    const jsontreeEle = document.createElement("div");
    jsontreeEle.id = "jsontree-container_" + thisTreeCount;
    jsontreeEle.className = "jsontree-container";
    div.appendChild(jsontreeEle);

    const titleEle = document.createElement("div");
    titleEle.className = "doc-title";
    titleEle.innerText = path;
    div.appendChild(titleEle);

    const closeCross = document.createElement("div");
    closeCross.innerText = "❌";
    closeCross.className = "close-button";
    closeCross.addEventListener('click', () => {
        deleteTree(thisTreeCount);
    })
    div.appendChild(closeCross);

    // Editor bar
    const editorBar = document.createElement("div");
    editorBar.className = "editor-bar";
    jsontreeEle.appendChild(editorBar);

    const saveChanges = document.createElement("button");
    saveChanges.innerText = "Save";
    saveChanges.addEventListener('click', () => editorCallbacks.save(true))
    editorBar.appendChild(saveChanges);

    const copySource = document.createElement("button");
    copySource.innerText = "Copy Source";
    copySource.addEventListener('click',editorCallbacks.copySource)
    editorBar.appendChild(copySource);

    return jsontreeEle;
}

function deleteTree(thisTreeCount) {
    for (var i = thisTreeCount; i <= window.maxTreeCount; i++) {
        document.getElementById("file-window-" + i)?.remove()
    }

    window.maxTreeCount = thisTreeCount - 1;
}

function getJSONPointer(node) {
    if (node.isRoot) {
        return "";
    }

    return getJSONPointer(node.parent) + "/" + node.label;
}

function createSOSelectElement(domNode, options, selectedSO, onUpdateCallback) {
    var selectedOptionMatch = selectedSO.match(/REF.*\|([\w-]+).*/);
    var selectedOption = selectedOptionMatch ? options.indexOf(selectedOptionMatch[1]) : -1;

    var createdNodes = createEnumSelectElement(domNode, options, selectedOption, true, onUpdateCallback);

    createdNodes.selectedCustomOption.text = `Custom: ${selectedSO.replace(/"/g, "").replace("REF:", "").replace(/\w+\|/, '').trim()}`;

    return createdNodes;
}

function createEnumSelectElement(domNode, options, selectedIndex, allowCustom, onUpdateCallback) {
    //Create and append select list
    let selectList = document.createElement("select");
    domNode.replaceChildren(selectList);

    let selectedCustomOption;

    if(allowCustom) {
        var option = document.createElement("option");
        
        option.value = -2;
        option.text = "Custom...";
        option.selected = -2 == selectedIndex;

        selectedCustomOption = document.createElement("option");
        selectedCustomOption.value = -1;
        selectedCustomOption.text = "Custom:";
        selectedCustomOption.selected = -1 == selectedIndex;
        selectedCustomOption.style.display = -1 == selectedIndex ? "block" : "none";

        selectList.appendChild(option);
        selectList.appendChild(selectedCustomOption);

        if(selectedIndex == -1)
        {
            var linkButton = document.createElement("span");
            linkButton.innerText = "➥";
            linkButton.addEventListener('click', () => {
                const refPath = selectedCustomOption.text.replace("Custom:", "").trim();
                loadFile(refPath);
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

    selectList.addEventListener('change', async (e) => {
        let newCustomValue;
        if(e.target.value == -2)
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