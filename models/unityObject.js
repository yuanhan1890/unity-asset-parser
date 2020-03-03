"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UnityObject = /** @class */ (function () {
    function UnityObject(props) {
        var _this = this;
        this.body = null;
        this.addBody = function (body) {
            _this.body = body;
        };
        this.props = props;
    }
    UnityObject.tryParseUnityObject = function (source) {
        var matchResult = /^--- \!u\!(\d+) \&(\d+)/.exec(source);
        if (!matchResult) {
            return;
        }
        return new UnityObject({
            uType: matchResult[1],
            fileID: matchResult[2],
        });
    };
    UnityObject.tryParseUnityObjects = function (source) {
        var objects = source.split(/^--- \!u\!(\d+) \&(\d+)/);
    };
    return UnityObject;
}());
exports.UnityObject = UnityObject;
//# sourceMappingURL=unityObject.js.map