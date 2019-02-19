"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @hidden
 * @returns Engine
 */
// tslint:disable-next-line:max-func-body-length
function engine() {
    var dbName = "scandit_wasm_cache";
    var dbStoreName = "scandit_wasm_cache";
    var dbStoreKey = "wasm";
    var scanQueue = [];
    var parseQueue = [];
    var gpuAccelerationAvailable = typeof self.OffscreenCanvas === "function";
    var imageBufferPointer;
    var licenseKey;
    var settings;
    var imageSettings;
    var scanWorkSubmitted = false;
    var wasmLoaded = false;
    var scannerSettingsReady = false;
    var scannerImageSettingsReady = false;
    var contextAvailable = false;
    var blurryDecodingEnabled = false;
    var fsSyncInProgress;
    var fsSyncScheduled = false;
    var db;
    // Public
    // Promise is used only during testing
    function loadLibrary(deviceId, libraryLocation, locationPath) {
        var _a = getLibraryLocationURIs(libraryLocation), jsURI = _a.jsURI, wasmURI = _a.wasmURI;
        var customModule = {
            arguments: [deviceId],
            canvas: gpuAccelerationAvailable ? new self.OffscreenCanvas(32, 32) : undefined,
            instantiateWasm: function (importObject, successCallback) {
                // wasmJSVersion is globally defined inside scandit-engine-sdk.min.js
                var wasmJSVersion = self.wasmJSVersion;
                // istanbul ignore if
                if (wasmJSVersion == null) {
                    wasmJSVersion = "undefined";
                }
                // istanbul ignore if
                if (wasmJSVersion !== "4.1.1") {
                    console.error("The Scandit SDK Engine library JS file found at " + jsURI + " seems invalid: " +
                        ("expected version doesn't match (received: " + wasmJSVersion + ", expected: " + "4.1.1" + "). ") +
                        "Please ensure the correct Scandit SDK Engine file (with correct version) is retrieved.");
                }
                var wasmVersion = "4.1.1"
                    .split(".")
                    .map(function (n, i) { return parseInt(n, 10) * Math.pow(10, 6 - i * 3); })
                    .reduce(function (a, b) { return a + b; });
                instantiateWasmWithCache(wasmURI, wasmVersion, importObject, successCallback);
                return {};
            },
            noInitialRun: true,
            preRun: function () {
                try {
                    FS.mkdir("/scandit_sync_folder");
                }
                catch (error) {
                    // istanbul ignore next
                    if (error.code !== "EEXIST") {
                        throw error;
                    }
                }
                FS.mount(IDBFS, {}, "/scandit_sync_folder");
                FS.syncfs(true, function () {
                    Module.callMain();
                    wasmLoaded = true;
                    postMessage(["status", "ready"]);
                    workOnScanQueue();
                    workOnParseQueue();
                });
            }
        };
        self.window = self.document = self; // Fix some Emscripten quirks
        self.Module = customModule;
        self.path = locationPath; // Used by the Internal Scandit Engine
        try {
            return importScripts(jsURI);
        }
        catch (error) {
            console.warn(error);
            console.error("Couldn't retrieve Scandit SDK Engine library at " + jsURI + ", did you configure the path for it correctly?");
            return Promise.reject(error);
        }
    }
    function createContext(newLicenseKey) {
        licenseKey = newLicenseKey;
        if (contextAvailable || licenseKey == null || !wasmLoaded) {
            return;
        }
        var licenseKeyLength = Module.lengthBytesUTF8(licenseKey) + 1;
        var licenseKeyPointer = Module._malloc(licenseKeyLength);
        Module.stringToUTF8(licenseKey, licenseKeyPointer, licenseKeyLength);
        Module._create_context(licenseKeyPointer, false);
        Module._free(licenseKeyPointer);
        contextAvailable = true;
    }
    function setBlurryDecodingEnabled(enabled) {
        blurryDecodingEnabled = enabled;
        applySettings();
    }
    function setSettings(newSettings) {
        settings = newSettings;
        applySettings();
    }
    function setImageSettings(newImageSettings) {
        imageSettings = newImageSettings;
        applyImageSettings();
    }
    function workOnScanQueue() {
        if ((!scannerSettingsReady || !scannerImageSettingsReady) && scanQueue.length !== 0) {
            // First submitted work unit
            createContext(licenseKey);
            applySettings();
            applyImageSettings();
        }
        if (!scannerSettingsReady || !scannerImageSettingsReady || scanQueue.length === 0) {
            return;
        }
        var currentScanWorkUnit;
        var resultData;
        while (scanQueue.length !== 0) {
            currentScanWorkUnit = scanQueue.shift();
            if (currentScanWorkUnit.highQualitySingleFrameMode) {
                applySettings(true);
            }
            // TODO: For now it's not possible to use imported variables as the worker doesn't have access at runtime
            if (imageSettings.format.valueOf() === 1) {
                // RGB_8U
                resultData = scanImage(convertImageDataToGrayscale(currentScanWorkUnit.data, 3));
            }
            else if (imageSettings.format.valueOf() === 2) {
                // RGBA_8U
                resultData = scanImage(convertImageDataToGrayscale(currentScanWorkUnit.data, 4));
            }
            else {
                resultData = scanImage(currentScanWorkUnit.data);
            }
            if (currentScanWorkUnit.highQualitySingleFrameMode) {
                applySettings(false);
            }
            var result = JSON.parse(resultData);
            if (result.error != null) {
                postMessage([
                    "work-error",
                    {
                        requestId: currentScanWorkUnit.requestId,
                        error: result.error
                    }
                ]);
            }
            else {
                // istanbul ignore else
                if (result.scanResult != null) {
                    if (result.scanResult.length > 0 || fsSyncInProgress == null) {
                        syncFS();
                    }
                    postMessage([
                        "work-result",
                        {
                            requestId: currentScanWorkUnit.requestId,
                            result: result
                        }
                    ]);
                }
                else {
                    console.error("Unrecognized Scandit Engine result:", result);
                    postMessage([""], [currentScanWorkUnit.data.buffer]);
                }
            }
        }
    }
    function workOnParseQueue() {
        if (!contextAvailable && parseQueue.length !== 0) {
            // First submitted work unit
            createContext(licenseKey);
        }
        if (!contextAvailable || !wasmLoaded || parseQueue.length === 0) {
            return;
        }
        var currentParseWorkUnit;
        var resultData;
        while (parseQueue.length !== 0) {
            currentParseWorkUnit = parseQueue.shift();
            resultData = parseString(currentParseWorkUnit.dataFormat, currentParseWorkUnit.dataString, currentParseWorkUnit.options);
            var result = JSON.parse(resultData);
            if (result.error != null) {
                postMessage([
                    "parse-string-error",
                    {
                        requestId: currentParseWorkUnit.requestId,
                        error: result.error
                    }
                ]);
            }
            else {
                // istanbul ignore else
                if (result.result != null) {
                    postMessage([
                        "parse-string-result",
                        {
                            requestId: currentParseWorkUnit.requestId,
                            result: result.result
                        }
                    ]);
                }
                else {
                    console.error("Unrecognized Scandit Parser result:", result);
                    postMessage([
                        "parse-string-error",
                        {
                            requestId: currentParseWorkUnit.requestId,
                            error: {
                                errorCode: -1,
                                errorMessage: "Unknown Scandit Parser error"
                            }
                        }
                    ]);
                }
            }
        }
        syncFS();
    }
    function addScanWorkUnit(scanWorkUnit) {
        scanWorkSubmitted = true;
        scanQueue.push(scanWorkUnit);
        workOnScanQueue();
    }
    function addParseWorkUnit(parseWorkUnit) {
        parseQueue.push(parseWorkUnit);
        workOnParseQueue();
    }
    function clearSession() {
        if (scannerSettingsReady) {
            Module._scanner_session_clear();
        }
    }
    // Private
    function getLibraryLocationURIs(libraryLocation) {
        var cdnURI = false;
        if (/^http(s):\/\/([^\/.]*\.)*cdn.jsdelivr.net\//.test(libraryLocation)) {
            libraryLocation = "https://cdn.jsdelivr.net/npm/scandit-sdk@4.1.1/build/";
            cdnURI = true;
        }
        else if (/^http(s):\/\/([^\/.]*\.)*unpkg.com\//.test(libraryLocation)) {
            libraryLocation = "https://unpkg.com/scandit-sdk@4.1.1/build/";
            cdnURI = true;
        }
        if (cdnURI) {
            return {
                jsURI: libraryLocation + "scandit-engine-sdk.min.js",
                wasmURI: libraryLocation + "scandit-engine-sdk.wasm"
            };
        }
        return {
            jsURI: libraryLocation + "scandit-engine-sdk.min.js?v=4.1.1",
            wasmURI: libraryLocation + "scandit-engine-sdk.wasm?v=4.1.1"
        };
    }
    function arrayBufferToHexString(arrayBuffer) {
        return Array.from(new Uint8Array(arrayBuffer))
            .map(function (byteNumber) {
            var byteHex = byteNumber.toString(16);
            return byteHex.length === 1 ? "0" + byteHex : byteHex;
        })
            .join("");
    }
    function applySettings(highQualitySingleFrameMode) {
        if (highQualitySingleFrameMode === void 0) { highQualitySingleFrameMode = false; }
        if (settings == null || !contextAvailable || !wasmLoaded || !scanWorkSubmitted) {
            return;
        }
        scannerSettingsReady = false;
        var parsedSettings = JSON.parse(settings);
        var settingsLength = Module.lengthBytesUTF8(settings) + 1;
        var settingsPointer = Module._malloc(settingsLength);
        Module.stringToUTF8(settings, settingsPointer, settingsLength);
        var resultPointer = Module._scanner_settings_new_from_json(settingsPointer, blurryDecodingEnabled, parsedSettings.matrixScanEnabled, highQualitySingleFrameMode, gpuAccelerationAvailable && parsedSettings.gpuAcceleration);
        Module._free(settingsPointer);
        var result = Module.UTF8ToString(resultPointer);
        if (result !== "") {
            scannerSettingsReady = true;
            console.debug(JSON.parse(result));
        }
    }
    function applyImageSettings() {
        if (imageSettings == null || !wasmLoaded || !scanWorkSubmitted) {
            return;
        }
        scannerImageSettingsReady = false;
        // We allocate for a grayscale image only as we will do a conversion here in the worker before passing it
        Module._scanner_image_settings_new(imageSettings.width, imageSettings.height, 1);
        if (imageBufferPointer != null) {
            Module._free(imageBufferPointer);
            imageBufferPointer = undefined;
        }
        imageBufferPointer = Module._malloc(imageSettings.width * imageSettings.height);
        scannerImageSettingsReady = true;
    }
    function convertImageDataToGrayscale(imageData, channels) {
        var grayscaleImageData = new Uint8ClampedArray(imageData.length / channels);
        var grayscaleImageDataIndex = imageData.length / channels - 1;
        var imageDataIndex = imageData.length - channels;
        while (imageDataIndex >= 0) {
            grayscaleImageData[grayscaleImageDataIndex--] =
                imageData[imageDataIndex] * 0.299 +
                    imageData[imageDataIndex + 1] * 0.587 +
                    imageData[imageDataIndex + 2] * 0.114;
            imageDataIndex -= channels;
        }
        return grayscaleImageData;
    }
    function scanImage(imageData) {
        Module.HEAPU8.set(imageData, imageBufferPointer);
        return Module.UTF8ToString(Module._scanner_scan(imageBufferPointer));
    }
    function parseString(dataFormat, dataString, options) {
        var dataStringLength = Module.lengthBytesUTF8(dataString) + 1;
        var dataStringPointer = Module._malloc(dataStringLength);
        Module.stringToUTF8(dataString, dataStringPointer, dataStringLength);
        var optionsLength = Module.lengthBytesUTF8(options) + 1;
        var optionsPointer = Module._malloc(optionsLength);
        Module.stringToUTF8(options, optionsPointer, optionsLength);
        var resultPointer = Module._parser_parse_string(dataFormat.valueOf(), dataStringPointer, dataStringLength - 1, optionsPointer);
        Module._free(dataStringPointer);
        Module._free(optionsPointer);
        return Module.UTF8ToString(resultPointer);
    }
    // Adapted from: https://github.com/mdn/webassembly-examples/blob/master/wasm-utils.js
    function loadDatabase(wasmVersion, resolve, reject) {
        var openDBRequest;
        try {
            openDBRequest = indexedDB.open(dbName, wasmVersion);
        }
        catch (error) {
            return reject("Failed to open scandit-sdk WebAssembly cache database: " + error);
        }
        openDBRequest.onerror = function () {
            return reject("Failed to open scandit-sdk WebAssembly cache database");
        };
        openDBRequest.onsuccess = function () {
            db = openDBRequest.result;
            var store = db.transaction([dbStoreName]).objectStore(dbStoreName);
            var request = store.get(dbStoreKey);
            request.onerror = function () {
                return reject("Failed to open scandit-sdk WebAssembly cache database");
            };
            request.onsuccess = function () {
                if (request.result != null) {
                    return resolve(request.result);
                }
                else {
                    return reject("No cached version of the scandit-sdk WebAssembly code has been found");
                }
            };
        };
        openDBRequest.onupgradeneeded = function () {
            db = openDBRequest.result;
            if (db.objectStoreNames.contains(dbStoreName)) {
                db.deleteObjectStore(dbStoreName);
            }
            db.createObjectStore(dbStoreName);
        };
    }
    function storeWebAssemblyInDatabase(moduleObject) {
        try {
            var store = db.transaction([dbStoreName], "readwrite").objectStore(dbStoreName);
            var request = store.put(moduleObject, dbStoreKey);
            request.onerror = function (error) {
                console.debug("Failed to cache scandit-sdk WebAssembly code: " + error);
            };
            request.onsuccess = function () {
                console.debug("Successfully cached scandit-sdk WebAssembly code");
            };
        }
        catch (error) {
            if (error.name === "DataCloneError") {
                console.debug("Could not cache scandit-sdk WebAssembly code: This browser doesn't support this feature yet");
            }
            else {
                console.debug("Failed to cache scandit-sdk WebAssembly code: " + error);
            }
        }
    }
    function verifiedWasmFetch(wasmURI) {
        return fetch(wasmURI).then(function (response) {
            response
                .clone()
                .arrayBuffer()
                .then(function (responseData) {
                crypto.subtle.digest("SHA-256", responseData).then(function (hash) {
                    var hashString = arrayBufferToHexString(hash);
                    // istanbul ignore if
                    if (hashString !== "b41063919c158e206174957e102376eaa39c83fa692e00ecbd10763bc2fc420f") {
                        console.error("The Scandit SDK Engine library WASM file found at " + wasmURI + " seems invalid: " +
                            ("expected file hash doesn't match (received: " + hashString + ", ") +
                            ("expected: " + "b41063919c158e206174957e102376eaa39c83fa692e00ecbd10763bc2fc420f" + "). ") +
                            "Please ensure the correct Scandit SDK Engine file (with correct version) is retrieved.");
                    }
                });
            });
            return response;
        });
    }
    function instantiateWebAssembly(importObject, wasmURI, successCallback, wasmRequest) {
        if (wasmRequest == null) {
            wasmRequest = verifiedWasmFetch(wasmURI);
        }
        wasmRequest
            .then(function (response) {
            return response.arrayBuffer();
        })
            .then(function (bytes) {
            return self.WebAssembly.instantiate(bytes, importObject).then(function (results) {
                if (db != null) {
                    storeWebAssemblyInDatabase(results.module);
                }
                successCallback(results.instance);
            });
        })
            .catch(function (error) {
            console.warn(error);
            console.error("Couldn't retrieve Scandit SDK Engine library at " + wasmURI + ", did you configure the path for it correctly?");
        });
    }
    function instantiateWebAssemblyStreaming(importObject, wasmURI, successCallback) {
        var wasmRequest = verifiedWasmFetch(wasmURI);
        self.WebAssembly.instantiateStreaming(wasmRequest, importObject)
            .then(function (results) {
            if (db != null) {
                storeWebAssemblyInDatabase(results.module);
            }
            successCallback(results.instance);
        })
            .catch(function (error) {
            console.warn("WebAssembly streaming compile failed: " + error + ". Falling back to ArrayBuffer instantiation" +
                "(this will make things slower)");
            instantiateWebAssembly(importObject, wasmURI, successCallback, wasmRequest);
        });
    }
    function instantiateWasmWithCache(wasmURI, wasmVersion, importObject, successCallback) {
        loadDatabase(wasmVersion, function (moduleObject) {
            console.debug("Found cached scandit-sdk WebAssembly code");
            self.WebAssembly.instantiate(moduleObject, importObject).then(function (instance) {
                successCallback(instance);
            });
        }, function (errMsg) {
            console.debug(errMsg);
            if (typeof self.WebAssembly.instantiateStreaming === "function") {
                instantiateWebAssemblyStreaming(importObject, wasmURI, successCallback);
            }
            else {
                instantiateWebAssembly(importObject, wasmURI, successCallback);
            }
        });
    }
    function syncFS() {
        // istanbul ignore if
        if (fsSyncInProgress === true) {
            fsSyncScheduled = true;
        }
        else {
            fsSyncInProgress = true;
            fsSyncScheduled = false;
            FS.syncfs(false, function () {
                fsSyncInProgress = false;
                // istanbul ignore if
                if (fsSyncScheduled) {
                    syncFS();
                }
            });
        }
    }
    return {
        loadLibrary: loadLibrary,
        createContext: createContext,
        setBlurryDecodingEnabled: setBlurryDecodingEnabled,
        setSettings: setSettings,
        setImageSettings: setImageSettings,
        workOnScanQueue: workOnScanQueue,
        workOnParseQueue: workOnParseQueue,
        addScanWorkUnit: addScanWorkUnit,
        addParseWorkUnit: addParseWorkUnit,
        clearSession: clearSession
    };
}
exports.engine = engine;
/**
 * @hidden
 */
