import jsYaml from 'js-yaml';
import walker from 'folder-walker';
import pathLib from 'path';
import fs from 'fs';
import stringify from 'json-stringify-pretty-compact';

interface IWalker {
  basename: string; // "decompile-bad-north"
  filepath: string; // "/Users/dt1234/Downloads/assets_bad_north/decompile-bad-north"
  relname: string; // "decompile-bad-north"
  root: string; // "/Users/dt1234/Downloads/assets_bad_north"
  stat: any; // Stats {dev: 16777220, mode: 16877, nlink: 223, …}
  type: 'directory' | 'file';
}

function main() {

  const path = '/Users/dt1234/Downloads/assets_bad_north';
  const stream = walker([path]);

  const dict: any = {};

  stream.on('data', (data: IWalker) => {
    if (data.type === 'file' && pathLib.extname(data.filepath) === '.meta') {
      const model = jsYaml.load(fs.readFileSync(data.filepath, { encoding: 'utf-8' }));
      dict[model.guid] = pathLib.relative(data.root, data.filepath);
    }
  });

  stream.on('end', () => {
    fs.writeFileSync('/Users/dt1234/Downloads/assets_bad_north/metaLookup.json', stringify(dict, { maxLength: 120 }));
    console.log('done');
  });
}

main();
