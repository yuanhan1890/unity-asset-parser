"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var js_yaml_1 = __importDefault(require("js-yaml"));
var folder_walker_1 = __importDefault(require("folder-walker"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var json_stringify_pretty_compact_1 = __importDefault(require("json-stringify-pretty-compact"));
function main() {
    var path = '/Users/dt1234/Downloads/assets_bad_north';
    var stream = folder_walker_1.default([path]);
    var dict = {};
    stream.on('data', function (data) {
        if (data.type === 'file' && path_1.default.extname(data.filepath) === '.meta') {
            var model = js_yaml_1.default.load(fs_1.default.readFileSync(data.filepath, { encoding: 'utf-8' }));
            dict[model.guid] = path_1.default.relative(data.root, data.filepath);
        }
    });
    stream.on('end', function () {
        fs_1.default.writeFileSync('/Users/dt1234/Downloads/assets_bad_north/metaLookup.json', json_stringify_pretty_compact_1.default(dict, { maxLength: 120 }));
        console.log('done');
    });
}
main();
//# sourceMappingURL=createMetaLookup.js.map