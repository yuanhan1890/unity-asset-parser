"use strict";
var fs = require('fs');
var stringify = require('json-stringify-pretty-compact');
// const jsYaml = require('js-yaml');
var get = require('lodash/get');
var data = require('/Users/dt1234/Downloads/assets_bad_north/TowerDefense.json');
var Avl = require('avl');
var ObjectById = new Avl();
var GameObjectById = new Avl();
data.forEach(function (_a, index) {
    var uType = _a.uType, fileID = _a.fileID, def = _a.def;
    var id = fileID;
    ObjectById.insert(id, index);
    if (!!get(def, 'GameObject', false)) {
        GameObjectById.insert(id, index);
    }
});
var stack = [];
// GameObjectById.forEach((node: any) => {
//   const { def } = data[node.data];
//   // if (`${get(def, 'GameObject.m_Father.fileID')}` === '0') {
//   //   stack.push(def);
//   // }
//   const components = get(def, 'GameObject.m_Component', []);
//   components.some((comp: any) => {
//     const fileId = get(comp, 'component.fileID');
//     const compData = TransformById.find(`${fileId}`);
//     if (compData) {
//       const { def: compDef } = data[compData.data];
//       let index = get(compDef, 'Transform.m_Father.fileID');
//       if (index === undefined) {
//         index = get(compDef, 'RectTransform.m_Father.fileID');
//       }
//       if (index === 0) {
//         stack.push(node.key);
//       }
//     }
//   });
// });
var dict = {};
GameObjectById.forEach(function (node) {
    dict[node.key] = dict[node.key] || {
        children: [],
        fn: [],
        transform: null,
        father: 0,
    };
    var def = data[node.data].def;
    var components = get(def, 'GameObject.m_Component', []);
    components.forEach(function (comp) {
        var fileId = get(comp, 'component.fileID') + '';
        // 寻找transform
        var compData = ObjectById.find(fileId);
        var compDef = data[compData.data].def;
        if (compDef.Transform || compDef.RectTransform) {
            var fatherID = get(compDef, 'Transform.m_Father.fileID');
            if (fatherID === undefined) {
                fatherID = get(compDef, 'RectTransform.m_Father.fileID');
            }
            dict[node.key].father = fatherID + '';
            dict[node.key].transform = compData.key;
            var transformChild = get(compDef, 'Transform.m_Children');
            if (!transformChild) {
                transformChild = get(compDef, 'RectTransform.m_Children');
            }
            transformChild.forEach(function (_a) {
                var transformChildFileID = _a.fileID;
                var transformDef = data[ObjectById.find(transformChildFileID + '').data].def;
                var id = get(transformDef, 'Transform.m_GameObject.fileID');
                if (id === undefined) {
                    id = get(transformDef, 'RectTransform.m_GameObject.fileID');
                }
                dict[node.key].children.push(id + '');
            });
        }
        else {
            dict[node.key].fn.push(fileId);
        }
    });
});
var rootGameObjectKeys = Object.keys(dict).filter(function (key) {
    return dict[key].father === '0';
});
function getName(key) {
    return data[ObjectById.find(key).data].def.GameObject.m_Name;
}
function constructTree(keys) {
    var tree = [];
    keys.forEach(function (key) {
        tree.push({
            children: recur(key),
            name: getName(key),
            id: key,
            fn: dict[key].fn,
        });
    });
    return tree;
}
function recur(key) {
    return dict[key].children.map(function (key) {
        return {
            children: recur(key),
            name: getName(key),
            id: key,
            fn: dict[key].fn,
        };
    });
}
var Tree = constructTree(rootGameObjectKeys);
fs.writeFileSync('/Users/dt1234/Downloads/assets_bad_north/TowerDefenseScene.json', stringify(Tree));
// fs.writeFileSync('/Users/dt1234/Downloads/assets_bad_north/TowerDefenseScene.yaml', jsYaml.dump(Tree));
//# sourceMappingURL=createTree.js.map