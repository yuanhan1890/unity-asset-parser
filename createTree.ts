const fs = require('fs');
const stringify = require('json-stringify-pretty-compact');
// const jsYaml = require('js-yaml');
const get = require('lodash/get');
const data: any = require('/Users/dt1234/Downloads/assets_bad_north/TowerDefense.json');
const Avl = require('avl');

const ObjectById = new Avl();
const GameObjectById = new Avl();

data.forEach(({ uType, fileID, def }: any, index: number) => {
  const id = fileID;
  ObjectById.insert(id, index);

  if (!!get(def, 'GameObject', false)) {
    GameObjectById.insert(id, index);
  }
});

const stack: any[] = [];

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

const dict: { [key in string]: { children: any[]; fn: any[], father: any, transform: any } } = {};

GameObjectById.forEach((node: any) => {
  dict[node.key] = dict[node.key] || {
    children: [],
    fn: [],
    transform: null,
    father: 0,
  };

  const { def } = data[node.data];
  const components = get(def, 'GameObject.m_Component', []);

  components.forEach((comp: any) => {
    const fileId = get(comp, 'component.fileID') + '';

    // 寻找transform
    const compData = ObjectById.find(fileId);
    const { def: compDef } = data[compData.data];
    if (compDef.Transform || compDef.RectTransform) {
      let fatherID = get(compDef, 'Transform.m_Father.fileID');
      if (fatherID === undefined) {
        fatherID = get(compDef, 'RectTransform.m_Father.fileID');
      }

      dict[node.key].father = fatherID + '';
      dict[node.key].transform = compData.key;
      let transformChild = get(compDef, 'Transform.m_Children');
      if (!transformChild) {
        transformChild = get(compDef, 'RectTransform.m_Children');
      }

      transformChild.forEach(({ fileID: transformChildFileID }: any) => {
        const transformDef = data[ObjectById.find(transformChildFileID + '').data].def;
        let id = get(transformDef, 'Transform.m_GameObject.fileID');
        if (id === undefined) {
          id = get(transformDef, 'RectTransform.m_GameObject.fileID');
        }
        dict[node.key].children.push(id + '');
      });
    } else {
      dict[node.key].fn.push(fileId);
    }
  });
});

const rootGameObjectKeys = Object.keys(dict).filter((key) => {
  return dict[key].father === '0';
});

function getName(key: string) {
  return data[ObjectById.find(key).data].def.GameObject.m_Name;
}

function constructTree(keys: string[]) {
  const tree: any[] = [];
  keys.forEach((key) => {
    tree.push({
      children: recur(key),
      name: getName(key),
      id: key,
      fn: dict[key].fn,
    });
  });

  return tree;
}

function recur(key: string): any {
  return dict[key].children.map((key: string) => {
    return {
      children: recur(key),
      name: getName(key),
      id: key,
      fn: dict[key].fn,
    };
  });
}

const Tree = constructTree(rootGameObjectKeys);

fs.writeFileSync('/Users/dt1234/Downloads/assets_bad_north/TowerDefenseScene.json', stringify(Tree));
// fs.writeFileSync('/Users/dt1234/Downloads/assets_bad_north/TowerDefenseScene.yaml', jsYaml.dump(Tree));
