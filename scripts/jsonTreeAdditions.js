function addTreeElement(path, parent, editorCallbacks) {
    let selectorSafePath = path.replace(/\//g, '_').replace('.json', '');

    if(document.querySelector(`#file-window-${selectorSafePath}`) !== null) return false;

    const div = document.createElement("div");
    div.className = "file-window";
    div.id = `file-window-${selectorSafePath}`;
    parent.appendChild(div);

    const jsontreeEle = document.createElement("div");
    jsontreeEle.className = "jsontree-container";
    div.appendChild(jsontreeEle);

    const titleEle = document.createElement("div");
    titleEle.className = "doc-title";
    titleEle.innerText = path;
    div.appendChild(titleEle);

    if(path !== 'murdermanifest') {
        const closeCross = document.createElement("div");
        closeCross.innerText = "❌";
        closeCross.className = "close-button";
        closeCross.addEventListener('click', () => {
            deleteTree(div);
        })
        div.appendChild(closeCross);
    }

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
    inputElement.disabled = readOnly;
    inputElement.setAttribute('size', Math.max(initialValue.length, 5));
    inputElement.addEventListener('input', (e) => {
        e.target.setAttribute('size', Math.max(e.target.value.length, 5));
    });
    domNode.replaceChildren(inputElement);

    inputElement.addEventListener('blur', async (e) => {
        if(initialValue != e.target.value)
        {
            onUpdateCallback(e.target.value);
        }
    });
}

function createSOSelectElement(domNode, options, selectedSO, readOnly, onUpdateCallback) {
    var selectedOptionMatch = selectedSO.match(/REF.*\|([\w-]+).*/);
    var selectedOption = selectedOptionMatch ? options.indexOf(selectedOptionMatch[1]) : -1;

    var createdNodes = createEnumSelectElement(domNode, options, selectedOption, true, readOnly, onUpdateCallback);

    createdNodes.selectedCustomOption.text = `Custom: ${selectedSO.replace(/"/g, "").replace("REF:", "").replace(/\w+\|/, '').trim()}`;

    // $(domNode).find('select').select2(); //Search in Select

    return createdNodes;
}

function createEnumSelectElement(domNode, options, selectedIndex, allowCustom, readOnly, onUpdateCallback) {
    //Create and append select list
    let selectList = document.createElement("select");
    domNode.replaceChildren(selectList);

    let selectedCustomOption;

    selectList.disabled = readOnly;

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
                loadFile(refPath, false);
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