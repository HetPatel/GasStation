/* tslint:disable:no-implicit-dependencies */
/**
 * BarcodePicker tests
 */
import test from "ava";
import crypto from "crypto";
import indexedDB from "fake-indexeddb";
import fs from "fs";
import { Response } from "node-fetch";
import * as sinon from "sinon";
import sourceMapSupport from "source-map-support";
import { ImageSettings } from "../imageSettings";
import { Parser } from "../parser";
import { ScanSettings } from "../scanSettings";
import { engine } from "./engineWorker";
sourceMapSupport.install();
async function wait(ms) {
    return new Promise(resolve => {
        // tslint:disable-next-line no-string-based-set-timeout
        setTimeout(resolve, ms);
    });
}
let moduleInstance;
Object.defineProperty(self, "window", {
    writable: true
});
Object.defineProperty(self, "document", {
    writable: true
});
global.self = global;
global.crypto = {
    subtle: {
        digest: (_, data) => {
            return Promise.resolve(crypto
                .createHash("sha256")
                .update(new DataView(data))
                .digest());
        }
    }
};
global.fetch = (filePath) => {
    return new Promise((resolve, reject) => {
        filePath = filePath.split("?")[0];
        // tslint:disable-next-line:non-literal-fs-path
        if (!fs.existsSync(filePath)) {
            reject(new Error(`File not found: ${filePath}`));
        }
        // tslint:disable-next-line:non-literal-fs-path
        const readStream = fs.createReadStream(filePath, {
            highWaterMark: 4194304
        });
        readStream.on("open", () => {
            resolve(new Response(readStream));
        });
    });
};
function setupSpyModuleFunctions(m) {
    m.HEAPU8 = new Uint8Array(1);
    m.HEAPU8.set = (a, p) => {
        p.a = a;
    };
    m.lengthBytesUTF8 = sinon.spy();
    m.UTF8ToString = sinon.spy((p) => {
        return p.s;
    });
    m.stringToUTF8 = sinon.spy((s, p) => {
        p.s = s;
    });
    m._malloc = sinon.spy(() => {
        return {};
    });
    m._free = sinon.spy();
    m._create_context = sinon.spy();
    m._scanner_settings_new_from_json = sinon.spy((p) => {
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
    m._scanner_scan = sinon.spy((imageData) => {
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
    m._parser_parse_string = sinon.spy((parserType) => {
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
global.importScripts = (filePath) => {
    filePath = filePath.split("?")[0];
    // tslint:disable-next-line:non-literal-fs-path
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    moduleInstance = self.Module;
    setupSpyModuleFunctions(moduleInstance);
    return new Promise(resolve => {
        // Retrieve wasmJSVersion variable
        // tslint:disable-next-line:non-literal-fs-path
        const readStream = fs.createReadStream(filePath, { encoding: "utf8" });
        readStream.on("readable", () => {
            let dataString = "";
            let character = readStream.read(1);
            while (character !== ";") {
                dataString += character;
                character = readStream.read(1);
            }
            readStream.destroy();
            const regexMatch = dataString.match(/"(.+)"/);
            if (regexMatch != null) {
                self.wasmJSVersion = regexMatch[1];
            }
            moduleInstance.instantiateWasm({ env: {} }, () => {
                moduleInstance.preRun();
                resolve();
            });
        });
    });
};
global.indexedDB = indexedDB;
global.FS = {
    mkdir: sinon.spy(),
    mount: sinon.spy(),
    syncfs: (_, callback) => {
        callback(undefined);
    }
};
global.IDBFS = null;
global.WebAssembly.instantiateStreaming = () => {
    return Promise.reject();
};
global.WebAssembly.instantiate = () => {
    return Promise.resolve({
        module: "module",
        instance: "instance"
    });
};
const postMessageSpy = sinon.spy();
global.postMessage = postMessageSpy;
test.serial("engine load", async (t) => {
    const engineInstance = engine();
    await t.throwsAsync(engineInstance.loadLibrary("fakeDeviceId", "./wrong-path/", "fakePath"));
    const instantiateStub = sinon.stub(global.WebAssembly, "instantiate").rejects();
    engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath");
    await wait(2000);
    t.true(instantiateStub.called);
    t.false(moduleInstance.callMain.called);
    instantiateStub.restore();
    await engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath");
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
        format: ImageSettings.Format.RGBA_8U
    });
    engineInstance.setImageSettings({
        width: 1,
        height: 1,
        format: ImageSettings.Format.RGBA_8U
    }); // Set image settings again
    engineInstance.addScanWorkUnit({
        requestId: 0,
        data: new Uint8ClampedArray([0, 0, 0, 0]),
        highQualitySingleFrameMode: true
    }); // Add work unit to allow settings to be set
    engineInstance.setSettings(new ScanSettings().toJSONString());
    engineInstance.clearSession();
});
test.serial("engine scan", async (t) => {
    postMessageSpy.resetHistory();
    const engineInstance = engine();
    await engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath");
    t.true(moduleInstance.callMain.called);
    t.is(postMessageSpy.calledOnceWithExactly(["status", "ready"]), true);
    engineInstance.createContext("");
    engineInstance.addScanWorkUnit({
        requestId: 0,
        data: new Uint8ClampedArray([0, 0, 0, 0]),
        highQualitySingleFrameMode: true
    }); // Try to add work unit with non-ready engine
    t.is(postMessageSpy.callCount, 1);
    engineInstance.setSettings(new ScanSettings().toJSONString());
    engineInstance.setImageSettings({
        width: 1,
        height: 1,
        format: ImageSettings.Format.RGBA_8U
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
        format: ImageSettings.Format.RGB_8U
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
        format: ImageSettings.Format.GRAY_8U
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
});
test.serial("engine scan error", async (t) => {
    postMessageSpy.resetHistory();
    const engineInstance = engine();
    await engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath");
    t.true(moduleInstance.callMain.called);
    t.is(postMessageSpy.calledOnceWithExactly(["status", "ready"]), true);
    engineInstance.createContext("");
    engineInstance.setSettings(new ScanSettings().toJSONString());
    engineInstance.setImageSettings({
        width: 1,
        height: 1,
        format: ImageSettings.Format.GRAY_8U
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
});
test.serial("engine parse", async (t) => {
    postMessageSpy.resetHistory();
    const engineInstance = engine();
    await engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath");
    t.true(moduleInstance.callMain.called);
    t.is(postMessageSpy.calledOnceWithExactly(["status", "ready"]), true);
    engineInstance.addParseWorkUnit({
        requestId: 0,
        dataFormat: Parser.DataFormat.DLID,
        dataString: "test",
        options: JSON.stringify({})
    }); // Try to add work unit with non-ready engine
    t.is(postMessageSpy.callCount, 1);
    engineInstance.createContext("");
    engineInstance.addParseWorkUnit({
        requestId: 1,
        dataFormat: Parser.DataFormat.GS1_AI,
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
        dataFormat: Parser.DataFormat.HIBC,
        dataString: "test",
        options: JSON.stringify({})
    });
    engineInstance.addParseWorkUnit({
        requestId: 3,
        dataFormat: Parser.DataFormat.MRTD,
        dataString: "test",
        options: JSON.stringify({})
    });
    engineInstance.addParseWorkUnit({
        requestId: 4,
        dataFormat: Parser.DataFormat.SWISSQR,
        dataString: "test",
        options: JSON.stringify({})
    });
    t.is(postMessageSpy.callCount, 6);
});
test.serial("engine parse error", async (t) => {
    postMessageSpy.resetHistory();
    const engineInstance = engine();
    await engineInstance.loadLibrary("fakeDeviceId", "./build/", "fakePath");
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
});
//# sourceMappingURL=engineWorker.spec.js.map