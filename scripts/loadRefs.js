import templates from './ref/templates.json' with { type: 'json' };
import soChildTypes from './ref/soChildTypes.json' with { type: 'json' };
import soMap from './ref/soMap.json' with { type: 'json' };

window.templates = {
    MurderManifest: {
        enabled: true,
        fileOrder: [],
        version: 1
    },
    ...templates
};

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
    Manifest: {
        fileOrder: {
            "Item1": "FileType",
            "Item2": true
          }
    },
    ...soChildTypes
};

window.basicTypes = {
    Int32: 0,
    Single: 0,
    Boolean: false,
    String: "",
    Vector2: { x: 0, y: 0 },
    Vector3: { x: 0, y: 0, z: 0 }
};