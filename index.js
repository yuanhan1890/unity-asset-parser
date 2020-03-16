"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var js_yaml_1 = __importDefault(require("js-yaml"));
var fs_1 = __importDefault(require("fs"));
var path_1 = require("./path");
var createTree_1 = require("./createTree");
function compile(path) {
    var source = fs_1.default.readFileSync(path, { encoding: 'utf-8' });
    var objects = [];
    var test = source.split(/---\s+\!u\!(\d+)\s+\&(\d+)/g);
    for (var i = 1; i < test.length; i += 3) {
        objects.push({
            uType: test[i],
            fileID: test[i + 1],
            def: js_yaml_1.default.load(test[i + 2].replace(/(?!:fileID: )(\d+)\}/g, '"$1"}')),
        });
    }
    createTree_1.createTree(path, objects);
}
compile(path_1.scenePath);
//# sourceMappingURL=index.js.map