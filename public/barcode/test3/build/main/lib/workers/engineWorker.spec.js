"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
/* tslint:disable:no-implicit-dependencies */
/**
 * BarcodePicker tests
 */
var ava_1 = tslib_1.__importDefault(require("ava"));
var crypto_1 = tslib_1.__importDefault(require("crypto"));
var fake_indexeddb_1 = tslib_1.__importDefault(require("fake-indexeddb"));
var fs_1 = tslib_1.__importDefault(require("fs"));
var node_fetch_1 = require("node-fetch");
var sinon = tslib_1.__importStar(require("sinon"));
var source_map_support_1 = tslib_1.__importDefault(require("source-map-support"));
var imageSettings_1 = require("../imageSettings");
var parser_1 = require("../parser");
var scanSettings_1 = require("../scanSettings");
var engineWorker_1 = require("./engineWorker");
source_map_support_1.default.install();
function wait(ms) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    // tslint:disable-next-line no-string-based-set-timeout
                    setTimeout(resolve, ms);
                })];
        });
    });
}
var moduleInstance;
Object.defineProperty(self, "window", {
    writable: true
});
Object.defineProperty(self, "document", {
    writable: true
});
global.self = global;
global.crypto = {
    subtle: {
        digest: function (_, data) {
            return Promise.resolve(crypto_1.default
                .createHash("sha256")
                .update(new DataView(data))
                .digest());
        }
    }
};
global.fetch = function (filePath) {
    return new Promise(function (resolve, reject) {
        filePath = filePath.split("?")[0];
        // tslint:disable-next-line:non-literal-fs-path
        if (!fs_1.default.existsSync(filePath)) {
            reject(new Error("File not found: " + filePath));
        }
        // tslint:disable-next-line:non-literal-fs-path
        var readStream = fs_1.default.createReadStream(filePath, {
            highWaterMark: 4194304
        });
        readStream.on("open", function () {
            resolve(new node_fetch_1.Response(readStream));
        });
    });
};
function setupSpyModuleFunctions(m) {
    m.HEAPU8 = new Uint8Array(1);
    m.HEAPU8.set = function (a, p) {
        p.a = a;
    };
    m.lengthBytesUTF8 = sinon.spy();
    m.UTF8ToString = sinon.spy(function (p) {
        return p.s;
    });
    m.stringToUTF8 = sinon.spy(function (s, p) {
        p.s = s;
    });
    m._malloc = sinon.spy(function () {
        return {};
    });
    m._free = sinon.spy();
    m._create_context = sinon.spy();
    m._scanner_settings_new_from_json = sinon.spy(function (p) {
        // Mock invalid config
        if (p.s === JSON.stringify({})) {
            return {
                s: ""
            };
        }
        return {
            s: JSON.stringify({})
        };
    });
    m._scanner_image_settings_new = sinon.spy();
    m._scanner_session_clear = sinon.spy();
    m._scanner_scan = sinon.spy(function (imageData) {
        // Mock error
        if (imageData.a[0] === 255) {
            return {
                s: JSON.stringify({
                    error: {
                        errorCode: 1,
                        errorMessage: "Error."
                    }
                })
            };
        }
        return {
            s: JSON.stringify({ scanResult: [] })
        };
    });
    m._parser_parse_string = sinon.spy(function (parserType) {
        // Mock error
        if (parserType === -1) {
            return {
                s: JSON.stringify({
                    error: {
                        errorCode: 1,
                        errorMessage: "Error."
                    }
                })
            };
        }
        return {
            s: JSON.stringify({ result: { x: "y" } })
        };
    });
    m.callMain = sinon.spy();
}
global.importScripts = function (filePath) {
    filePath = filePath.split("?")[0];
    // tslint:disable-next-line:non-literal-fs-path
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error("File not found: " + filePath);
    }
    moduleInstance = self.Module;
    setupSpyModuleFunctions(moduleInstance);
    return new Promise(function (resolve) {
        // Retrieve wasmJSVersion variable
        // tslint:disable-next-line:non-literal-fs-path
        var readStream = fs_1.default.createReadStream(filePath, { encoding: "utf8" });
        readStream.on("readable", function () {
            var dataString = "";
            var character = readStream.read(1);
            while (character !== ";") {
                dataString += character;
                character = readStream.read(1);
            }
            readStream.destroy();
            var regexMatch = dataString.match(/"(.+)"/);
            if (regexMatch != null) {
                self.wasmJSVersion = regexMatch[1];
            }
            moduleInstance.instantiateWasm({ env: {} }, function () {
                moduleInstance.preRun();
                resolve();
            });
        });
    });
};
global.indexedDB = fake_indexeddb_1.default;
global.FS = {
    mkdir: sinon.spy(),
    mount: sinon.spy(),
    syncfs: function (_, callback) {
        callback(undefined);
    }
};
global.IDBFS = null;
global.WebAssembly.instantiateStreaming = function () {
    return Promise.reject();
};
global.WebAssembly.instantiate = function () {
    return Promise.resolve({
        module: "module",
        instance: "instance"
    });
};
var postMessageSpy = sinon.spy();
global.postMessage = postMessageSpy;
ava_1.default.serial("engine load", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var engineInstance, instantiateStub;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                engineInstance = engineWorker_1.engine();
                return [4 /*yield*/, t.throwsAsync(engineInstance.loadLibrary("fakeDeviceId", "./wrong-path/", "fakePath"))];
            case 1:
                _a.sent();
                instantiateStub = sinon.stub(global.WebAssembly, "instantiate").rejects();
                engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath");
                return [4 /*yield*/, wait(2000)];
            case 2:
                _a.sent();
                t.true(instantiateStub.called);
                t.false(moduleInstance.callMain.called);
                instantiateStub.restore();
                return [4 /*yield*/, engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath")];
            case 3:
                _a.sent();
                t.true(moduleInstance.callMain.called);
                t.is(postMessageSpy.calledOnceWithExactly(["status", "ready"]), true);
                engineInstance.setBlurryDecodingEnabled(true);
                engineInstance.workOnScanQueue(); // Try to work on queue with non-ready engine
                t.is(postMessageSpy.callCount, 1);
                engineInstance.createContext("");
                engineInstance.setSettings(JSON.stringify({})); // Try to set invalid settings
                engineInstance.workOnScanQueue(); // Try to work on queue with non-ready engine
                t.is(postMessageSpy.callCount, 1);
                engineInstance.clearSession(); // Try to clear non-existent session
                engineInstance.setImageSettings({
                    width: 1,
                    height: 1,
                    format: imageSettings_1.ImageSettings.Format.RGBA_8U
                });
                engineInstance.setImageSettings({
                    width: 1,
                    height: 1,
                    format: imageSettings_1.ImageSettings.Format.RGBA_8U
                }); // Set image settings again
                engineInstance.addScanWorkUnit({
                    requestId: 0,
                    data: new Uint8ClampedArray([0, 0, 0, 0]),
                    highQualitySingleFrameMode: true
                }); // Add work unit to allow settings to be set
                engineInstance.setSettings(new scanSettings_1.ScanSettings().toJSONString());
                engineInstance.clearSession();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("engine scan", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var engineInstance;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                postMessageSpy.resetHistory();
                engineInstance = engineWorker_1.engine();
                return [4 /*yield*/, engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath")];
            case 1:
                _a.sent();
                t.true(moduleInstance.callMain.called);
                t.is(postMessageSpy.calledOnceWithExactly(["status", "ready"]), true);
                engineInstance.createContext("");
                engineInstance.addScanWorkUnit({
                    requestId: 0,
                    data: new Uint8ClampedArray([0, 0, 0, 0]),
                    highQualitySingleFrameMode: true
                }); // Try to add work unit with non-ready engine
                t.is(postMessageSpy.callCount, 1);
                engineInstance.setSettings(new scanSettings_1.ScanSettings().toJSONString());
                engineInstance.setImageSettings({
                    width: 1,
                    height: 1,
                    format: imageSettings_1.ImageSettings.Format.RGBA_8U
                });
                engineInstance.addScanWorkUnit({
                    requestId: 1,
                    data: new Uint8ClampedArray([0, 0, 0, 0]),
                    highQualitySingleFrameMode: true
                });
                t.is(postMessageSpy.callCount, 3);
                t.deepEqual(postMessageSpy.getCall(1).lastArg, [
                    "work-result",
                    {
                        result: {
                            scanResult: []
                        },
                        requestId: 0
                    }
                ]);
                t.deepEqual(postMessageSpy.getCall(2).lastArg, [
                    "work-result",
                    {
                        result: {
                            scanResult: []
                        },
                        requestId: 1
                    }
                ]);
                engineInstance.setImageSettings({
                    width: 1,
                    height: 1,
                    format: imageSettings_1.ImageSettings.Format.RGB_8U
                }); // Set image settings again
                engineInstance.addScanWorkUnit({
                    requestId: 2,
                    data: new Uint8ClampedArray([0, 0, 0]),
                    highQualitySingleFrameMode: false
                });
                t.is(postMessageSpy.callCount, 4);
                t.deepEqual(postMessageSpy.getCall(3).lastArg, [
                    "work-result",
                    {
                        result: {
                            scanResult: []
                        },
                        requestId: 2
                    }
                ]);
                engineInstance.setImageSettings({
                    width: 1,
                    height: 1,
                    format: imageSettings_1.ImageSettings.Format.GRAY_8U
                }); // Set image settings again
                engineInstance.addScanWorkUnit({
                    requestId: 3,
                    data: new Uint8ClampedArray([0]),
                    highQualitySingleFrameMode: false
                });
                t.is(postMessageSpy.callCount, 5);
                t.deepEqual(postMessageSpy.getCall(4).lastArg, [
                    "work-result",
                    {
                        result: {
                            scanResult: []
                        },
                        requestId: 3
                    }
                ]);
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("engine scan error", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var engineInstance;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                postMessageSpy.resetHistory();
                engineInstance = engineWorker_1.engine();
                return [4 /*yield*/, engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath")];
            case 1:
                _a.sent();
                t.true(moduleInstance.callMain.called);
                t.is(postMessageSpy.calledOnceWithExactly(["status", "ready"]), true);
                engineInstance.createContext("");
                engineInstance.setSettings(new scanSettings_1.ScanSettings().toJSONString());
                engineInstance.setImageSettings({
                    width: 1,
                    height: 1,
                    format: imageSettings_1.ImageSettings.Format.GRAY_8U
                });
                engineInstance.addScanWorkUnit({
                    requestId: 0,
                    data: new Uint8ClampedArray([255]),
                    highQualitySingleFrameMode: false
                });
                t.is(postMessageSpy.callCount, 2);
                t.deepEqual(postMessageSpy.getCall(1).lastArg, [
                    "work-error",
                    {
                        error: {
                            errorCode: 1,
                            errorMessage: "Error."
                        },
                        requestId: 0
                    }
                ]);
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("engine parse", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var engineInstance;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                postMessageSpy.resetHistory();
                engineInstance = engineWorker_1.engine();
                return [4 /*yield*/, engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath")];
            case 1:
                _a.sent();
                t.true(moduleInstance.callMain.called);
                t.is(postMessageSpy.calledOnceWithExactly(["status", "ready"]), true);
                engineInstance.addParseWorkUnit({
                    requestId: 0,
                    dataFormat: parser_1.Parser.DataFormat.DLID,
                    dataString: "test",
                    options: JSON.stringify({})
                }); // Try to add work unit with non-ready engine
                t.is(postMessageSpy.callCount, 1);
                engineInstance.createContext("");
                engineInstance.addParseWorkUnit({
                    requestId: 1,
                    dataFormat: parser_1.Parser.DataFormat.GS1_AI,
                    dataString: "test",
                    options: JSON.stringify({})
                });
                t.is(postMessageSpy.callCount, 3);
                t.deepEqual(postMessageSpy.getCall(1).lastArg, [
                    "parse-string-result",
                    {
                        result: {
                            x: "y"
                        },
                        requestId: 0
                    }
                ]);
                t.deepEqual(postMessageSpy.getCall(2).lastArg, [
                    "parse-string-result",
                    {
                        result: {
                            x: "y"
                        },
                        requestId: 1
                    }
                ]);
                engineInstance.addParseWorkUnit({
                    requestId: 2,
                    dataFormat: parser_1.Parser.DataFormat.HIBC,
                    dataString: "test",
                    options: JSON.stringify({})
                });
                engineInstance.addParseWorkUnit({
                    requestId: 3,
                    dataFormat: parser_1.Parser.DataFormat.MRTD,
                    dataString: "test",
                    options: JSON.stringify({})
                });
                engineInstance.addParseWorkUnit({
                    requestId: 4,
                    dataFormat: parser_1.Parser.DataFormat.SWISSQR,
                    dataString: "test",
                    options: JSON.stringify({})
                });
                t.is(postMessageSpy.callCount, 6);
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("engine parse error", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var engineInstance;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                postMessageSpy.resetHistory();
                engineInstance = engineWorker_1.engine();
                return [4 /*yield*/, engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath")];
            case 1:
                _a.sent();
                t.true(moduleInstance.callMain.called);
                t.is(postMessageSpy.calledOnceWithExactly(["status", "ready"]), true);
                engineInstance.createContext("");
                engineInstance.addParseWorkUnit({
                    requestId: 0,
                    dataFormat: -1,
                    dataString: "test",
                    options: JSON.stringify({})
                });
                t.is(postMessageSpy.callCount, 2);
                t.deepEqual(postMessageSpy.getCall(1).lastArg, [
                    "parse-string-error",
                    {
                        error: {
                            errorCode: 1,
                            errorMessage: "Error."
                        },
                        requestId: 0
                    }
                ]);
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=engineWorker.spec.js.map