// istanbul ignore next
function engineWorkerFunction() {
    var engineInstance = engine();
    onmessage = function (e) {
        // Setting settings triggers license verification and activation: delay until first frame processed
        var data = e.data;
        switch (data.type) {
            case "enable-blurry-decoding":
                engineInstance.setBlurryDecodingEnabled(true);
                engineInstance.workOnScanQueue();
                break;
            case "load-library":
                engineInstance.loadLibrary(data.deviceId, data.libraryLocation, data.path);
                break;
            case "license-key":
                engineInstance.createContext(data.licenseKey);
                engineInstance.workOnParseQueue();
                break;
            case "settings":
                engineInstance.setSettings(data.settings);
                engineInstance.workOnScanQueue();
                break;
            case "image-settings":
                engineInstance.setImageSettings(data.imageSettings);
                engineInstance.workOnScanQueue();
                break;
            case "work":
                engineInstance.addScanWorkUnit({
                    requestId: data.requestId,
                    data: data.data,
                    highQualitySingleFrameMode: data.highQualitySingleFrameMode
                });
                break;
            case "parse-string":
                engineInstance.addParseWorkUnit({
                    requestId: data.requestId,
                    dataFormat: data.dataFormat,
                    dataString: data.dataString,
                    options: data.options
                });
                break;
            case "clear-session":
                engineInstance.clearSession();
                break;
            default:
                break;
        }
    };
}
exports.engineWorkerFunction = engineWorkerFunction;
/**
 * @hidden
 */
exports.engineWorkerBlob = new Blob([engine.toString() + "(" + engineWorkerFunction.toString() + ")()"], {
    type: "text/javascript"
});
//# sourceMappingURL=engineWorker.js.map