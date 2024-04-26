window.templates = {};

window.templates.murdermanifest = {
    "version": 1,
    "enabled": true,
    "fileOrder": []
}

window.templates.moleads = {
    "name": "PLACEHOLDER",
    "compatibleWithMotives": [
        {
            "fileID": 11400000
        }
    ],
    "spawnOnPhase": 1,
    "belongsTo": 2,
    "chance": 1,
    "useTraits": 0,
    "traitModifiers": [],
    "useIf": 0,
    "ifTag": 0,
    "useOrGroup": 0,
    "orGroup": 0,
    "chanceRatio": 0,
    "itemTag": 0,
    "spawnItem": null,
    "vmailThread": null,
    "vmailProgressThreshold": {
        "x": 0,
        "y": 0
    },
    "where": 2,
    "writer": 2,
    "receiver": 2,
    "security": 0,
    "priority": 3,
    "ownershipRule": 3
}

window.templates.callingcardpool = {
    "item": null,
    "origin": 0,
    "randomScoreRange": {
        "x": 1,
        "y": 1
    },
    "traitModifiers": []
}

window.templates.murderermodifierrule = {
    "rule": 0,
    "traitList": [],
    "mustPassForApplication": 0,
    "scoreModifier": 0
}

window.templates.graffiti = {
    "preset": "REF:InteractablePreset|WallDecalObject",
    "pos": 1,
    "artImage": null,
    "ddsMessageTextList": null,
    "color": {
        "r": 0.8018868,
        "g": 0,
        "b": 0,
        "a": 1
    },
    "size": 26
}

window.templates.murdermo = {
    "name": "PLACEHOLDER",
    "type": "MurderMO",
    "notes": "PLACEHOLDER",
    "disabled": 0,
    "compatibleWith": [
        "REF:MurderPreset|SerialKiller"
    ],
    "baseDifficulty": 0,
    "pickRandomScoreRange": {
        "x": 0,
        "y": 15
    },
    "murdererTraitModifiers": [],
    "murdererJobModifiers": [],
    "murdererCompanyModifiers": [],
    "useMurdererSocialClassRange": 0,
    "murdererClassRange": {
        "x": 0,
        "y": 1
    },
    "murdererClassRangeBoost": 10,
    "useHexaco": 0,
    "hexaco": {
        "outputMin": 0,
        "outputMax": 10,
        "enableFeminineMasculine": 0,
        "feminineMasculine": 0,
        "enableHumility": 0,
        "humility": 0,
        "enableEmotionality": 1,
        "emotionality": 0,
        "enableExtraversion": 0,
        "extraversion": 0,
        "enableAgreeableness": 0,
        "agreeableness": 0,
        "enableConscientiousness": 1,
        "conscientiousness": 10,
        "enableCreativity": 0,
        "creativity": 0
    },
    "weaponsPool": [],
    "blockDroppingWeapons": 0,
    "allowAnywhere": 0,
    "allowHome": 1,
    "allowWork": 1,
    "allowPublic": 0,
    "allowStreets": 1,
    "acquaintedSuitabilityBoost": 10,
    "attractedToSuitabilityBoost": 0,
    "likeSuitabilityBoost": -3,
    "sameWorkplaceBoost": 0,
    "murdererIsTenantBoost": 0,
    "victimRandomScoreRange": {
        "x": 0,
        "y": 1
    },
    "victimTraitModifiers": [],
    "victimJobModifiers": [],
    "victimCompanyModifiers": [],
    "useVictimSocialClassRange": 1,
    "victimClassRange": {
        "x": 0,
        "y": 1
    },
    "victimClassRangeBoost": 0,
    "monkierDDSMessageList": "PLACEHOLDER",
    "MOleads": [],
    "graffiti": [],
    "callingCardPool": []
}