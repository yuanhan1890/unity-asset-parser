import jsYaml from 'js-yaml';
import fs from 'fs';
import { scenePath } from './path';
import { createTree } from './createTree';

function compile(path: string) {

  const source = fs.readFileSync(path, { encoding: 'utf-8' });
  const objects: any[] = [];

  const test = source.split(/---\s+\!u\!(\d+)\s+\&(\d+)/g);

  for (let i = 1; i < test.length; i += 3) {
    objects.push({
      uType: test[i],
      fileID: test[i + 1],
      def: jsYaml.load(test[i + 2]),
    });
  }

  createTree(path, objects);
}

compile(scenePath);
