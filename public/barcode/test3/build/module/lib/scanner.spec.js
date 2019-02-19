/* tslint:disable:no-implicit-dependencies */
/* tslint:disable:insecure-random */
/**
 * Scanner tests
 */
import test from "ava";
import * as sinon from "sinon";
import { Barcode, BrowserHelper, configure, ImageSettings, Parser, Scanner, ScanSettings } from "..";
const postMessageStub = sinon.stub();
const terminateStub = sinon.stub();
const stubs = [postMessageStub, terminateStub];
global.Worker = sinon.stub().returns({
    postMessage: postMessageStub,
    terminate: terminateStub
});
URL.createObjectURL = sinon.stub();
function resetStubs() {
    stubs.forEach(mock => {
        mock.resetHistory();
    });
}
async function prepareBrowserAndLibrary() {
    BrowserHelper.checkBrowserCompatibility = () => {
        return {
            fullSupport: true,
            scannerSupport: true,
            missingFeatures: []
        };
    };
    await configure("license_key");
}
test.serial("constructor", async (t) => {
    let s;
    let error = t.throws(() => {
        s = new Scanner();
    });
    t.is(error.name, "UnsupportedBrowserError");
    BrowserHelper.checkBrowserCompatibility = () => {
        return {
            fullSupport: true,
            scannerSupport: true,
            missingFeatures: []
        };
    };
    error = t.throws(() => {
        s = new Scanner();
    });
    t.is(error.name, "LibraryNotConfiguredError");
    await configure("license_key");
    resetStubs();
    s = new Scanner();
    t.false(s.isReady());
    t.false(s.isBusyProcessing());
    t.is(postMessageStub.callCount, 3);
    t.deepEqual(postMessageStub.getCall(0).args, [
        {
            deviceId: BrowserHelper.getDeviceId(),
            libraryLocation: "https://example.com/",
            path: "/",
            type: "load-library"
        }
    ]);
    t.deepEqual(postMessageStub.getCall(1).args, [
        {
            licenseKey: "license_key",
            type: "license-key"
        }
    ]);
    t.deepEqual(postMessageStub.getCall(2).args, [
        {
            settings: new ScanSettings().toJSONString(),
            type: "settings"
        }
    ]);
    resetStubs();
    const ss = new ScanSettings({
        enabledSymbologies: Barcode.Symbology.QR,
        codeDuplicateFilter: 10,
        maxNumberOfCodesPerFrame: 10,
        searchArea: { x: 0.5, y: 0.5, width: 0.5, height: 0.1 }
    });
    s = new Scanner({
        scanSettings: ss
    });
    t.is(postMessageStub.callCount, 3);
    t.deepEqual(postMessageStub.getCall(2).args, [
        {
            settings: ss.toJSONString(),
            type: "settings"
        }
    ]);
    resetStubs();
    const is = {
        width: 640,
        height: 480,
        format: ImageSettings.Format.RGBA_8U
    };
    s = new Scanner({
        imageSettings: is
    });
    t.is(postMessageStub.callCount, 4);
    t.deepEqual(postMessageStub.getCall(3).args, [
        {
            imageSettings: is,
            type: "image-settings"
        }
    ]);
});
test.serial("destroy", async (t) => {
    await prepareBrowserAndLibrary();
    resetStubs();
    let s = new Scanner();
    s.destroy();
    t.true(terminateStub.called);
    resetStubs();
    s = new Scanner();
    s.engineWorker = null;
    s.destroy();
    t.false(terminateStub.called);
});
test.serial("applyScanSettings", async (t) => {
    await prepareBrowserAndLibrary();
    resetStubs();
    const ss = new ScanSettings({
        enabledSymbologies: Barcode.Symbology.QR,
        codeDuplicateFilter: 10,
        maxNumberOfCodesPerFrame: 10,
        searchArea: { x: 0.5, y: 0.5, width: 0.5, height: 0.1 }
    });
    const s = new Scanner();
    t.is(postMessageStub.callCount, 3);
    t.deepEqual(postMessageStub.getCall(2).args, [
        {
            settings: new ScanSettings().toJSONString(),
            type: "settings"
        }
    ]);
    s.applyScanSettings(ss);
    t.is(postMessageStub.callCount, 4);
    t.deepEqual(postMessageStub.getCall(3).args, [
        {
            settings: ss.toJSONString(),
            type: "settings"
        }
    ]);
});
test.serial("applyImageSettings", async (t) => {
    await prepareBrowserAndLibrary();
    resetStubs();
    const is = {
        width: 640,
        height: 480,
        format: ImageSettings.Format.RGBA_8U
    };
    const s = new Scanner();
    t.is(postMessageStub.callCount, 3);
    t.deepEqual(postMessageStub.getCall(2).args, [
        {
            settings: new ScanSettings().toJSONString(),
            type: "settings"
        }
    ]);
    s.applyImageSettings(is);
    t.is(postMessageStub.callCount, 4);
    t.deepEqual(postMessageStub.getCall(3).args, [
        {
            imageSettings: is,
            type: "image-settings"
        }
    ]);
});
test.serial("clearSession", async (t) => {
    await prepareBrowserAndLibrary();
    resetStubs();
    const s = new Scanner();
    t.is(postMessageStub.callCount, 3);
    s.clearSession();
    t.is(postMessageStub.callCount, 4);
    t.deepEqual(postMessageStub.getCall(3).args, [
        {
            type: "clear-session"
        }
    ]);
});
test.serial("isReady & onReady", async (t) => {
    await prepareBrowserAndLibrary();
    resetStubs();
    let s = new Scanner();
    const callbackSpy1 = sinon.spy();
    const callbackSpy2 = sinon.spy();
    t.false(s.isReady());
    s.onReady(callbackSpy1);
    s.onReady(callbackSpy2);
    t.false(callbackSpy1.called);
    t.false(callbackSpy2.called);
    s.engineWorkerOnMessage({
        data: ["status", "example-not-ready"]
    });
    t.false(s.isReady());
    t.false(callbackSpy1.called);
    t.false(callbackSpy2.called);
    s.engineWorkerOnMessage({
        data: ["status", "ready"]
    });
    t.true(s.isReady());
    t.true(callbackSpy1.called);
    t.true(callbackSpy2.called);
    t.true(callbackSpy2.calledAfter(callbackSpy1));
    resetStubs();
    s = new Scanner();
    s.engineWorkerOnMessage({
        data: ["status", "ready"]
    });
    const callbackSpy3 = sinon.spy();
    t.true(s.isReady());
    s.onReady(callbackSpy3);
    t.true(callbackSpy3.called);
});
test.serial("processImage calls", async (t) => {
    await prepareBrowserAndLibrary();
    const s = new Scanner();
    resetStubs();
    let error = await t.throwsAsync(s.processImage(new Uint8ClampedArray(0)));
    t.is(error.name, "NoImageSettings");
    t.is(s.workerScanRequestId, 0);
    t.is(s.workerScanQueueLength, 0);
    t.false(s.isBusyProcessing());
    t.false(postMessageStub.called);
    s.applyImageSettings({
        width: 3,
        height: 2,
        format: ImageSettings.Format.RGBA_8U
    });
    resetStubs();
    error = await t.throwsAsync(s.processImage(new Uint8ClampedArray(0)));
    t.is(error.name, "ImageSettingsDataMismatch");
    t.is(s.workerScanRequestId, 0);
    t.is(s.workerScanQueueLength, 0);
    t.false(s.isBusyProcessing());
    t.false(postMessageStub.called);
    resetStubs();
    let imageData = Uint8ClampedArray.from({ length: 24 }, () => {
        return Math.floor(Math.random() * 255);
    });
    s.processImage(imageData); // 3 * 2 * 4
    t.true(s.isBusyProcessing());
    t.is(postMessageStub.callCount, 1);
    t.deepEqual(postMessageStub.getCall(0).args, [
        {
            type: "work",
            requestId: 1,
            data: imageData,
            highQualitySingleFrameMode: false
        }
    ]);
    s.applyImageSettings({
        width: 3,
        height: 2,
        format: ImageSettings.Format.RGB_8U
    });
    resetStubs();
    imageData = Uint8ClampedArray.from({ length: 18 }, () => {
        return Math.floor(Math.random() * 255);
    });
    s.processImage(imageData); // 3 * 2 * 3
    t.is(postMessageStub.callCount, 1);
    t.deepEqual(postMessageStub.getCall(0).args, [
        {
            type: "work",
            requestId: 2,
            data: imageData,
            highQualitySingleFrameMode: false
        }
    ]);
    s.applyImageSettings({
        width: 3,
        height: 2,
        format: ImageSettings.Format.GRAY_8U
    });
    resetStubs();
    imageData = Uint8ClampedArray.from({ length: 6 }, () => {
        return Math.floor(Math.random() * 255);
    });
    s.processImage(imageData); // 3 * 2 * 1
    t.is(postMessageStub.callCount, 1);
    t.deepEqual(postMessageStub.getCall(0).args, [
        {
            type: "work",
            requestId: 3,
            data: imageData,
            highQualitySingleFrameMode: false
        }
    ]);
    s.applyImageSettings({
        width: 3,
        height: 2,
        format: 999 // Fake format
    });
    resetStubs();
    imageData = Uint8ClampedArray.from({ length: 6 }, () => {
        return Math.floor(Math.random() * 255);
    });
    s.processImage(imageData); // 3 * 2 * 1
    t.is(s.workerScanRequestId, 4);
    t.is(s.workerScanQueueLength, 4);
    t.is(postMessageStub.callCount, 1);
    t.deepEqual(postMessageStub.getCall(0).args, [
        {
            type: "work",
            requestId: 4,
            data: imageData,
            highQualitySingleFrameMode: false
        }
    ]);
});
test.serial("processImage highQualitySingleFrameMode calls", async (t) => {
    await prepareBrowserAndLibrary();
    const s = new Scanner();
    resetStubs();
    let error = await t.throwsAsync(s.processImage(new Uint8ClampedArray(0), true));
    t.is(error.name, "NoImageSettings");
    t.is(s.workerScanRequestId, 0);
    t.is(s.workerScanQueueLength, 0);
    t.false(s.isBusyProcessing());
    t.false(postMessageStub.called);
    s.applyImageSettings({
        width: 3,
        height: 2,
        format: ImageSettings.Format.RGBA_8U
    });
    resetStubs();
    error = await t.throwsAsync(s.processImage(new Uint8ClampedArray(0), true));
    t.is(error.name, "ImageSettingsDataMismatch");
    t.is(s.workerScanRequestId, 0);
    t.is(s.workerScanQueueLength, 0);
    t.false(s.isBusyProcessing());
    t.false(postMessageStub.called);
    resetStubs();
    const imageData = Uint8ClampedArray.from({ length: 24 }, () => {
        return Math.floor(Math.random() * 255);
    });
    s.processImage(imageData, true); // 3 * 2 * 4
    t.true(s.isBusyProcessing());
    t.is(postMessageStub.callCount, 1);
    t.deepEqual(postMessageStub.getCall(0).args, [
        {
            type: "work",
            requestId: 1,
            data: imageData,
            highQualitySingleFrameMode: true
        }
    ]);
});
// tslint:disable-next-line:max-func-body-length
test.serial("processImage scan results", async (t) => {
    await prepareBrowserAndLibrary();
    resetStubs();
    const s = new Scanner();
    const imageSettings = {
        width: 3,
        height: 2,
        format: ImageSettings.Format.RGBA_8U
    };
    s.applyImageSettings(imageSettings);
    const imageData1 = Uint8ClampedArray.from({ length: 24 }, () => {
        return Math.floor(Math.random() * 255);
    });
    const processImage1 = s.processImage(imageData1); // 3 * 2 * 4
    t.true(s.isBusyProcessing());
    const imageData2 = Uint8ClampedArray.from({ length: 24 }, () => {
        return Math.floor(Math.random() * 255);
    });
    const processImage2 = s.processImage(imageData2); // 3 * 2 * 4
    const imageData3 = Uint8ClampedArray.from({ length: 24 }, () => {
        return Math.floor(Math.random() * 255);
    });
    const processImage3 = s.processImage(imageData3); // 3 * 2 * 4
    t.is(s.workerScanRequestId, 3);
    t.is(s.workerScanQueueLength, 3);
    s.engineWorkerOnMessage({
        data: [
            "work-error",
            {
                requestId: 2,
                error: {
                    errorCode: 123,
                    errorMessage: "example_error"
                }
            }
        ]
    });
    const error = await t.throwsAsync(processImage2);
    t.deepEqual(error.message, "example_error (123)");
    t.is(s.workerScanQueueLength, 2);
    s.engineWorkerOnMessage({
        data: [
            "work-result",
            {
                requestId: 1,
                result: {
                    scanResult: [],
                    matrixScanResult: {
                        barcodesAppeared: [],
                        barcodesUpdated: [],
                        barcodesLost: [],
                        barcodesPredicted: []
                    }
                }
            }
        ]
    });
    let scanResult = await processImage1;
    t.deepEqual(scanResult, {
        barcodes: [],
        imageData: imageData1,
        imageSettings
    });
    t.is(s.workerScanQueueLength, 1);
    s.engineWorkerOnMessage({
        data: [
            "work-result",
            {
                requestId: 3,
                result: {
                    scanResult: [
                        {
                            symbology: Barcode.Symbology.QR,
                            rawData: [97, 98, 99, 100],
                            location: [[1, 2], [3, 4], [5, 6], [7, 8]],
                            compositeFlag: Barcode.CompositeFlag.NONE,
                            isGs1DataCarrier: false,
                            encodingArray: [],
                            isRecognized: true
                        }
                    ],
                    matrixScanResult: {
                        barcodesAppeared: [],
                        barcodesUpdated: [],
                        barcodesLost: [],
                        barcodesPredicted: []
                    }
                }
            }
        ]
    });
    scanResult = await processImage3;
    t.deepEqual(scanResult, {
        barcodes: [
            {
                compositeFlag: Barcode.CompositeFlag.NONE,
                data: "abcd",
                encodingArray: [],
                isGs1DataCarrier: false,
                location: {
                    bottomLeft: {
                        x: 7,
                        y: 8
                    },
                    bottomRight: {
                        x: 5,
                        y: 6
                    },
                    topLeft: {
                        x: 1,
                        y: 2
                    },
                    topRight: {
                        x: 3,
                        y: 4
                    }
                },
                rawData: new Uint8Array([97, 98, 99, 100]),
                symbology: Barcode.Symbology.QR
            }
        ],
        imageData: imageData3,
        imageSettings
    });
    t.is(s.workerScanQueueLength, 0);
    s.engineWorkerOnMessage({
        data: []
    });
});
test.serial("getImageSettings", async (t) => {
    await prepareBrowserAndLibrary();
    resetStubs();
    const ss = {
        width: 640,
        height: 480,
        format: ImageSettings.Format.RGBA_8U
    };
    const s = new Scanner();
    t.is(s.getImageSettings(), undefined);
    s.applyImageSettings(ss);
    t.deepEqual(s.getImageSettings(), ss);
});
test.serial("getScanSettings", async (t) => {
    await prepareBrowserAndLibrary();
    resetStubs();
    const ss = new ScanSettings({
        enabledSymbologies: Barcode.Symbology.QR,
        codeDuplicateFilter: 10,
        maxNumberOfCodesPerFrame: 10,
        searchArea: { x: 0.5, y: 0.5, width: 0.5, height: 0.1 }
    });
    const s = new Scanner();
    t.deepEqual(s.getScanSettings(), new ScanSettings());
    s.applyScanSettings(ss);
    t.deepEqual(s.getScanSettings(), ss);
});
// tslint:disable-next-line:max-func-body-length
test.serial("createParserForFormat & parseString", async (t) => {
    await prepareBrowserAndLibrary();
    const s = new Scanner();
    resetStubs();
    const parser = s.createParserForFormat(Parser.DataFormat.DLID);
    t.not(parser, null);
    t.is(s.workerParseRequestId, 0);
    t.false(s.isBusyProcessing());
    t.false(postMessageStub.called);
    const parseString1 = s.parseString(Parser.DataFormat.DLID, "abcd");
    t.is(s.workerParseRequestId, 1);
    t.false(s.isBusyProcessing());
    t.is(postMessageStub.callCount, 1);
    t.deepEqual(postMessageStub.getCall(0).args, [
        {
            type: "parse-string",
            requestId: 1,
            dataFormat: Parser.DataFormat.DLID,
            dataString: "abcd",
            options: "{}"
        }
    ]);
    resetStubs();
    const parseString2 = s.parseString(Parser.DataFormat.GS1_AI, "efgh");
    t.is(s.workerParseRequestId, 2);
    t.false(s.isBusyProcessing());
    t.is(postMessageStub.callCount, 1);
    t.deepEqual(postMessageStub.getCall(0).args, [
        {
            type: "parse-string",
            requestId: 2,
            dataFormat: Parser.DataFormat.GS1_AI,
            dataString: "efgh",
            options: "{}"
        }
    ]);
    resetStubs();
    const parseString3 = s.parseString(Parser.DataFormat.HIBC, "ijkl", {
        exampleOption: true
    });
    t.is(s.workerParseRequestId, 3);
    t.false(s.isBusyProcessing());
    t.is(postMessageStub.callCount, 1);
    t.deepEqual(postMessageStub.getCall(0).args, [
        {
            type: "parse-string",
            requestId: 3,
            dataFormat: Parser.DataFormat.HIBC,
            dataString: "ijkl",
            options: '{"exampleOption":true}'
        }
    ]);
    resetStubs();
    s.engineWorkerOnMessage({
        data: [
            "parse-string-error",
            {
                requestId: 2,
                error: {
                    errorCode: 123,
                    errorMessage: "example_error"
                }
            }
        ]
    });
    const error = await t.throwsAsync(parseString2);
    t.deepEqual(error.message, "example_error (123)");
    const resultData = [
        {
            name: "field1",
            parsed: 1,
            rawString: "123"
        },
        {
            name: "field2",
            parsed: "abcd",
            rawString: "efgh"
        },
        {
            name: "field3",
            parsed: {
                subField1: 1,
                subField2: 2
            },
            rawString: "sf1sf2"
        }
    ];
    s.engineWorkerOnMessage({
        data: [
            "parse-string-result",
            {
                requestId: 1,
                result: JSON.stringify(resultData)
            }
        ]
    });
    let parserResult = await parseString1;
    const fieldsByName = {};
    resultData.forEach(parserField => {
        fieldsByName[parserField.name] = parserField;
    });
    t.deepEqual(parserResult, {
        fields: resultData,
        fieldsByName: fieldsByName,
        jsonString: JSON.stringify(resultData)
    });
    s.engineWorkerOnMessage({
        data: [
            "parse-string-result",
            {
                requestId: 3,
                result: JSON.stringify([])
            }
        ]
    });
    parserResult = await parseString3;
    t.deepEqual(parserResult, {
        fields: [],
        fieldsByName: {},
        jsonString: JSON.stringify([])
    });
});
//# sourceMappingURL=scanner.spec.js.map