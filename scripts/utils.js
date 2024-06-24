// Funcs for DOM Generation
function fastElement(tag, DOM_class) {
	let ele = document.createElement(tag);
	if (DOM_class) ele.className = DOM_class;
	return ele;
}
function fastDiv(DOM_class) {
	if (DOM_class) {
		return fastElement("div", DOM_class)
	} else {
		return fastElement("div")
	}
}