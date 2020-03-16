import fs from 'fs';
import pathLib from 'path';
import jsYaml from 'js-yaml';
import stringify from 'json-stringify-pretty-compact';
import { prefabPath, assetMetaLookupPath } from './path';

const guidDict: any = require(assetMetaLookupPath);

function Parse(dataPath: string) {

  const str = fs.readFileSync(prefabPath, { encoding: 'utf-8' });

  const  lines = str.split(/---\s+\!u\!(\d+)\s+\&(\d+)/g);
  const IdDict = {} as { [key in string]: any };

  for (let i = 1; i < lines.length; i += 3) {
    IdDict[lines[i + 1]] = jsYaml.load(lines[i + 2].replace(/(?!:fileID: )(\d+)\}/g, '"$1"}'));
  }

  const TopGameObjects = [] as any[];

  // console.log(Object.values);
  Object.keys(IdDict).forEach((key) => {
    const data = IdDict[key];
    if (data.GameObject) {
      const gameobject = data.GameObject;

      gameobject.__id = key;
      const components = gameobject.m_Component;

      for (let i = 0; i < components.length; i += 1) {
        const compFileId = components[i].component.fileID;

        const comp = IdDict[`${compFileId}`];

        if (comp) {
          const transform = comp.Transform || comp.RectTransform;
          if (transform) {
            if (`${transform.m_Father.fileID}` === '0') {
              TopGameObjects.push(gameobject);
            }
          }
        }
      }
    }
  });

  const tree = [] as any[];

  const gameObjects = TopGameObjects;

  for (let i = 0; i < gameObjects.length; i += 1) {
    tree.push(getGameObject(gameObjects[i]));
  }

  function getGameObject(gameObject: any) {
    const {
      __id,
      m_Component,
      m_Name,
    } = gameObject;

    const fn = [] as any[];
    const children = [] as any[];
    (m_Component || []).forEach(({ component: { fileID } }: any) => {
      const comp = IdDict[fileID];
      if (!comp) {
        return null;
      }

      const compName = Object.keys(comp)[0];

      const transform = comp.Transform || comp.RectTransform;
      if (transform) {
        const childTransforms = transform.m_Children;
        for (let i = 0; i < childTransforms.length; i += 1) {
          const childTransformId = childTransforms[i].fileID;
          const childTransform = IdDict[childTransformId];

          if (childTransform) {
            const childGameObjectId = (childTransform.Transform || childTransform.RectTransform)
              .m_GameObject.fileID;
            const childGameObject = IdDict[childGameObjectId];
            children.push(getGameObject(childGameObject.GameObject));
          }
        }
      }

      const monoBehaviour = comp.MonoBehaviour;
      if (monoBehaviour) {
        const guid = monoBehaviour.m_Script.guid;
        const script = guidDict[guid];

        fn.push({
          script,
          name: compName,
        });
      } else {
        fn.push({
          name: compName,
        });
      }
    });

    return {
      id: __id,
      fn: fn.length === 0 ? undefined : fn,
      children: children.length === 0 ? undefined : children,
      name: m_Name,
      endName: m_Name,
    };
  }

  const writeDist = pathLib.dirname(dataPath);
  const writeResultName = pathLib.basename(dataPath).replace(pathLib.extname(dataPath), '');

  fs.writeFileSync(
    pathLib.join(writeDist, `${writeResultName}.json`),
    stringify(tree, { maxLength: 120 }),
  );
}

Parse(prefabPath);
