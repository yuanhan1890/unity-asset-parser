"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var js_yaml_1 = __importDefault(require("js-yaml"));
var json_stringify_pretty_compact_1 = __importDefault(require("json-stringify-pretty-compact"));
var folder_walker_1 = __importDefault(require("folder-walker"));
var path_2 = require("./path");
var guidDict = require(path_2.assetMetaLookupPath);
function Parse(dataPath) {
    var str = fs_1.default.readFileSync(dataPath, { encoding: 'utf-8' });
    var lines = str.split(/---\s+\!u\!(\d+)\s+\&(\d+)/g);
    var IdDict = {};
    for (var i = 1; i < lines.length; i += 3) {
        IdDict[lines[i + 1]] = js_yaml_1.default.load(lines[i + 2].replace(/(?!:fileID: )(\d+)\}/g, '"$1"}'));
    }
    var TopGameObjects = [];
    var fileIdMapper = {};
    // console.log(Object.values);
    Object.keys(IdDict).forEach(function (key) {
        var data = IdDict[key];
        var typeKey = Object.keys(data)[0];
        data[typeKey].__id = key;
        if (data.GameObject) {
            var gameobject = data.GameObject;
            var components = gameobject.m_Component;
            for (var i = 0; i < components.length; i += 1) {
                var compFileId = components[i].component.fileID;
                var comp = IdDict["" + compFileId];
                if (comp) {
                    var transform = comp.Transform || comp.RectTransform;
                    if (transform) {
                        if ("" + transform.m_Father.fileID === '0') {
                            TopGameObjects.push(gameobject);
                        }
                    }
                }
            }
        }
    });
    var tree = [];
    var gameObjects = TopGameObjects;
    for (var i = 0; i < gameObjects.length; i += 1) {
        tree.push(getGameObject(gameObjects[i], []));
    }
    function getGameObject(gameObject, parent) {
        var __id = gameObject.__id, m_Component = gameObject.m_Component, m_Name = gameObject.m_Name;
        var fn = [];
        var children = [];
        var newParent = parent.slice();
        newParent.push(m_Name);
        (m_Component || []).forEach(function (_a) {
            var fileID = _a.component.fileID;
            var comp = IdDict[fileID];
            if (!comp) {
                return null;
            }
            var compName = Object.keys(comp)[0];
            var transform = comp.Transform || comp.RectTransform;
            if (transform) {
                var childTransforms = transform.m_Children;
                for (var i = 0; i < childTransforms.length; i += 1) {
                    var childTransformId = childTransforms[i].fileID;
                    var childTransform = IdDict[childTransformId];
                    if (childTransform) {
                        var childGameObjectId = (childTransform.Transform || childTransform.RectTransform)
                            .m_GameObject.fileID;
                        var childGameObject = IdDict[childGameObjectId];
                        children.push(getGameObject(childGameObject.GameObject, newParent));
                    }
                }
            }
            var monoBehaviour = comp.MonoBehaviour;
            if (monoBehaviour) {
                var guid = monoBehaviour.m_Script.guid;
                var script = guidDict[guid];
                fn.push({
                    script: script,
                    id: monoBehaviour.__id,
                    name: compName,
                    properties: monoBehaviour,
                    loc: newParent.join(' > ') + (" > [" + compName + "]"),
                });
                fileIdMapper[monoBehaviour.__id] = newParent.join(' > ') + (" > [" + compName + "]");
            }
            else {
                fn.push({
                    id: comp[Object.keys(comp)[0]].__id,
                    name: compName,
                    properties: comp[Object.keys(comp)[0]],
                    loc: newParent.join(' > ') + (" > [" + compName + "]"),
                });
                fileIdMapper[comp[Object.keys(comp)[0]].__id] = newParent.join(' > ') + (" > [" + compName + "]");
            }
        });
        var result = {
            id: __id,
            fn: fn.length === 0 ? undefined : fn,
            children: children.length === 0 ? undefined : children,
            name: m_Name,
            endName: m_Name,
            loc: newParent.join(' > '),
        };
        fileIdMapper[result.id] = result.loc;
        return result;
    }
    function resolveFildId(object) {
        if (Array.isArray(object)) {
            object.forEach(function (child) {
                resolveFildId(child);
            });
            return;
        }
        if (typeof object === 'object' && object) {
            var keys = Object.keys(object);
            for (var i = 0; i < keys.length; i += 1) {
                var key = keys[i];
                var value = object[key];
                if (key === 'fileID') {
                    var loc = fileIdMapper[value];
                    if (loc) {
                        object.fileID = { id: value, loc: loc };
                    }
                }
                else if (key === 'guid') {
                    var loc = guidDict[value];
                    if (loc) {
                        object.guid = { guid: value, loc: loc };
                    }
                }
                else if (typeof value !== 'string') {
                    resolveFildId(value);
                }
            }
            return;
        }
    }
    var writeDist = path_1.default.dirname(dataPath);
    var writeResultName = path_1.default.basename(dataPath).replace(path_1.default.extname(dataPath), '');
    resolveFildId(tree);
    fs_1.default.writeFileSync(path_1.default.join(writeDist, writeResultName + ".json"), json_stringify_pretty_compact_1.default({ name: writeResultName, children: tree }, { maxLength: 120 }));
}
function main() {
    var path = path_2.assetPath;
    var stream = folder_walker_1.default([path]);
    var dict = {};
    console.log('start');
    stream.on('data', function (data) {
        if (data.type === 'file') {
            var extname = path_1.default.extname(data.filepath);
            if (extname === '.unity' || extname === '.prefab') {
                console.log('begin: ' + data.filepath);
                Parse(data.filepath);
                console.log('complete: ' + data.filepath);
            }
        }
    });
    stream.on('end', function () {
        console.log('done');
    });
}
main();
//# sourceMappingURL=createPrefab.js.map