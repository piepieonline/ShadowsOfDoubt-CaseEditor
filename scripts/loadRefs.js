import templates from './ref/templates.json' with { type: 'json' };
import soChildTypes from './ref/soChildTypes.json' with { type: 'json' };
import soMap from './ref/soMap.json' with { type: 'json' };

import soCustomDescriptions from './soCustomDescriptions.json' with { type: 'json' };

window.basicTypeLayouts = {
    Vector2: {
        x: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        y: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        }
    },
    Vector2Int: {
        x: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        y: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        }
    },
    Vector3: {
        x: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        y: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        z: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        }
    },
    Vector3Int: {
        x: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        y: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        z: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        }
    },
    AnimationCurve: {
        serializedVersion: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        m_Curve: {
            "Item1": "AnimationCurve.Keyframe",
            "Item2": true,
            "Item3": ""
        },
        m_PreInfinity: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        m_PostInfinity: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        m_RotationOrder: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        }
    },
    "AnimationCurve.Keyframe": {
        inTangent: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        inWeight: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        outTangent: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        outWeight: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        time: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        value: {
            "Item1": "Single",
            "Item2": false,
            "Item3": ""
        },
        weightedMode: {
            "Item1": "WeightedMode",
            "Item2": false,
            "Item3": ""
        },
    }
};

window.templates = {
    MurderManifest: {
        enabled: true,
        fileOrder: [],
        version: 1
    },
    "AnimationCurve.Keyframe": {
        inTangent: 0,
        inWeight: 0,
        outTangents: 0,
        outWeight: 0,
        time: 0,
        value: 0,
        weightedMode: 0
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
    WeightedMode: [
        'None',
        'In',
        'Out',
        'Both'
    ],
    ...soMap["Enum"]
};

window.typeLayout = {
    Manifest: {
        fileOrder: {
            "Item1": "FileType", // Type of the field
            "Item2": true, // Is it an array?
            "Item3": "" // Description
        }
    },
    ...window.basicTypeLayouts,
    ...soChildTypes
};

window.basicTypeTemplates = {
    Int32: 0,
    Single: 0,
    Boolean: false,
    String: "",
    Vector2: { x: 0, y: 0 },
    Vector3: { x: 0, y: 0, z: 0 }
};

window.pathIdMap = Object.keys(soMap["IDMap"]).reduce((map, val) => {
    map[val] = soMap["IDMap"][val][0];
    return map;
}, {});

window.soCustomDescriptions = soCustomDescriptions;

window.updateAssetModel(true);