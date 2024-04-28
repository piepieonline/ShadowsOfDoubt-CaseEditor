import templates from './ref/templates.json' assert { type: 'json' };
import soChildTypes from './ref/soChildTypes.json' assert { type: 'json' };
import soMap from './ref/soMap.json' assert { type: 'json' };

window.templates = templates;

window.typeMap = {
    ...soMap["ScriptableObject"]
};

window.enums = {
    Boolean: [
        'false',
        'true'
    ],
    ...soMap["Enum"]
};

window.typeLayout = {
    Manifest: {},
    ...soChildTypes
};