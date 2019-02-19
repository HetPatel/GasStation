"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var eventemitter3_1 = require("eventemitter3");
var engineWorker_1 = require("./workers/engineWorker");
var index_1 = require("../index");
var barcode_1 = require("./barcode");
var browserHelper_1 = require("./browserHelper");
var customError_1 = require("./customError");
var imageSettings_1 = require("./imageSettings");
var parser_1 = require("./parser");
var scanSettings_1 = require("./scanSettings");
/**
 * @hidden
 */
var ScannerEventEmitter = /** @class */ (function (_super) {
    tslib_1.__extends(ScannerEventEmitter, _super);
    function ScannerEventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ScannerEventEmitter;
}(eventemitter3_1.EventEmitter));
/**
 * A low-level scanner interacting with the external Scandit Engine library.
 * Used to set up scan / image settings and to process single image frames.
 *
 * The loading of the external Scandit Engine library which takes place on creation can take some time,
 * the [[onReady]] method can be used to set up a listener function to be called when the library is loaded
 * and the [[isReady]] method can return the current status. The scanner will be ready to start scanning when
 * the library is fully loaded.
 *
 * In the special case where a single [[Scanner]] instance is shared between multiple active [[BarcodePicker]]
 * instances, the fairness in resource allocation for processing images between the different pickers is not guaranteed.
 */
