import jsYaml from 'js-yaml';
import fs from 'fs';

const path = '/Users/dt1234/Downloads/assets_bad_north/BadNorth/Assets/Scene/Modules/TowerDefense.unity';
// const path = '/Users/dt1234/Desktop/index.unity';
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

fs.writeFileSync('/Users/dt1234/Downloads/assets_bad_north/TowerDefense.json', JSON.stringify(objects), {
  encoding: 'utf-8',
});
