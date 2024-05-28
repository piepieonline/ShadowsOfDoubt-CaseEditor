const fs = require('fs');

/**
 * Generates Github wiki content for the custom descriptions. Used on https://github.com/piepieonline/ShadowsOfDoubt-CaseEditor/wiki/ScriptableObject-field-descriptions
 * Run with `node GHWiki_SODescriptions.js`
 */

fs.readFile('../scripts/soCustomDescriptions.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading JSON file:', err);
        return;
    }

    try {
        const objects = JSON.parse(data);

        // Generate Markdown summary
        let markdown = '';
        for (const key in objects) {
            if (objects.hasOwnProperty(key)) {
                markdown += `<details>\n<summary>${key}</summary>\n<ul>`;
                const innerObj = objects[key];
                for (const innerKey in innerObj) {
                    if (innerObj.hasOwnProperty(innerKey) && innerObj[innerKey] !== '') {
                        markdown += `<li>\`${innerKey}\`: ${innerObj[innerKey]}</li>`;
                    }
                }
                markdown += `</ul></details>\n`;
            }
        }

        // Write Markdown summary to file
        console.log(markdown)
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});