var Scanner = /** @class */ (function () {
    /**
     * Create a Scanner instance.
     *
     * It is required to having configured the library via [[configure]] before this object can be created.
     *
     * Before processing an image the relative settings must also have been set.
     *
     * If the library has not been correctly configured yet a `LibraryNotConfiguredError` error is thrown.
     *
     * If a browser is incompatible a `UnsupportedBrowserError` error is thrown.
     *
     * @param scanSettings <div class="tsd-signature-symbol">Default =&nbsp;new ScanSettings()</div>
     * The configuration object for scanning options.
     * @param imageSettings <div class="tsd-signature-symbol">Default =&nbsp;undefined</div>
     * The configuration object to define the properties of an image to be scanned.
     */
    function Scanner(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.scanSettings, scanSettings = _c === void 0 ? new scanSettings_1.ScanSettings() : _c, imageSettings = _b.imageSettings;
        var browserCompatibility = browserHelper_1.BrowserHelper.checkBrowserCompatibility();
        if (!browserCompatibility.scannerSupport) {
            throw new customError_1.CustomError({
                name: "UnsupportedBrowserError",
                message: "This OS / Browser has one or more missing features preventing it from working correctly",
                data: browserCompatibility
            });
        }
        if (index_1.userLicenseKey == null || index_1.userLicenseKey.trim() === "") {
            throw new customError_1.CustomError({
                name: "LibraryNotConfiguredError",
                message: "The library has not correctly been configured yet, please call 'configure' with valid parameters"
            });
        }
        this.isReadyToWork = false;
        this.workerScanQueueLength = 0;
        this.engineWorker = new Worker(URL.createObjectURL(engineWorker_1.engineWorkerBlob));
        this.engineWorker.onmessage = this.engineWorkerOnMessage.bind(this);
        this.engineWorker.postMessage({
            type: "load-library",
            deviceId: index_1.deviceId,
            libraryLocation: index_1.scanditEngineLocation,
            path: self.location.pathname
        });
        this.eventEmitter = new eventemitter3_1.EventEmitter();
        this.workerParseRequestId = 0;
        this.workerScanRequestId = 0;
        this.applyLicenseKey(index_1.userLicenseKey);
        this.applyScanSettings(scanSettings);
        if (imageSettings != null) {
            this.applyImageSettings(imageSettings);
        }
    }
    /**
     * Stop the internal `WebWorker` and destroy the scanner itself; ensuring complete cleanup.
     *
     * This method should be called after you don't plan to use the scanner anymore,
     * before the object is automatically cleaned up by JavaScript.
     * The barcode picker must not be used in any way after this call.
     */
    Scanner.prototype.destroy = function () {
        if (this.engineWorker != null) {
            this.engineWorker.terminate();
        }
        this.eventEmitter.removeAllListeners();
    };
    /**
     * Apply a new set of scan settings to the scanner (replacing old settings).
     *
     * @param scanSettings The scan configuration object to be applied to the scanner.
     * @returns The updated [[Scanner]] object.
     */
    Scanner.prototype.applyScanSettings = function (scanSettings) {
        this.scanSettings = scanSettings;
        this.engineWorker.postMessage({
            type: "settings",
            settings: this.scanSettings.toJSONString()
        });
        return this;
    };
    /**
     * Apply a new set of image settings to the scanner (replacing old settings).
     *
     * @param imageSettings The image configuration object to be applied to the scanner.
     * @returns The updated [[Scanner]] object.
     */
    Scanner.prototype.applyImageSettings = function (imageSettings) {
        this.imageSettings = imageSettings;
        this.engineWorker.postMessage({
            type: "image-settings",
            imageSettings: imageSettings
        });
        return this;
    };
    /**
     * Clear the scanner session.
     *
     * This removes all recognized barcodes from the scanner session and allows them to be scanned again in case a custom
     * *codeDuplicateFilter* was set in the [[ScanSettings]].
     *
     * @returns The updated [[Scanner]] object.
     */
    Scanner.prototype.clearSession = function () {
        this.engineWorker.postMessage({
            type: "clear-session"
        });
        return this;
    };
    /**
     * Process a given image using the previously set scanner and image settings,
     * recognizing codes and retrieving the result as a list of barcodes (if any).
     *
     * Multiple requests done without waiting for previous results will be queued and handled in order.
     *
     * If *highQualitySingleFrameMode* is enabled the image will be processed with really accurate internal settings,
     * resulting in much slower but more precise scanning results. This should be used only for single images not part
     * of a continuous video stream.
     *
     * Depending on the current image settings, given *imageData* and scanning execution, any of the following errors
     * could be the rejected result of the returned promise:
     * - `NoImageSettings`
     * - `ImageSettingsDataMismatch`
     * - `ScanditEngineError`
     *
     * @param imageData The image data given as a byte array, complying with the previously set image settings.
     * @param highQualitySingleFrameMode Whether to process the image as a high quality single frame.
     * @returns A promise resolving to the [[ScanResult]] object.
     */
    Scanner.prototype.processImage = function (imageData, highQualitySingleFrameMode) {
        var _this = this;
        if (highQualitySingleFrameMode === void 0) { highQualitySingleFrameMode = false; }
        if (this.imageSettings == null) {
            return Promise.reject(new customError_1.CustomError({ name: "NoImageSettings", message: "No image settings set up in the scanner" }));
        }
        var channels;
        switch (this.imageSettings.format.valueOf()) {
            case imageSettings_1.ImageSettings.Format.GRAY_8U:
                channels = 1;
                break;
            case imageSettings_1.ImageSettings.Format.RGB_8U:
                channels = 3;
                break;
            case imageSettings_1.ImageSettings.Format.RGBA_8U:
                channels = 4;
                break;
            default:
                channels = 1;
                break;
        }
        if (this.imageSettings.width * this.imageSettings.height * channels !== imageData.length) {
            return Promise.reject(new customError_1.CustomError({
                name: "ImageSettingsDataMismatch",
                message: "The provided image data doesn't match the previously set image settings"
            }));
        }
        this.workerScanRequestId++;
        this.workerScanQueueLength++;
        return new Promise(function (resolve, reject) {
            var workResultEvent = "work-result-" + _this.workerScanRequestId;
            var workErrorEvent = "work-error-" + _this.workerScanRequestId;
            _this.eventEmitter.once(workResultEvent, function (workResult) {
                _this.eventEmitter.removeAllListeners(workErrorEvent);
                resolve({
                    barcodes: workResult.scanResult.map(barcode_1.Barcode.createFromWASMResult),
                    imageData: imageData,
                    imageSettings: _this.imageSettings
                });
            });
            _this.eventEmitter.once(workErrorEvent, function (error) {
                console.error("Scandit Engine error (" + error.errorCode + "):", error.errorMessage);
                _this.eventEmitter.removeAllListeners(workResultEvent);
                var errorObject = new customError_1.CustomError({
                    name: "ScanditEngineError",
                    message: error.errorMessage + " (" + error.errorCode + ")"
                });
                reject(errorObject);
            });
            // Important! Do not use the recommended postMessage "ArrayBuffer/Transferable" option to send data!
            // Doing so (mysteriously) causes memory and stability issues on Safari.
            // On modern browser going with the simple data copy approach seems to be even better for this amount of data
            // and call frequency anyways.
            // https://developer.mozilla.org/en-US/docs/Web/API/Transferable
            // https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
            _this.engineWorker.postMessage({
                type: "work",
                requestId: _this.workerScanRequestId,
                data: imageData,
                highQualitySingleFrameMode: highQualitySingleFrameMode
            });
        });
    };
    /**
     * @returns Whether the scanner is currently busy processing an image.
     */
    Scanner.prototype.isBusyProcessing = function () {
        return this.workerScanQueueLength !== 0;
    };
    /**
     * @returns Whether the scanner has loaded the external Scandit Engine library and is ready to scan.
     */
    Scanner.prototype.isReady = function () {
        return this.isReadyToWork;
    };
    /**
     * Add the listener function to the listeners array for the "ready" event, fired when the external
     * Scandit Engine library has been loaded and the scanner can thus start to scan barcodes.
     *
     * No checks are made to see if the listener has already been added.
     * Multiple calls passing the same listener will result in the listener being added, and called, multiple times.
     *
     * @param listener The listener function.
     * @returns The updated [[Scanner]] object.
     */
    Scanner.prototype.onReady = function (listener) {
        if (this.isReadyToWork) {
            listener();
        }
        else {
            this.eventEmitter.once("ready", listener, this);
        }
        return this;
    };
    /**
     * Create a new parser object.
     *
     * @param dataFormat The format of the input data for the parser.
     * @returns The newly created parser.
     */
    Scanner.prototype.createParserForFormat = function (dataFormat) {
        return new parser_1.Parser(this, dataFormat);
    };
    /**
     * Return the current image settings.
     *
     * @returns The current image settings.
     */
    Scanner.prototype.getImageSettings = function () {
        return this.imageSettings;
    };
    /**
     * Return the current scan settings.
     *
     * @returns The current scan settings.
     */
    Scanner.prototype.getScanSettings = function () {
        return this.scanSettings;
    };
    /**
     * @hidden
     *
     * Process a given string using the Scandit Parser library,
     * parsing the data in the given format and retrieving the result as a [[ParserResult]] object.
     *
     * Multiple requests done without waiting for previous results will be queued and handled in order.
     *
     * If parsing of the data fails the returned promise is rejected with a `ScanditEngineError` error.
     *
     * @param dataFormat The format of the given data.
     * @param dataString The string containing the data to be parsed.
     * @param options Options for the specific data format parser.
     * @returns A promise resolving to the [[ParserResult]] object.
     */
    Scanner.prototype.parseString = function (dataFormat, dataString, options) {
        var _this = this;
        this.workerParseRequestId++;
        return new Promise(function (resolve, reject) {
            var parseStringResultEvent = "parse-string-result-" + _this.workerParseRequestId;
            var parseStringErrorEvent = "parse-string-error-" + _this.workerParseRequestId;
            _this.eventEmitter.once(parseStringResultEvent, function (result) {
                _this.eventEmitter.removeAllListeners(parseStringErrorEvent);
                var parserResult = {
                    jsonString: result,
                    fields: [],
                    fieldsByName: {}
                };
                JSON.parse(result).forEach(function (parserField) {
                    parserResult.fields.push(parserField);
                    parserResult.fieldsByName[parserField.name] = parserField;
                });
                resolve(parserResult);
            });
            _this.eventEmitter.once(parseStringErrorEvent, function (error) {
                console.error("Scandit Engine error (" + error.errorCode + "):", error.errorMessage);
                _this.eventEmitter.removeAllListeners(parseStringResultEvent);
                var errorObject = new customError_1.CustomError({
                    name: "ScanditEngineError",
                    message: error.errorMessage + " (" + error.errorCode + ")"
                });
                reject(errorObject);
            });
            _this.engineWorker.postMessage({
                type: "parse-string",
                requestId: _this.workerParseRequestId,
                dataFormat: dataFormat,
                dataString: dataString,
                options: options == null ? "{}" : JSON.stringify(options)
            });
        });
    };
    Scanner.prototype.applyLicenseKey = function (licenseKey) {
        this.engineWorker.postMessage({
            type: "license-key",
            licenseKey: licenseKey
        });
        return this;
    };
    Scanner.prototype.engineWorkerOnMessage = function (ev) {
        var messageType = ev.data[0];
        var messageData = ev.data[1];
        if (messageType === "status") {
            if (messageData === "ready") {
                this.isReadyToWork = true;
                this.eventEmitter.emit("ready");
            }
        }
        else if (messageType === "work-result" && messageData != null) {
            this.eventEmitter.emit("work-result-" + messageData.requestId, messageData.result);
            this.workerScanQueueLength--;
        }
        else if (messageType === "work-error" && messageData != null) {
            this.eventEmitter.emit("work-error-" + messageData.requestId, messageData.error);
            this.workerScanQueueLength--;
        }
        else if (messageType === "parse-string-result" && messageData != null) {
            this.eventEmitter.emit("parse-string-result-" + messageData.requestId, messageData.result);
        }
        else if (messageType === "parse-string-error" && messageData != null) {
            this.eventEmitter.emit("parse-string-error-" + messageData.requestId, messageData.error);
        }
    };
    return Scanner;
}());
exports.Scanner = Scanner;
//# sourceMappingURL=scanner.js.map