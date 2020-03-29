import fs from 'fs';
import pathLib from 'path';
import jsYaml from 'js-yaml';
import stringify from 'json-stringify-pretty-compact';
import walker from 'folder-walker';
import { assetPath, assetMetaLookupPath } from './path';
const guidDict: any = require(assetMetaLookupPath);

interface IWalker {
  basename: string; // "decompile-bad-north"
  filepath: string; // "/Users/dt1234/Downloads/assets_bad_north/decompile-bad-north"
  relname: string; // "decompile-bad-north"
  root: string; // "/Users/dt1234/Downloads/assets_bad_north"
  stat: any; // Stats {dev: 16777220, mode: 16877, nlink: 223, …}
  type: 'directory' | 'file';
}

function Parse(dataPath: string) {

  const str = fs.readFileSync(dataPath, { encoding: 'utf-8' });

  const lines = str.split(/---\s+\!u\!(\d+)\s+\&(\d+)/g);
  const IdDict = {} as { [key in string]: any };

  for (let i = 1; i < lines.length; i += 3) {
    IdDict[lines[i + 1]] = jsYaml.load(lines[i + 2].replace(/(?!:fileID: )(\d+)\}/g, '"$1"}'));
  }

  const TopGameObjects = [] as any[];

  // console.log(Object.values);
  Object.keys(IdDict).forEach((key) => {
    const data = IdDict[key];
    const typeKey = Object.keys(data)[0];
    data[typeKey].__id = key;
    if (data.GameObject) {
      const gameobject = data.GameObject;
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
          id: monoBehaviour.__id,
          name: compName,
          properties: monoBehaviour,
        });
      } else {
        fn.push({
          id: comp[Object.keys(comp)[0]].__id,
          name: compName,
          properties: comp[Object.keys(comp)[0]],
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
    stringify({ name: writeResultName, children: tree }, { maxLength: 120 }),
  );
}

function main() {
  const path = assetPath;
  const stream = walker([path]);

  const dict: any = {};

  console.log('start');

  stream.on('data', (data: IWalker) => {
    if (data.type === 'file') {
      const extname = pathLib.extname(data.filepath);
      if (extname === '.unity' || extname === '.prefab') {
        console.log('begin: ' + data.filepath);
        Parse(data.filepath);
        console.log('complete: ' + data.filepath);
      }
    }
  });

  stream.on('end', () => {
    fs.writeFileSync(assetMetaLookupPath, stringify(dict, { maxLength: 120 }));
    console.log('done');
  });
}

main();
