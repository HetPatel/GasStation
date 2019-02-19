"use strict";
/* tslint:disable:no-implicit-dependencies */
/**
 * BarcodePicker tests
 */
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ava_1 = tslib_1.__importDefault(require("ava"));
var sinon = tslib_1.__importStar(require("sinon"));
var webworker_threads_1 = require("webworker-threads");
var __1 = require("..");
var barcodePickerCameraManager_1 = require("./barcodePickerCameraManager");
HTMLVideoElement.prototype.load = function () {
    return;
};
HTMLVideoElement.prototype.play = function () {
    Object.defineProperty(this, "videoWidth", {
        writable: true,
        value: 4
    });
    Object.defineProperty(this, "videoHeight", {
        writable: true,
        value: 4
    });
    this.currentTime = 1;
    this.dispatchEvent(new Event("loadstart"));
    this.dispatchEvent(new Event("loadeddata"));
    return Promise.resolve();
};
var fakeCamera1 = {
    deviceId: "1",
    groupId: "1",
    kind: "videoinput",
    label: "Fake Camera Device (back)"
};
var fakeCamera2 = {
    deviceId: "2",
    groupId: "1",
    kind: "videoinput",
    label: "Fake Camera Device (front)"
};
var fakeCamera1Object = {
    deviceId: fakeCamera1.deviceId,
    label: fakeCamera1.label,
    cameraType: __1.Camera.Type.BACK,
    currentResolution: {
        width: 4,
        height: 4
    }
};
var fakeCamera2Object = {
    deviceId: fakeCamera2.deviceId,
    label: fakeCamera2.label,
    cameraType: __1.Camera.Type.FRONT,
    currentResolution: {
        width: 4,
        height: 4
    }
};
function fakePartialCompatibleBrowser() {
    navigator.mediaDevices = undefined;
    window.Worker = function () {
        return;
    };
    window.WebAssembly = {};
    window.Blob = function () {
        return;
    };
    window.URL = {
        createObjectURL: function () {
            return;
        }
    };
}
function fakeFullCompatibleBrowser() {
    navigator.mediaDevices = {
        getUserMedia: function () {
            return Promise.resolve({
                getTracks: function () {
                    return [{}];
                },
                getVideoTracks: function () {
                    return [
                        {
                            addEventListener: function () {
                                return;
                            },
                            stop: function () {
                                return;
                            }
                        }
                    ];
                }
            });
        }
    };
    navigator.enumerateDevices = function () {
        return Promise.resolve([fakeCamera1, fakeCamera2]);
    };
    window.Worker = function () {
        return;
    };
    window.WebAssembly = {};
    window.Blob = function () {
        return;
    };
    window.URL = {
        createObjectURL: function () {
            return;
        }
    };
}
global.Worker = webworker_threads_1.Worker;
global.URL = {
    createObjectURL: function () {
        return __1.engineWorkerFunction;
    }
};
ava_1.default.serial("constructor & destroy", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var error, barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, t.throwsAsync(__1.BarcodePicker.create(document.createElement("div")))];
            case 1:
                error = _a.sent();
                t.is(error.name, "UnsupportedBrowserError");
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, t.throwsAsync(__1.BarcodePicker.create(document.createElement("div")))];
            case 2:
                error = _a.sent();
                t.is(error.name, "LibraryNotConfiguredError");
                return [4 /*yield*/, __1.configure("license_key")];
            case 3:
                _a.sent();
                return [4 /*yield*/, t.throwsAsync(__1.BarcodePicker.create(0))];
            case 4:
                error = _a.sent();
                t.is(error.name, "NoOriginElementError");
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        singleImageMode: {
                            desktop: { always: true, allowFallback: true },
                            mobile: { always: true, allowFallback: true }
                        }
                    })];
            case 5:
                barcodePicker = _a.sent();
                barcodePicker.destroy();
                fakePartialCompatibleBrowser();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        singleImageMode: {
                            desktop: { always: false, allowFallback: true },
                            mobile: { always: false, allowFallback: true }
                        }
                    })];
            case 6:
                barcodePicker = _a.sent();
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"))];
            case 7:
                barcodePicker = _a.sent();
                barcodePicker.destroy(false);
                barcodePicker.getScanner().destroy();
                return [4 /*yield*/, t.throwsAsync(__1.BarcodePicker.create(document.createElement("div"), {
                        singleImageMode: {
                            desktop: { always: false, allowFallback: false },
                            mobile: { always: false, allowFallback: false }
                        }
                    }))];
            case 8:
                error = _a.sent();
                t.is(error.name, "UnsupportedBrowserError");
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        targetScanningFPS: -1
                    })];
            case 9:
                barcodePicker = _a.sent();
                barcodePicker.destroy();
                t.pass();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        scanner: new __1.Scanner()
                    })];
            case 10:
                barcodePicker = _a.sent();
                barcodePicker.destroy();
                t.pass();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 11:
                barcodePicker = _a.sent();
                barcodePicker.destroy();
                t.pass();
                __1.BrowserHelper.userAgentInfo.setUA("Mozilla/5.0 (iPhone; CPU iPhone OS 11_3 like Mac OS X) " +
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version / 11.0 Mobile / 15E148 Safari / 604.1");
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"))];
            case 12:
                barcodePicker = _a.sent();
                barcodePicker.destroy();
                t.pass();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("constructor & destroy (with fake camera)", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var s, barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                s = new __1.Scanner();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        scanner: s
                    })];
            case 2:
                barcodePicker = _a.sent();
                s.engineWorkerOnMessage({
                    data: ["status", "ready"]
                });
                barcodePicker.destroy();
                t.pass();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("constructor interaction options", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var setInteractionOptionsSpy, barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                setInteractionOptionsSpy = sinon.spy(barcodePickerCameraManager_1.BarcodePickerCameraManager.prototype, "setInteractionOptions");
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(setInteractionOptionsSpy.callCount, 1);
                t.deepEqual(setInteractionOptionsSpy.getCall(0).args, [true, true, true, true]);
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        enableCameraSwitcher: false,
                        enableTorchToggle: false,
                        enableTapToFocus: false,
                        enablePinchToZoom: false
                    })];
            case 3:
                barcodePicker = _a.sent();
                t.is(setInteractionOptionsSpy.callCount, 2);
                t.deepEqual(setInteractionOptionsSpy.getCall(1).args, [false, false, false, false]);
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        enableCameraSwitcher: false,
                        enableTorchToggle: true,
                        enableTapToFocus: false,
                        enablePinchToZoom: true
                    })];
            case 4:
                barcodePicker = _a.sent();
                t.is(setInteractionOptionsSpy.callCount, 3);
                t.deepEqual(setInteractionOptionsSpy.getCall(2).args, [false, true, false, true]);
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        enableCameraSwitcher: true,
                        enableTorchToggle: false,
                        enableTapToFocus: true,
                        enablePinchToZoom: false
                    })];
            case 5:
                barcodePicker = _a.sent();
                t.is(setInteractionOptionsSpy.callCount, 4);
                t.deepEqual(setInteractionOptionsSpy.getCall(3).args, [true, false, true, false]);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("constructor scanningPaused & isScanningPaused & pauseScanning & resumeScanning (with fake camera)", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var s, barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                s = new __1.Scanner();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        scanner: s
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isScanningPaused(), false);
                return [4 /*yield*/, barcodePicker.resumeScanning()];
            case 3:
                _a.sent();
                t.is(barcodePicker.isScanningPaused(), false);
                s.engineWorkerOnMessage({
                    data: ["status", "ready"]
                });
                barcodePicker.pauseScanning();
                t.is(barcodePicker.isScanningPaused(), true);
                return [4 /*yield*/, barcodePicker.resumeScanning()];
            case 4:
                _a.sent();
                t.is(barcodePicker.isScanningPaused(), false);
                barcodePicker.destroy(false);
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        scanner: s,
                        scanningPaused: true
                    })];
            case 5:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isScanningPaused(), true);
                return [4 /*yield*/, barcodePicker.resumeScanning()];
            case 6:
                _a.sent();
                t.is(barcodePicker.isScanningPaused(), false);
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("accessCamera & getActiveCamera & setActiveCamera (with fake camera)", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.getActiveCamera(), undefined);
                return [4 /*yield*/, barcodePicker.accessCamera()];
            case 3:
                _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
                barcodePicker.pauseScanning();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
                barcodePicker.pauseScanning(true);
                t.is(barcodePicker.getActiveCamera(), undefined);
                return [4 /*yield*/, barcodePicker.resumeScanning()];
            case 4:
                _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
                return [4 /*yield*/, barcodePicker.setActiveCamera(fakeCamera2Object)];
            case 5:
                _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera2Object);
                return [4 /*yield*/, barcodePicker.setActiveCamera()];
            case 6:
                _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"))];
            case 7:
                barcodePicker = _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
                return [4 /*yield*/, barcodePicker.accessCamera()];
            case 8:
                _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 9:
                barcodePicker = _a.sent();
                return [4 /*yield*/, barcodePicker.setActiveCamera(fakeCamera2Object)];
            case 10:
                _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), undefined);
                return [4 /*yield*/, barcodePicker.accessCamera()];
            case 11:
                _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera2Object);
                __1.BrowserHelper.userAgentInfo.setUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.92 Safari/537.36");
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"))];
            case 12:
                barcodePicker = _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
                return [4 /*yield*/, barcodePicker.accessCamera()];
            case 13:
                _a.sent();
                t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("applyCameraSettings (with fake camera)", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker, cs, setSelectedCameraSettingsSpy, applyCameraSettingsSpy;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                cs = {
                    resolutionPreference: __1.CameraSettings.ResolutionPreference.FULL_HD
                };
                setSelectedCameraSettingsSpy = sinon.spy(barcodePicker.cameraManager, "setSelectedCameraSettings");
                applyCameraSettingsSpy = sinon.spy(barcodePicker.cameraManager, "applyCameraSettings");
                t.is(setSelectedCameraSettingsSpy.callCount, 0);
                t.is(applyCameraSettingsSpy.callCount, 0);
                barcodePicker.applyCameraSettings(cs);
                t.is(barcodePicker.getActiveCamera(), undefined);
                t.is(setSelectedCameraSettingsSpy.callCount, 1);
                t.is(applyCameraSettingsSpy.callCount, 0);
                t.deepEqual(setSelectedCameraSettingsSpy.getCall(0).args, [cs]);
                barcodePicker.applyCameraSettings();
                t.is(barcodePicker.getActiveCamera(), undefined);
                t.is(setSelectedCameraSettingsSpy.callCount, 2);
                t.deepEqual(setSelectedCameraSettingsSpy.getCall(1).args, [undefined]);
                return [4 /*yield*/, barcodePicker.accessCamera()];
            case 3:
                _a.sent();
                barcodePicker.applyCameraSettings(cs);
                t.is(applyCameraSettingsSpy.callCount, 1);
                t.deepEqual(applyCameraSettingsSpy.getCall(0).args, [cs]);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("constructor scanSettings & applyScanSettings", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var s, barcodePicker, ss, applyScanSettingsSpy;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                s = new __1.Scanner();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        scanner: s
                    })];
            case 2:
                barcodePicker = _a.sent();
                ss = new __1.ScanSettings({
                    enabledSymbologies: __1.Barcode.Symbology.QR,
                    codeDuplicateFilter: 10,
                    maxNumberOfCodesPerFrame: 10,
                    searchArea: { x: 0.5, y: 0.5, width: 0.5, height: 0.1 }
                });
                applyScanSettingsSpy = sinon.spy(s, "applyScanSettings");
                t.is(applyScanSettingsSpy.callCount, 0);
                barcodePicker.applyScanSettings(ss);
                t.is(applyScanSettingsSpy.callCount, 1);
                t.deepEqual(applyScanSettingsSpy.getCall(0).args, [ss]);
                barcodePicker.destroy(false);
                applyScanSettingsSpy.resetHistory();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        scanner: s,
                        scanSettings: ss
                    })];
            case 3:
                barcodePicker = _a.sent();
                t.deepEqual(applyScanSettingsSpy.getCall(0).args, [ss]);
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("isVisible & setVisible", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isVisible(), true);
                barcodePicker.setVisible(false);
                t.is(barcodePicker.isVisible(), false);
                barcodePicker.setVisible(true);
                t.is(barcodePicker.isVisible(), true);
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        visible: false
                    })];
            case 3:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isVisible(), false);
                barcodePicker.setVisible(true);
                t.is(barcodePicker.isVisible(), true);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("isMirrorImageEnabled & setMirrorImageEnabled", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), false);
                barcodePicker.setMirrorImageEnabled(true);
                t.is(barcodePicker.isMirrorImageEnabled(), false); // No camera has been accessed yet
                return [4 /*yield*/, barcodePicker.accessCamera()];
            case 3:
                _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), false);
                barcodePicker.setMirrorImageEnabled(true);
                t.is(barcodePicker.isMirrorImageEnabled(), true);
                return [4 /*yield*/, barcodePicker.setActiveCamera(fakeCamera2Object)];
            case 4:
                _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), true); // Front camera
                barcodePicker.setMirrorImageEnabled(false);
                t.is(barcodePicker.isMirrorImageEnabled(), false);
                return [4 /*yield*/, barcodePicker.setActiveCamera()];
            case 5:
                _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), true);
                return [4 /*yield*/, barcodePicker.setActiveCamera(fakeCamera2Object)];
            case 6:
                _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), false);
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        camera: fakeCamera2Object
                    })];
            case 7:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), true);
                barcodePicker.setMirrorImageEnabled(false);
                t.is(barcodePicker.isMirrorImageEnabled(), false);
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        camera: fakeCamera2Object
                    })];
            case 8:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), true);
                barcodePicker.pauseScanning(true);
                t.is(barcodePicker.isMirrorImageEnabled(), false);
                barcodePicker.setMirrorImageEnabled(true);
                t.is(barcodePicker.isMirrorImageEnabled(), false);
                return [4 /*yield*/, barcodePicker.resumeScanning()];
            case 9:
                _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), true);
                barcodePicker.pauseScanning(true);
                return [4 /*yield*/, barcodePicker.setActiveCamera(fakeCamera1Object)];
            case 10:
                _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), false);
                return [4 /*yield*/, barcodePicker.resumeScanning()];
            case 11:
                _a.sent();
                t.is(barcodePicker.isMirrorImageEnabled(), false);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("isPlaySoundOnScanEnabled & setPlaySoundOnScanEnabled", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isPlaySoundOnScanEnabled(), false);
                barcodePicker.setPlaySoundOnScanEnabled(true);
                t.is(barcodePicker.isPlaySoundOnScanEnabled(), true);
                barcodePicker.setPlaySoundOnScanEnabled(false);
                t.is(barcodePicker.isPlaySoundOnScanEnabled(), false);
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        playSoundOnScan: true
                    })];
            case 3:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isPlaySoundOnScanEnabled(), true);
                barcodePicker.setPlaySoundOnScanEnabled(false);
                t.is(barcodePicker.isPlaySoundOnScanEnabled(), false);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("isVibrateOnScanEnabled & setVibrateOnScanEnabled", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isVibrateOnScanEnabled(), false);
                barcodePicker.setVibrateOnScanEnabled(true);
                t.is(barcodePicker.isVibrateOnScanEnabled(), true);
                barcodePicker.setVibrateOnScanEnabled(false);
                t.is(barcodePicker.isVibrateOnScanEnabled(), false);
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        vibrateOnScan: true
                    })];
            case 3:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isVibrateOnScanEnabled(), true);
                barcodePicker.setVibrateOnScanEnabled(false);
                t.is(barcodePicker.isVibrateOnScanEnabled(), false);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("isCameraSwitcherEnabled & setCameraSwitcherEnabled", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isCameraSwitcherEnabled(), true);
                barcodePicker.setCameraSwitcherEnabled(false);
                t.is(barcodePicker.isCameraSwitcherEnabled(), false);
                barcodePicker.setCameraSwitcherEnabled(true);
                t.is(barcodePicker.isCameraSwitcherEnabled(), true);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("isTorchToggleEnabled & setTorchToggleEnabled", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isTorchToggleEnabled(), true);
                barcodePicker.setTorchToggleEnabled(false);
                t.is(barcodePicker.isTorchToggleEnabled(), false);
                barcodePicker.setTorchToggleEnabled(true);
                t.is(barcodePicker.isTorchToggleEnabled(), true);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("isTapToFocusEnabled & setTapToFocusEnabled", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isTapToFocusEnabled(), true);
                barcodePicker.setTapToFocusEnabled(false);
                t.is(barcodePicker.isTapToFocusEnabled(), false);
                barcodePicker.setTapToFocusEnabled(true);
                t.is(barcodePicker.isTapToFocusEnabled(), true);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("isPinchToZoomEnabled & setPinchToZoomEnabled", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.isPinchToZoomEnabled(), true);
                barcodePicker.setPinchToZoomEnabled(false);
                t.is(barcodePicker.isPinchToZoomEnabled(), false);
                barcodePicker.setPinchToZoomEnabled(true);
                t.is(barcodePicker.isPinchToZoomEnabled(), true);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("setTorchEnabled", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                barcodePicker.setTorchEnabled(true);
                barcodePicker.setTorchEnabled(false);
                barcodePicker.destroy();
                t.pass();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("setZoom", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                barcodePicker.setZoom(0.1);
                barcodePicker.setZoom(1);
                barcodePicker.destroy();
                t.pass();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("constructor guiStyle option & setGuiStyle", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker, setGuiStyleSpy;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                setGuiStyleSpy = sinon.spy(barcodePicker.barcodePickerGui, "setGuiStyle");
                t.is(barcodePicker.barcodePickerGui.guiStyle, __1.BarcodePicker.GuiStyle.LASER);
                barcodePicker.setGuiStyle(__1.BarcodePicker.GuiStyle.NONE);
                t.is(setGuiStyleSpy.callCount, 1);
                t.deepEqual(setGuiStyleSpy.getCall(0).args, [__1.BarcodePicker.GuiStyle.NONE]);
                barcodePicker.setGuiStyle(__1.BarcodePicker.GuiStyle.LASER);
                t.is(setGuiStyleSpy.callCount, 2);
                t.deepEqual(setGuiStyleSpy.getCall(1).args, [__1.BarcodePicker.GuiStyle.LASER]);
                barcodePicker.setGuiStyle(__1.BarcodePicker.GuiStyle.VIEWFINDER);
                t.is(setGuiStyleSpy.callCount, 3);
                t.deepEqual(setGuiStyleSpy.getCall(2).args, [__1.BarcodePicker.GuiStyle.VIEWFINDER]);
                barcodePicker.setGuiStyle(__1.BarcodePicker.GuiStyle.NONE);
                t.is(setGuiStyleSpy.callCount, 4);
                t.deepEqual(setGuiStyleSpy.getCall(3).args, [__1.BarcodePicker.GuiStyle.NONE]);
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        guiStyle: __1.BarcodePicker.GuiStyle.NONE
                    })];
            case 3:
                barcodePicker = _a.sent();
                t.is(barcodePicker.barcodePickerGui.guiStyle, __1.BarcodePicker.GuiStyle.NONE);
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("constructor videoFit option & setVideoFit", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker, setVideoFitSpy;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                setVideoFitSpy = sinon.spy(barcodePicker.barcodePickerGui, "setVideoFit");
                t.is(barcodePicker.barcodePickerGui.videoFit, __1.BarcodePicker.ObjectFit.CONTAIN);
                barcodePicker.setVideoFit(__1.BarcodePicker.ObjectFit.COVER);
                t.is(setVideoFitSpy.callCount, 1);
                t.deepEqual(setVideoFitSpy.getCall(0).args, [__1.BarcodePicker.ObjectFit.COVER]);
                barcodePicker.setVideoFit(__1.BarcodePicker.ObjectFit.CONTAIN);
                t.is(setVideoFitSpy.callCount, 2);
                t.deepEqual(setVideoFitSpy.getCall(1).args, [__1.BarcodePicker.ObjectFit.CONTAIN]);
                barcodePicker.destroy();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        videoFit: __1.BarcodePicker.ObjectFit.COVER
                    })];
            case 3:
                barcodePicker = _a.sent();
                t.is(barcodePicker.barcodePickerGui.videoFit, __1.BarcodePicker.ObjectFit.COVER);
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("createParserForFormat", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker, parser;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                parser = barcodePicker.createParserForFormat(__1.Parser.DataFormat.DLID);
                t.truthy(parser);
                parser = barcodePicker.createParserForFormat(__1.Parser.DataFormat.GS1_AI);
                t.truthy(parser);
                parser = barcodePicker.createParserForFormat(__1.Parser.DataFormat.HIBC);
                t.truthy(parser);
                parser = barcodePicker.createParserForFormat(__1.Parser.DataFormat.MRTD);
                t.truthy(parser);
                parser = barcodePicker.createParserForFormat(__1.Parser.DataFormat.SWISSQR);
                t.truthy(parser);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("reassignOriginElement", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var element1, element2, barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                element1 = document.createElement("div");
                element2 = document.createElement("div");
                return [4 /*yield*/, __1.BarcodePicker.create(element1, {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.deepEqual(barcodePicker.barcodePickerGui.originElement, element1);
                t.notDeepEqual(barcodePicker.barcodePickerGui.originElement, element2);
                barcodePicker.reassignOriginElement(document.createElement("div"));
                t.deepEqual(barcodePicker.barcodePickerGui.originElement, element2);
                t.notDeepEqual(barcodePicker.barcodePickerGui.originElement, element1);
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("setTargetScanningFPS", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var barcodePicker;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false
                    })];
            case 2:
                barcodePicker = _a.sent();
                t.is(barcodePicker.targetScanningFPS, 30);
                barcodePicker.setTargetScanningFPS(10);
                t.is(barcodePicker.targetScanningFPS, 10);
                barcodePicker.setTargetScanningFPS(0);
                t.is(barcodePicker.targetScanningFPS, 10);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("clearSession", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var s, barcodePicker, clearSessionSpy;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                s = new __1.Scanner();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        scanner: s
                    })];
            case 2:
                barcodePicker = _a.sent();
                clearSessionSpy = sinon.spy(s, "clearSession");
                t.is(clearSessionSpy.callCount, 0);
                barcodePicker.clearSession();
                t.is(clearSessionSpy.callCount, 1);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("isReady & onReady", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var s, barcodePicker, callbackSpy1, callbackSpy2, callbackSpy3, callbackSpy4;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                s = new __1.Scanner();
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        scanner: s
                    })];
            case 2:
                barcodePicker = _a.sent();
                callbackSpy1 = sinon.spy();
                callbackSpy2 = sinon.spy();
                callbackSpy3 = sinon.spy();
                callbackSpy4 = sinon.spy();
                t.false(s.isReady());
                t.false(barcodePicker.isReady());
                s.onReady(callbackSpy1);
                barcodePicker.onReady(callbackSpy2);
                barcodePicker.onReady(callbackSpy3);
                t.false(callbackSpy1.called);
                t.false(callbackSpy2.called);
                t.false(callbackSpy3.called);
                s.engineWorkerOnMessage({
                    data: ["status", "ready"]
                });
                t.true(s.isReady());
                t.true(barcodePicker.isReady());
                t.true(callbackSpy1.called);
                t.true(callbackSpy2.called);
                t.true(callbackSpy3.called);
                t.true(callbackSpy3.calledAfter(callbackSpy2));
                t.true(callbackSpy1.calledAfter(callbackSpy3));
                barcodePicker.onReady(callbackSpy4);
                t.true(callbackSpy4.called);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("onScan & removeScanListener & removeScanListeners", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var s, imageSettings, barcodePicker, callbackSpy1, callbackSpy2, callbackSpy3, scanResult;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                s = new __1.Scanner();
                imageSettings = {
                    width: 2,
                    height: 2,
                    format: __1.ImageSettings.Format.GRAY_8U
                };
                s.applyImageSettings(imageSettings);
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        scanner: s
                    })];
            case 2:
                barcodePicker = _a.sent();
                callbackSpy1 = sinon.spy();
                callbackSpy2 = sinon.spy();
                callbackSpy3 = sinon.spy();
                barcodePicker.onScan(callbackSpy1);
                barcodePicker.onScan(callbackSpy2);
                barcodePicker.onScan(callbackSpy3, true);
                t.false(callbackSpy1.called);
                t.false(callbackSpy2.called);
                t.false(callbackSpy3.called);
                s.engineWorkerOnMessage({
                    data: ["status", "ready"]
                });
                sinon.stub(barcodePicker.barcodePickerGui, "getVideoImageData").callsFake(function () {
                    return new Uint8ClampedArray(4);
                });
                sinon.stub(s, "processImage").callsFake(function () {
                    return Promise.resolve({
                        barcodes: [],
                        imageData: new Uint8ClampedArray(4),
                        imageSettings: imageSettings
                    });
                });
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 3:
                _a.sent();
                t.is(callbackSpy1.callCount, 0);
                t.is(callbackSpy2.callCount, 0);
                t.is(callbackSpy3.callCount, 0);
                scanResult = {
                    barcodes: [
                        {
                            symbology: __1.Barcode.Symbology.QR,
                            compositeFlag: __1.Barcode.CompositeFlag.NONE,
                            isGs1DataCarrier: false,
                            encodingArray: [],
                            location: {
                                topLeft: { x: 0, y: 0 },
                                topRight: { x: 1, y: 0 },
                                bottomRight: { x: 1, y: 1 },
                                bottomLeft: { x: 0, y: 1 }
                            },
                            data: "",
                            rawData: new Uint8Array()
                        }
                    ],
                    imageData: new Uint8ClampedArray(4),
                    imageSettings: {
                        width: 2,
                        height: 2,
                        format: __1.ImageSettings.Format.GRAY_8U
                    }
                };
                s.processImage.restore();
                sinon.stub(s, "processImage").callsFake(function () {
                    return Promise.resolve(scanResult);
                });
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 4:
                _a.sent();
                t.is(callbackSpy1.callCount, 1);
                t.is(callbackSpy2.callCount, 1);
                t.is(callbackSpy3.callCount, 1);
                t.deepEqual(callbackSpy1.getCall(0).args, [scanResult]);
                t.deepEqual(callbackSpy2.getCall(0).args, [scanResult]);
                t.deepEqual(callbackSpy3.getCall(0).args, [scanResult]);
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 5:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 2);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.removeScanListener(callbackSpy1);
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 6:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 3);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.removeScanListeners();
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 7:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 3);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("onSubmitFrame & removeSubmitFrameListener & removeSubmitFrameListeners", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var s, imageSettings, barcodePicker, callbackSpy1, callbackSpy2, callbackSpy3, scanResult;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                s = new __1.Scanner();
                imageSettings = {
                    width: 2,
                    height: 2,
                    format: __1.ImageSettings.Format.GRAY_8U
                };
                s.applyImageSettings(imageSettings);
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        scanner: s
                    })];
            case 2:
                barcodePicker = _a.sent();
                callbackSpy1 = sinon.spy();
                callbackSpy2 = sinon.spy();
                callbackSpy3 = sinon.spy();
                barcodePicker.onSubmitFrame(callbackSpy1);
                barcodePicker.onSubmitFrame(callbackSpy2);
                barcodePicker.onSubmitFrame(callbackSpy3, true);
                t.false(callbackSpy1.called);
                t.false(callbackSpy2.called);
                t.false(callbackSpy3.called);
                s.engineWorkerOnMessage({
                    data: ["status", "ready"]
                });
                sinon.stub(barcodePicker.barcodePickerGui, "getVideoImageData").callsFake(function () {
                    return new Uint8ClampedArray(4);
                });
                scanResult = {
                    barcodes: [],
                    imageData: new Uint8ClampedArray(4),
                    imageSettings: imageSettings
                };
                sinon.stub(s, "processImage").callsFake(function () {
                    return Promise.resolve(tslib_1.__assign({}, scanResult, { barcodes: [
                            {
                                symbology: __1.Barcode.Symbology.QR,
                                compositeFlag: __1.Barcode.CompositeFlag.NONE,
                                isGs1DataCarrier: false,
                                encodingArray: [],
                                location: {
                                    topLeft: { x: 0, y: 0 },
                                    topRight: { x: 1, y: 0 },
                                    bottomRight: { x: 1, y: 1 },
                                    bottomLeft: { x: 0, y: 1 }
                                },
                                data: "",
                                rawData: new Uint8Array()
                            }
                        ] }));
                });
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 3:
                _a.sent();
                t.is(callbackSpy1.callCount, 1);
                t.is(callbackSpy2.callCount, 1);
                t.is(callbackSpy3.callCount, 1);
                t.deepEqual(callbackSpy1.getCall(0).args, [scanResult]);
                t.deepEqual(callbackSpy2.getCall(0).args, [scanResult]);
                t.deepEqual(callbackSpy3.getCall(0).args, [scanResult]);
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 4:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 2);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.removeSubmitFrameListener(callbackSpy1);
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 5:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 3);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.removeSubmitFrameListeners();
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 6:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 3);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("onScanError & removeScanErrorListener & removeScanErrorListeners", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var s, imageSettings, barcodePicker, callbackSpy1, callbackSpy2, callbackSpy3, scanError;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                s = new __1.Scanner();
                imageSettings = {
                    width: 2,
                    height: 2,
                    format: __1.ImageSettings.Format.GRAY_8U
                };
                s.applyImageSettings(imageSettings);
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        scanner: s
                    })];
            case 2:
                barcodePicker = _a.sent();
                callbackSpy1 = sinon.spy();
                callbackSpy2 = sinon.spy();
                callbackSpy3 = sinon.spy();
                barcodePicker.onScanError(callbackSpy1);
                barcodePicker.onScanError(callbackSpy2);
                barcodePicker.onScanError(callbackSpy3, true);
                t.false(callbackSpy1.called);
                t.false(callbackSpy2.called);
                t.false(callbackSpy3.called);
                s.engineWorkerOnMessage({
                    data: ["status", "ready"]
                });
                sinon.stub(barcodePicker.barcodePickerGui, "getVideoImageData").callsFake(function () {
                    return new Uint8ClampedArray(4);
                });
                sinon.stub(s, "processImage").callsFake(function () {
                    return Promise.resolve({
                        barcodes: [],
                        imageData: new Uint8ClampedArray(4),
                        imageSettings: imageSettings
                    });
                });
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 3:
                _a.sent();
                t.is(callbackSpy1.callCount, 0);
                t.is(callbackSpy2.callCount, 0);
                t.is(callbackSpy3.callCount, 0);
                scanError = new __1.CustomError({
                    name: "ScanditEngineError",
                    message: "Test error"
                });
                s.processImage.restore();
                sinon.stub(s, "processImage").callsFake(function () {
                    return Promise.reject(scanError);
                });
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 4:
                _a.sent();
                t.is(callbackSpy1.callCount, 1);
                t.is(callbackSpy2.callCount, 1);
                t.is(callbackSpy3.callCount, 1);
                t.deepEqual(callbackSpy1.getCall(0).args, [scanError]);
                t.deepEqual(callbackSpy2.getCall(0).args, [scanError]);
                t.deepEqual(callbackSpy3.getCall(0).args, [scanError]);
                barcodePicker.resumeScanning();
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 5:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 2);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.removeScanErrorListener(callbackSpy1);
                barcodePicker.resumeScanning();
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 6:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 3);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.removeScanErrorListeners();
                barcodePicker.resumeScanning();
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 7:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 3);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default.serial("onProcessFrame & removeProcessFrameListener & removeProcessFrameListeners", function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var s, imageSettings, barcodePicker, callbackSpy1, callbackSpy2, callbackSpy3, scanResult;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fakeFullCompatibleBrowser();
                return [4 /*yield*/, __1.configure("license_key")];
            case 1:
                _a.sent();
                s = new __1.Scanner();
                imageSettings = {
                    width: 2,
                    height: 2,
                    format: __1.ImageSettings.Format.GRAY_8U
                };
                s.applyImageSettings(imageSettings);
                return [4 /*yield*/, __1.BarcodePicker.create(document.createElement("div"), {
                        accessCamera: false,
                        scanner: s
                    })];
            case 2:
                barcodePicker = _a.sent();
                callbackSpy1 = sinon.spy();
                callbackSpy2 = sinon.spy();
                callbackSpy3 = sinon.spy();
                barcodePicker.onProcessFrame(callbackSpy1);
                barcodePicker.onProcessFrame(callbackSpy2);
                barcodePicker.onProcessFrame(callbackSpy3, true);
                t.false(callbackSpy1.called);
                t.false(callbackSpy2.called);
                t.false(callbackSpy3.called);
                s.engineWorkerOnMessage({
                    data: ["status", "ready"]
                });
                sinon.stub(barcodePicker.barcodePickerGui, "getVideoImageData").callsFake(function () {
                    return new Uint8ClampedArray(4);
                });
                scanResult = {
                    barcodes: [],
                    imageData: new Uint8ClampedArray(4),
                    imageSettings: imageSettings
                };
                sinon.stub(s, "processImage").callsFake(function () {
                    return Promise.resolve(scanResult);
                });
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 3:
                _a.sent();
                t.is(callbackSpy1.callCount, 1);
                t.is(callbackSpy2.callCount, 1);
                t.is(callbackSpy3.callCount, 1);
                t.deepEqual(callbackSpy1.getCall(0).args, [scanResult]);
                t.deepEqual(callbackSpy2.getCall(0).args, [scanResult]);
                t.deepEqual(callbackSpy3.getCall(0).args, [scanResult]);
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 4:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 2);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.removeProcessFrameListener(callbackSpy1);
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 5:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 3);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.removeProcessFrameListeners();
                return [4 /*yield*/, barcodePicker.processVideoFrame(true)];
            case 6:
                _a.sent();
                t.is(callbackSpy1.callCount, 2);
                t.is(callbackSpy2.callCount, 3);
                t.is(callbackSpy3.callCount, 1);
                barcodePicker.destroy();
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=barcodePicker.spec.js.map