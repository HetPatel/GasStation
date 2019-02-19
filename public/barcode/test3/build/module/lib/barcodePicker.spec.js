/* tslint:disable:no-implicit-dependencies */
/**
 * BarcodePicker tests
 */
import test from "ava";
import * as sinon from "sinon";
import { Worker } from "webworker-threads";
import { Barcode, BarcodePicker, BrowserHelper, Camera, CameraSettings, configure, CustomError, engineWorkerFunction, ImageSettings, Parser, Scanner, ScanSettings } from "..";
import { BarcodePickerCameraManager } from "./barcodePickerCameraManager";
HTMLVideoElement.prototype.load = () => {
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
const fakeCamera1 = {
    deviceId: "1",
    groupId: "1",
    kind: "videoinput",
    label: "Fake Camera Device (back)"
};
const fakeCamera2 = {
    deviceId: "2",
    groupId: "1",
    kind: "videoinput",
    label: "Fake Camera Device (front)"
};
const fakeCamera1Object = {
    deviceId: fakeCamera1.deviceId,
    label: fakeCamera1.label,
    cameraType: Camera.Type.BACK,
    currentResolution: {
        width: 4,
        height: 4
    }
};
const fakeCamera2Object = {
    deviceId: fakeCamera2.deviceId,
    label: fakeCamera2.label,
    cameraType: Camera.Type.FRONT,
    currentResolution: {
        width: 4,
        height: 4
    }
};
function fakePartialCompatibleBrowser() {
    navigator.mediaDevices = undefined;
    window.Worker = () => {
        return;
    };
    window.WebAssembly = {};
    window.Blob = () => {
        return;
    };
    window.URL = {
        createObjectURL: () => {
            return;
        }
    };
}
function fakeFullCompatibleBrowser() {
    navigator.mediaDevices = {
        getUserMedia: () => {
            return Promise.resolve({
                getTracks: () => {
                    return [{}];
                },
                getVideoTracks: () => {
                    return [
                        {
                            addEventListener: () => {
                                return;
                            },
                            stop: () => {
                                return;
                            }
                        }
                    ];
                }
            });
        }
    };
    navigator.enumerateDevices = () => {
        return Promise.resolve([fakeCamera1, fakeCamera2]);
    };
    window.Worker = () => {
        return;
    };
    window.WebAssembly = {};
    window.Blob = () => {
        return;
    };
    window.URL = {
        createObjectURL: () => {
            return;
        }
    };
}
global.Worker = Worker;
global.URL = {
    createObjectURL: () => {
        return engineWorkerFunction;
    }
};
test.serial("constructor & destroy", async (t) => {
    let error = await t.throwsAsync(BarcodePicker.create(document.createElement("div")));
    t.is(error.name, "UnsupportedBrowserError");
    fakeFullCompatibleBrowser();
    error = await t.throwsAsync(BarcodePicker.create(document.createElement("div")));
    t.is(error.name, "LibraryNotConfiguredError");
    await configure("license_key");
    error = await t.throwsAsync(BarcodePicker.create(0));
    t.is(error.name, "NoOriginElementError");
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        singleImageMode: {
            desktop: { always: true, allowFallback: true },
            mobile: { always: true, allowFallback: true }
        }
    });
    barcodePicker.destroy();
    fakePartialCompatibleBrowser();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        singleImageMode: {
            desktop: { always: false, allowFallback: true },
            mobile: { always: false, allowFallback: true }
        }
    });
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"));
    barcodePicker.destroy(false);
    barcodePicker.getScanner().destroy();
    error = await t.throwsAsync(BarcodePicker.create(document.createElement("div"), {
        singleImageMode: {
            desktop: { always: false, allowFallback: false },
            mobile: { always: false, allowFallback: false }
        }
    }));
    t.is(error.name, "UnsupportedBrowserError");
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        targetScanningFPS: -1
    });
    barcodePicker.destroy();
    t.pass();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        scanner: new Scanner()
    });
    barcodePicker.destroy();
    t.pass();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    barcodePicker.destroy();
    t.pass();
    BrowserHelper.userAgentInfo.setUA("Mozilla/5.0 (iPhone; CPU iPhone OS 11_3 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version / 11.0 Mobile / 15E148 Safari / 604.1");
    barcodePicker = await BarcodePicker.create(document.createElement("div"));
    barcodePicker.destroy();
    t.pass();
});
test.serial("constructor & destroy (with fake camera)", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const s = new Scanner();
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        scanner: s
    });
    s.engineWorkerOnMessage({
        data: ["status", "ready"]
    });
    barcodePicker.destroy();
    t.pass();
});
test.serial("constructor interaction options", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const setInteractionOptionsSpy = sinon.spy(BarcodePickerCameraManager.prototype, "setInteractionOptions");
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(setInteractionOptionsSpy.callCount, 1);
    t.deepEqual(setInteractionOptionsSpy.getCall(0).args, [true, true, true, true]);
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        enableCameraSwitcher: false,
        enableTorchToggle: false,
        enableTapToFocus: false,
        enablePinchToZoom: false
    });
    t.is(setInteractionOptionsSpy.callCount, 2);
    t.deepEqual(setInteractionOptionsSpy.getCall(1).args, [false, false, false, false]);
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        enableCameraSwitcher: false,
        enableTorchToggle: true,
        enableTapToFocus: false,
        enablePinchToZoom: true
    });
    t.is(setInteractionOptionsSpy.callCount, 3);
    t.deepEqual(setInteractionOptionsSpy.getCall(2).args, [false, true, false, true]);
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        enableCameraSwitcher: true,
        enableTorchToggle: false,
        enableTapToFocus: true,
        enablePinchToZoom: false
    });
    t.is(setInteractionOptionsSpy.callCount, 4);
    t.deepEqual(setInteractionOptionsSpy.getCall(3).args, [true, false, true, false]);
    barcodePicker.destroy();
});
test.serial("constructor scanningPaused & isScanningPaused & pauseScanning & resumeScanning (with fake camera)", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const s = new Scanner();
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        scanner: s
    });
    t.is(barcodePicker.isScanningPaused(), false);
    await barcodePicker.resumeScanning();
    t.is(barcodePicker.isScanningPaused(), false);
    s.engineWorkerOnMessage({
        data: ["status", "ready"]
    });
    barcodePicker.pauseScanning();
    t.is(barcodePicker.isScanningPaused(), true);
    await barcodePicker.resumeScanning();
    t.is(barcodePicker.isScanningPaused(), false);
    barcodePicker.destroy(false);
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        scanner: s,
        scanningPaused: true
    });
    t.is(barcodePicker.isScanningPaused(), true);
    await barcodePicker.resumeScanning();
    t.is(barcodePicker.isScanningPaused(), false);
});
test.serial("accessCamera & getActiveCamera & setActiveCamera (with fake camera)", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.getActiveCamera(), undefined);
    await barcodePicker.accessCamera();
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
    barcodePicker.pauseScanning();
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
    barcodePicker.pauseScanning(true);
    t.is(barcodePicker.getActiveCamera(), undefined);
    await barcodePicker.resumeScanning();
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
    await barcodePicker.setActiveCamera(fakeCamera2Object);
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera2Object);
    await barcodePicker.setActiveCamera();
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"));
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
    await barcodePicker.accessCamera();
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    await barcodePicker.setActiveCamera(fakeCamera2Object);
    t.deepEqual(barcodePicker.getActiveCamera(), undefined);
    await barcodePicker.accessCamera();
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera2Object);
    BrowserHelper.userAgentInfo.setUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.92 Safari/537.36");
    barcodePicker = await BarcodePicker.create(document.createElement("div"));
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
    await barcodePicker.accessCamera();
    t.deepEqual(barcodePicker.getActiveCamera(), fakeCamera1Object);
});
test.serial("applyCameraSettings (with fake camera)", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    const cs = {
        resolutionPreference: CameraSettings.ResolutionPreference.FULL_HD
    };
    const setSelectedCameraSettingsSpy = sinon.spy(barcodePicker.cameraManager, "setSelectedCameraSettings");
    const applyCameraSettingsSpy = sinon.spy(barcodePicker.cameraManager, "applyCameraSettings");
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
    await barcodePicker.accessCamera();
    barcodePicker.applyCameraSettings(cs);
    t.is(applyCameraSettingsSpy.callCount, 1);
    t.deepEqual(applyCameraSettingsSpy.getCall(0).args, [cs]);
    barcodePicker.destroy();
});
test.serial("constructor scanSettings & applyScanSettings", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const s = new Scanner();
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        scanner: s
    });
    const ss = new ScanSettings({
        enabledSymbologies: Barcode.Symbology.QR,
        codeDuplicateFilter: 10,
        maxNumberOfCodesPerFrame: 10,
        searchArea: { x: 0.5, y: 0.5, width: 0.5, height: 0.1 }
    });
    const applyScanSettingsSpy = sinon.spy(s, "applyScanSettings");
    t.is(applyScanSettingsSpy.callCount, 0);
    barcodePicker.applyScanSettings(ss);
    t.is(applyScanSettingsSpy.callCount, 1);
    t.deepEqual(applyScanSettingsSpy.getCall(0).args, [ss]);
    barcodePicker.destroy(false);
    applyScanSettingsSpy.resetHistory();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        scanner: s,
        scanSettings: ss
    });
    t.deepEqual(applyScanSettingsSpy.getCall(0).args, [ss]);
});
test.serial("isVisible & setVisible", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.isVisible(), true);
    barcodePicker.setVisible(false);
    t.is(barcodePicker.isVisible(), false);
    barcodePicker.setVisible(true);
    t.is(barcodePicker.isVisible(), true);
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        visible: false
    });
    t.is(barcodePicker.isVisible(), false);
    barcodePicker.setVisible(true);
    t.is(barcodePicker.isVisible(), true);
    barcodePicker.destroy();
});
test.serial("isMirrorImageEnabled & setMirrorImageEnabled", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.isMirrorImageEnabled(), false);
    barcodePicker.setMirrorImageEnabled(true);
    t.is(barcodePicker.isMirrorImageEnabled(), false); // No camera has been accessed yet
    await barcodePicker.accessCamera();
    t.is(barcodePicker.isMirrorImageEnabled(), false);
    barcodePicker.setMirrorImageEnabled(true);
    t.is(barcodePicker.isMirrorImageEnabled(), true);
    await barcodePicker.setActiveCamera(fakeCamera2Object);
    t.is(barcodePicker.isMirrorImageEnabled(), true); // Front camera
    barcodePicker.setMirrorImageEnabled(false);
    t.is(barcodePicker.isMirrorImageEnabled(), false);
    await barcodePicker.setActiveCamera();
    t.is(barcodePicker.isMirrorImageEnabled(), true);
    await barcodePicker.setActiveCamera(fakeCamera2Object);
    t.is(barcodePicker.isMirrorImageEnabled(), false);
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        camera: fakeCamera2Object
    });
    t.is(barcodePicker.isMirrorImageEnabled(), true);
    barcodePicker.setMirrorImageEnabled(false);
    t.is(barcodePicker.isMirrorImageEnabled(), false);
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        camera: fakeCamera2Object
    });
    t.is(barcodePicker.isMirrorImageEnabled(), true);
    barcodePicker.pauseScanning(true);
    t.is(barcodePicker.isMirrorImageEnabled(), false);
    barcodePicker.setMirrorImageEnabled(true);
    t.is(barcodePicker.isMirrorImageEnabled(), false);
    await barcodePicker.resumeScanning();
    t.is(barcodePicker.isMirrorImageEnabled(), true);
    barcodePicker.pauseScanning(true);
    await barcodePicker.setActiveCamera(fakeCamera1Object);
    t.is(barcodePicker.isMirrorImageEnabled(), false);
    await barcodePicker.resumeScanning();
    t.is(barcodePicker.isMirrorImageEnabled(), false);
    barcodePicker.destroy();
});
test.serial("isPlaySoundOnScanEnabled & setPlaySoundOnScanEnabled", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.isPlaySoundOnScanEnabled(), false);
    barcodePicker.setPlaySoundOnScanEnabled(true);
    t.is(barcodePicker.isPlaySoundOnScanEnabled(), true);
    barcodePicker.setPlaySoundOnScanEnabled(false);
    t.is(barcodePicker.isPlaySoundOnScanEnabled(), false);
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        playSoundOnScan: true
    });
    t.is(barcodePicker.isPlaySoundOnScanEnabled(), true);
    barcodePicker.setPlaySoundOnScanEnabled(false);
    t.is(barcodePicker.isPlaySoundOnScanEnabled(), false);
    barcodePicker.destroy();
});
test.serial("isVibrateOnScanEnabled & setVibrateOnScanEnabled", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.isVibrateOnScanEnabled(), false);
    barcodePicker.setVibrateOnScanEnabled(true);
    t.is(barcodePicker.isVibrateOnScanEnabled(), true);
    barcodePicker.setVibrateOnScanEnabled(false);
    t.is(barcodePicker.isVibrateOnScanEnabled(), false);
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        vibrateOnScan: true
    });
    t.is(barcodePicker.isVibrateOnScanEnabled(), true);
    barcodePicker.setVibrateOnScanEnabled(false);
    t.is(barcodePicker.isVibrateOnScanEnabled(), false);
    barcodePicker.destroy();
});
test.serial("isCameraSwitcherEnabled & setCameraSwitcherEnabled", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.isCameraSwitcherEnabled(), true);
    barcodePicker.setCameraSwitcherEnabled(false);
    t.is(barcodePicker.isCameraSwitcherEnabled(), false);
    barcodePicker.setCameraSwitcherEnabled(true);
    t.is(barcodePicker.isCameraSwitcherEnabled(), true);
    barcodePicker.destroy();
});
test.serial("isTorchToggleEnabled & setTorchToggleEnabled", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.isTorchToggleEnabled(), true);
    barcodePicker.setTorchToggleEnabled(false);
    t.is(barcodePicker.isTorchToggleEnabled(), false);
    barcodePicker.setTorchToggleEnabled(true);
    t.is(barcodePicker.isTorchToggleEnabled(), true);
    barcodePicker.destroy();
});
test.serial("isTapToFocusEnabled & setTapToFocusEnabled", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.isTapToFocusEnabled(), true);
    barcodePicker.setTapToFocusEnabled(false);
    t.is(barcodePicker.isTapToFocusEnabled(), false);
    barcodePicker.setTapToFocusEnabled(true);
    t.is(barcodePicker.isTapToFocusEnabled(), true);
    barcodePicker.destroy();
});
test.serial("isPinchToZoomEnabled & setPinchToZoomEnabled", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.isPinchToZoomEnabled(), true);
    barcodePicker.setPinchToZoomEnabled(false);
    t.is(barcodePicker.isPinchToZoomEnabled(), false);
    barcodePicker.setPinchToZoomEnabled(true);
    t.is(barcodePicker.isPinchToZoomEnabled(), true);
    barcodePicker.destroy();
});
test.serial("setTorchEnabled", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    barcodePicker.setTorchEnabled(true);
    barcodePicker.setTorchEnabled(false);
    barcodePicker.destroy();
    t.pass();
});
test.serial("setZoom", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    barcodePicker.setZoom(0.1);
    barcodePicker.setZoom(1);
    barcodePicker.destroy();
    t.pass();
});
test.serial("constructor guiStyle option & setGuiStyle", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    const setGuiStyleSpy = sinon.spy(barcodePicker.barcodePickerGui, "setGuiStyle");
    t.is(barcodePicker.barcodePickerGui.guiStyle, BarcodePicker.GuiStyle.LASER);
    barcodePicker.setGuiStyle(BarcodePicker.GuiStyle.NONE);
    t.is(setGuiStyleSpy.callCount, 1);
    t.deepEqual(setGuiStyleSpy.getCall(0).args, [BarcodePicker.GuiStyle.NONE]);
    barcodePicker.setGuiStyle(BarcodePicker.GuiStyle.LASER);
    t.is(setGuiStyleSpy.callCount, 2);
    t.deepEqual(setGuiStyleSpy.getCall(1).args, [BarcodePicker.GuiStyle.LASER]);
    barcodePicker.setGuiStyle(BarcodePicker.GuiStyle.VIEWFINDER);
    t.is(setGuiStyleSpy.callCount, 3);
    t.deepEqual(setGuiStyleSpy.getCall(2).args, [BarcodePicker.GuiStyle.VIEWFINDER]);
    barcodePicker.setGuiStyle(BarcodePicker.GuiStyle.NONE);
    t.is(setGuiStyleSpy.callCount, 4);
    t.deepEqual(setGuiStyleSpy.getCall(3).args, [BarcodePicker.GuiStyle.NONE]);
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        guiStyle: BarcodePicker.GuiStyle.NONE
    });
    t.is(barcodePicker.barcodePickerGui.guiStyle, BarcodePicker.GuiStyle.NONE);
});
test.serial("constructor videoFit option & setVideoFit", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    let barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    const setVideoFitSpy = sinon.spy(barcodePicker.barcodePickerGui, "setVideoFit");
    t.is(barcodePicker.barcodePickerGui.videoFit, BarcodePicker.ObjectFit.CONTAIN);
    barcodePicker.setVideoFit(BarcodePicker.ObjectFit.COVER);
    t.is(setVideoFitSpy.callCount, 1);
    t.deepEqual(setVideoFitSpy.getCall(0).args, [BarcodePicker.ObjectFit.COVER]);
    barcodePicker.setVideoFit(BarcodePicker.ObjectFit.CONTAIN);
    t.is(setVideoFitSpy.callCount, 2);
    t.deepEqual(setVideoFitSpy.getCall(1).args, [BarcodePicker.ObjectFit.CONTAIN]);
    barcodePicker.destroy();
    barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        videoFit: BarcodePicker.ObjectFit.COVER
    });
    t.is(barcodePicker.barcodePickerGui.videoFit, BarcodePicker.ObjectFit.COVER);
});
test.serial("createParserForFormat", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    let parser = barcodePicker.createParserForFormat(Parser.DataFormat.DLID);
    t.truthy(parser);
    parser = barcodePicker.createParserForFormat(Parser.DataFormat.GS1_AI);
    t.truthy(parser);
    parser = barcodePicker.createParserForFormat(Parser.DataFormat.HIBC);
    t.truthy(parser);
    parser = barcodePicker.createParserForFormat(Parser.DataFormat.MRTD);
    t.truthy(parser);
    parser = barcodePicker.createParserForFormat(Parser.DataFormat.SWISSQR);
    t.truthy(parser);
    barcodePicker.destroy();
});
test.serial("reassignOriginElement", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const element1 = document.createElement("div");
    const element2 = document.createElement("div");
    const barcodePicker = await BarcodePicker.create(element1, {
        accessCamera: false
    });
    t.deepEqual(barcodePicker.barcodePickerGui.originElement, element1);
    t.notDeepEqual(barcodePicker.barcodePickerGui.originElement, element2);
    barcodePicker.reassignOriginElement(document.createElement("div"));
    t.deepEqual(barcodePicker.barcodePickerGui.originElement, element2);
    t.notDeepEqual(barcodePicker.barcodePickerGui.originElement, element1);
});
test.serial("setTargetScanningFPS", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false
    });
    t.is(barcodePicker.targetScanningFPS, 30);
    barcodePicker.setTargetScanningFPS(10);
    t.is(barcodePicker.targetScanningFPS, 10);
    barcodePicker.setTargetScanningFPS(0);
    t.is(barcodePicker.targetScanningFPS, 10);
    barcodePicker.destroy();
});
test.serial("clearSession", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const s = new Scanner();
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        scanner: s
    });
    const clearSessionSpy = sinon.spy(s, "clearSession");
    t.is(clearSessionSpy.callCount, 0);
    barcodePicker.clearSession();
    t.is(clearSessionSpy.callCount, 1);
    barcodePicker.destroy();
});
test.serial("isReady & onReady", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const s = new Scanner();
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        scanner: s
    });
    const callbackSpy1 = sinon.spy();
    const callbackSpy2 = sinon.spy();
    const callbackSpy3 = sinon.spy();
    const callbackSpy4 = sinon.spy();
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
});
test.serial("onScan & removeScanListener & removeScanListeners", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const s = new Scanner();
    const imageSettings = {
        width: 2,
        height: 2,
        format: ImageSettings.Format.GRAY_8U
    };
    s.applyImageSettings(imageSettings);
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        scanner: s
    });
    const callbackSpy1 = sinon.spy();
    const callbackSpy2 = sinon.spy();
    const callbackSpy3 = sinon.spy();
    barcodePicker.onScan(callbackSpy1);
    barcodePicker.onScan(callbackSpy2);
    barcodePicker.onScan(callbackSpy3, true);
    t.false(callbackSpy1.called);
    t.false(callbackSpy2.called);
    t.false(callbackSpy3.called);
    s.engineWorkerOnMessage({
        data: ["status", "ready"]
    });
    sinon.stub(barcodePicker.barcodePickerGui, "getVideoImageData").callsFake(() => {
        return new Uint8ClampedArray(4);
    });
    sinon.stub(s, "processImage").callsFake(() => {
        return Promise.resolve({
            barcodes: [],
            imageData: new Uint8ClampedArray(4),
            imageSettings
        });
    });
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 0);
    t.is(callbackSpy2.callCount, 0);
    t.is(callbackSpy3.callCount, 0);
    const scanResult = {
        barcodes: [
            {
                symbology: Barcode.Symbology.QR,
                compositeFlag: Barcode.CompositeFlag.NONE,
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
            format: ImageSettings.Format.GRAY_8U
        }
    };
    s.processImage.restore();
    sinon.stub(s, "processImage").callsFake(() => {
        return Promise.resolve(scanResult);
    });
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 1);
    t.is(callbackSpy2.callCount, 1);
    t.is(callbackSpy3.callCount, 1);
    t.deepEqual(callbackSpy1.getCall(0).args, [scanResult]);
    t.deepEqual(callbackSpy2.getCall(0).args, [scanResult]);
    t.deepEqual(callbackSpy3.getCall(0).args, [scanResult]);
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 2);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.removeScanListener(callbackSpy1);
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 3);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.removeScanListeners();
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 3);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.destroy();
});
test.serial("onSubmitFrame & removeSubmitFrameListener & removeSubmitFrameListeners", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const s = new Scanner();
    const imageSettings = {
        width: 2,
        height: 2,
        format: ImageSettings.Format.GRAY_8U
    };
    s.applyImageSettings(imageSettings);
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        scanner: s
    });
    const callbackSpy1 = sinon.spy();
    const callbackSpy2 = sinon.spy();
    const callbackSpy3 = sinon.spy();
    barcodePicker.onSubmitFrame(callbackSpy1);
    barcodePicker.onSubmitFrame(callbackSpy2);
    barcodePicker.onSubmitFrame(callbackSpy3, true);
    t.false(callbackSpy1.called);
    t.false(callbackSpy2.called);
    t.false(callbackSpy3.called);
    s.engineWorkerOnMessage({
        data: ["status", "ready"]
    });
    sinon.stub(barcodePicker.barcodePickerGui, "getVideoImageData").callsFake(() => {
        return new Uint8ClampedArray(4);
    });
    const scanResult = {
        barcodes: [],
        imageData: new Uint8ClampedArray(4),
        imageSettings
    };
    sinon.stub(s, "processImage").callsFake(() => {
        return Promise.resolve({
            ...scanResult,
            barcodes: [
                {
                    symbology: Barcode.Symbology.QR,
                    compositeFlag: Barcode.CompositeFlag.NONE,
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
            ]
        });
    });
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 1);
    t.is(callbackSpy2.callCount, 1);
    t.is(callbackSpy3.callCount, 1);
    t.deepEqual(callbackSpy1.getCall(0).args, [scanResult]);
    t.deepEqual(callbackSpy2.getCall(0).args, [scanResult]);
    t.deepEqual(callbackSpy3.getCall(0).args, [scanResult]);
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 2);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.removeSubmitFrameListener(callbackSpy1);
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 3);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.removeSubmitFrameListeners();
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 3);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.destroy();
});
test.serial("onScanError & removeScanErrorListener & removeScanErrorListeners", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const s = new Scanner();
    const imageSettings = {
        width: 2,
        height: 2,
        format: ImageSettings.Format.GRAY_8U
    };
    s.applyImageSettings(imageSettings);
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        scanner: s
    });
    const callbackSpy1 = sinon.spy();
    const callbackSpy2 = sinon.spy();
    const callbackSpy3 = sinon.spy();
    barcodePicker.onScanError(callbackSpy1);
    barcodePicker.onScanError(callbackSpy2);
    barcodePicker.onScanError(callbackSpy3, true);
    t.false(callbackSpy1.called);
    t.false(callbackSpy2.called);
    t.false(callbackSpy3.called);
    s.engineWorkerOnMessage({
        data: ["status", "ready"]
    });
    sinon.stub(barcodePicker.barcodePickerGui, "getVideoImageData").callsFake(() => {
        return new Uint8ClampedArray(4);
    });
    sinon.stub(s, "processImage").callsFake(() => {
        return Promise.resolve({
            barcodes: [],
            imageData: new Uint8ClampedArray(4),
            imageSettings
        });
    });
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 0);
    t.is(callbackSpy2.callCount, 0);
    t.is(callbackSpy3.callCount, 0);
    const scanError = new CustomError({
        name: "ScanditEngineError",
        message: `Test error`
    });
    s.processImage.restore();
    sinon.stub(s, "processImage").callsFake(() => {
        return Promise.reject(scanError);
    });
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 1);
    t.is(callbackSpy2.callCount, 1);
    t.is(callbackSpy3.callCount, 1);
    t.deepEqual(callbackSpy1.getCall(0).args, [scanError]);
    t.deepEqual(callbackSpy2.getCall(0).args, [scanError]);
    t.deepEqual(callbackSpy3.getCall(0).args, [scanError]);
    barcodePicker.resumeScanning();
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 2);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.removeScanErrorListener(callbackSpy1);
    barcodePicker.resumeScanning();
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 3);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.removeScanErrorListeners();
    barcodePicker.resumeScanning();
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 3);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.destroy();
});
test.serial("onProcessFrame & removeProcessFrameListener & removeProcessFrameListeners", async (t) => {
    fakeFullCompatibleBrowser();
    await configure("license_key");
    const s = new Scanner();
    const imageSettings = {
        width: 2,
        height: 2,
        format: ImageSettings.Format.GRAY_8U
    };
    s.applyImageSettings(imageSettings);
    const barcodePicker = await BarcodePicker.create(document.createElement("div"), {
        accessCamera: false,
        scanner: s
    });
    const callbackSpy1 = sinon.spy();
    const callbackSpy2 = sinon.spy();
    const callbackSpy3 = sinon.spy();
    barcodePicker.onProcessFrame(callbackSpy1);
    barcodePicker.onProcessFrame(callbackSpy2);
    barcodePicker.onProcessFrame(callbackSpy3, true);
    t.false(callbackSpy1.called);
    t.false(callbackSpy2.called);
    t.false(callbackSpy3.called);
    s.engineWorkerOnMessage({
        data: ["status", "ready"]
    });
    sinon.stub(barcodePicker.barcodePickerGui, "getVideoImageData").callsFake(() => {
        return new Uint8ClampedArray(4);
    });
    const scanResult = {
        barcodes: [],
        imageData: new Uint8ClampedArray(4),
        imageSettings
    };
    sinon.stub(s, "processImage").callsFake(() => {
        return Promise.resolve(scanResult);
    });
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 1);
    t.is(callbackSpy2.callCount, 1);
    t.is(callbackSpy3.callCount, 1);
    t.deepEqual(callbackSpy1.getCall(0).args, [scanResult]);
    t.deepEqual(callbackSpy2.getCall(0).args, [scanResult]);
    t.deepEqual(callbackSpy3.getCall(0).args, [scanResult]);
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 2);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.removeProcessFrameListener(callbackSpy1);
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 3);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.removeProcessFrameListeners();
    await barcodePicker.processVideoFrame(true);
    t.is(callbackSpy1.callCount, 2);
    t.is(callbackSpy2.callCount, 3);
    t.is(callbackSpy3.callCount, 1);
    barcodePicker.destroy();
});
//# sourceMappingURL=barcodePicker.spec.js.map