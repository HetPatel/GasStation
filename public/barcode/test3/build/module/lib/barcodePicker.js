import { EventEmitter } from "eventemitter3";
import { Howl, Howler } from "howler/dist/howler.core.min.js";
import { beepSound } from "./assets/base64assets";
import { userLicenseKey } from "../index";
import { BarcodePickerCameraManager } from "./barcodePickerCameraManager";
import { BarcodePickerGui } from "./barcodePickerGui";
import { BrowserHelper } from "./browserHelper";
import { CustomError } from "./customError";
import { DummyCameraManager } from "./dummyCameraManager";
import { Scanner } from "./scanner";
import { ScanSettings } from "./scanSettings";
/**
 * @hidden
 */
class BarcodePickerEventEmitter extends EventEmitter {
}
/**
 * A barcode picker element used to get and show camera input and perform scanning operations.
 *
 * The barcode picker will automatically fit and scale inside the given *originElement*.
 *
 * Each barcode picker internally contains a [[Scanner]] object with its own WebWorker thread running a
 * separate copy of the external Scandit Engine library. To optimize loading times and performance it's
 * recommended to reuse the same picker and to already create the picker in advance (hidden) and just
 * display it when needed whenever possible.
 *
 * As the loading of the external Scandit Engine library can take some time the picker always starts inactive
 * (but showing GUI and video) and then activates, if not paused, as soon as the library is ready to scan.
 * The [[onReady]] method can be used to set up a listener function to be called when the library is loaded.
 *
 * The picker can also operate in "single image mode", letting the user click/tap to take a single image to be scanned
 * via the camera (mobile/tablet) or a file select dialog (desktop). This is provided automatically as fallback by
 * default when the OS/browser only supports part of the needed features and cannot provide direct access to the camera
 * for video streaming and continuous scanning, or can also be forced. This behaviour can be set up on creation. Note
 * that in this mode some of the functions provided by the picker will have no effect.
 *
 * By default an alert is shown if an internal error during scanning is encountered which prevents the scanning
 * procedure from continuing when running on a local IP address. As this uses the built-in [[onScanError]] event
 * functionality, if unwanted it can be disabled by calling [[removeScanErrorListeners]] on the BarcodePicker
 * instance (right after creation).
 *
 * You are not allowed to hide the Scandit logo present in the corner of the GUI.
 */
export class BarcodePicker {
    constructor(originElement, { visible, singleImageMode, playSoundOnScan, vibrateOnScan, scanningPaused, guiStyle, videoFit, scanner, scanSettings, targetScanningFPS }) {
        this.isReadyToWork = false;
        this.destroyed = false;
        this.scanningPaused = scanningPaused;
        Howler.autoSuspend = false;
        this.beepSound = new Howl({
            src: beepSound
        });
        this.vibrateFunction =
            navigator.vibrate ||
                navigator.webkitVibrate ||
                navigator.mozVibrate ||
                navigator.msVibrate;
        this.eventEmitter = new EventEmitter();
        this.setPlaySoundOnScanEnabled(playSoundOnScan);
        this.setVibrateOnScanEnabled(vibrateOnScan);
        this.setTargetScanningFPS(targetScanningFPS);
        if (scanner == null) {
            this.scanner = new Scanner({ scanSettings: scanSettings });
        }
        else {
            this.scanner = scanner;
            this.scanner.applyScanSettings(scanSettings);
        }
        this.scanner.onReady(() => {
            this.isReadyToWork = true;
            this.eventEmitter.emit("ready");
        });
        this.barcodePickerGui = new BarcodePickerGui(this.scanner, originElement, singleImageMode, scanningPaused, visible, guiStyle, videoFit, this.processVideoFrame.bind(this, true));
        if (singleImageMode) {
            this.cameraManager = new DummyCameraManager();
        }
        else {
            this.scheduleVideoProcessing();
            this.cameraManager = new BarcodePickerCameraManager(this.triggerFatalError.bind(this), this.barcodePickerGui);
        }
        this.barcodePickerGui.setCameraManager(this.cameraManager);
    }
    /**
     * Create a [[BarcodePicker]] instance, creating the needed HTML in the given origin element.
     * If the *accessCamera* option is enabled (active by default) and the picker is not in "single image mode",
     * the available cameras are accessed and camera access permission is requested to the user if needed.
     * This object expects that at least a camera is available. The active camera is accessed and kept active during the
     * lifetime of the picker (also when hidden or scanning is paused), and is only released when [[destroy]] is called.
     *
     * It is required to having configured the library via [[configure]] before this object can be created.
     *
     * The "single image mode" behaviour of the picker can be set up via the
     * *singleImageMode* option, which accepts a configuration object of the form:
     * ```
     * {
     *   desktop: {
     *     always: false, allowFallback: true
     *   },
     *   mobile: {
     *     always: false, allowFallback: true
     *   }
     * }
     * ```
     *
     * Depending on parameters, device features and user permissions for camera access, any of the following errors
     * could be the rejected result of the returned promise:
     * - `LibraryNotConfiguredError`
     * - `NoOriginElementError`
     * - `UnsupportedBrowserError`
     * - `PermissionDeniedError`
     * - `NotAllowedError`
     * - `NotFoundError`
     * - `AbortError`
     * - `NotReadableError`
     * - `InternalError`
     * - `NoCameraAvailableError`
     *
     * @param originElement The HTMLElement inside which all the necessary elements for the picker will be added.
     * @param visible <div class="tsd-signature-symbol">Default =&nbsp;true</div>
     * Whether the picker starts in a visible state.
     * @param singleImageMode <div class="tsd-signature-symbol">Default =&nbsp;
     * { desktop: { always: false, allowFallback: true }, mobile: { always: false, allowFallback: true } }</div>
     * Whether to provide a UI to pick/snap a single image from the camera instead of accessing and using the persistent
     * video stream from a camera ("force"), or to allow to provide this as a fallback ("allowFallback") in case the
     * necessary features for direct camera access are not provided by the OS/browser.
     * @param playSoundOnScan <div class="tsd-signature-symbol">Default =&nbsp;false</div>
     * Whether a sound is played on barcode scanned (iOS requires user input).
     * @param vibrateOnScan <div class="tsd-signature-symbol">Default =&nbsp;false</div>
     * Whether the device vibrates on barcode scanned (only Chrome & Firefox, requires user input).
     * @param scanningPaused <div class="tsd-signature-symbol">Default =&nbsp;false</div>
     * Whether the picker starts in a paused scanning state.
     * @param guiStyle <div class="tsd-signature-symbol">Default =&nbsp;GuiStyle.LASER</div>
     * The GUI style for the picker.
     * @param videoFit <div class="tsd-signature-symbol">Default =&nbsp;ObjectFit.CONTAIN</div>
     * The fit type for the video element of the picker.
     * @param enableCameraSwitcher <div class="tsd-signature-symbol">Default =&nbsp;true</div>
     * Whether to show a GUI button to switch between different cameras (when available).
     * @param enableTorchToggle <div class="tsd-signature-symbol">Default =&nbsp;true</div>
     * Whether to show a GUI button to toggle device torch on/off (when available, only Chrome).
     * @param enableTapToFocus <div class="tsd-signature-symbol">Default =&nbsp;true</div>
     * Whether to trigger a manual focus of the camera when clicking/tapping on the video (when available, only Chrome).
     * @param enablePinchToZoom <div class="tsd-signature-symbol">Default =&nbsp;true</div>
     * Whether to control the zoom of the camera when doing a pinching gesture on the video (when available, only Chrome).
     * @param accessCamera <div class="tsd-signature-symbol">Default =&nbsp;true</div>
     * Whether to immediately access the camera (and requesting user permissions if needed) on picker creation.
     * @param camera <div class="tsd-signature-symbol">Default =&nbsp;undefined</div>
     * The camera to be used for video input, if not specified the back or only camera will be used.
     * @param cameraSettings <div class="tsd-signature-symbol">Default =&nbsp;undefined</div>
     * The camera options used when accessing the camera, by default HD resolution is used.
     * @param scanner <div class="tsd-signature-symbol">Default =&nbsp;undefined</div>
     * The scanner object responsible for scanning via the external Scandit Engine library
     * (A new scanner will be created and initialized if not provided).
     * @param scanSettings <div class="tsd-signature-symbol">Default =&nbsp;new ScanSettings()</div>
     * The configuration object for scanning options to be applied to the scanner (All symbologies disabled by default).
     * @param targetScanningFPS <div class="tsd-signature-symbol">Default =&nbsp;30</div>
     * The target frames per second to be processed, the final speed is limited by the camera framerate (usually 30 FPS)
     * and the frame processing time of the device. By setting this to lower numbers devices can save power by performing
     * less work during scanning operations, depending on device speed (faster devices can "sleep" for longer periods).
     * Must be a number bigger than 0.
     * @returns A promise resolving to the created ready [[BarcodePicker]] object.
     */
    static create(originElement, { visible = true, singleImageMode = {
        desktop: { always: false, allowFallback: true },
        mobile: { always: false, allowFallback: true }
    }, playSoundOnScan = false, vibrateOnScan = false, scanningPaused = false, guiStyle = BarcodePicker.GuiStyle.LASER, videoFit = BarcodePicker.ObjectFit.CONTAIN, scanner, scanSettings = new ScanSettings(), enableCameraSwitcher = true, enableTorchToggle = true, enableTapToFocus = true, enablePinchToZoom = true, accessCamera = true, camera, cameraSettings, targetScanningFPS = 30 } = {}) {
        let singleImageModeForced;
        let singleImageModeFallbackAllowed;
        const deviceType = BrowserHelper.userAgentInfo.getDevice().type;
        if (deviceType === "mobile" || deviceType === "tablet") {
            singleImageModeForced = singleImageMode.mobile.always;
            singleImageModeFallbackAllowed = singleImageMode.mobile.allowFallback;
        }
        else {
            singleImageModeForced = singleImageMode.desktop.always;
            singleImageModeFallbackAllowed = singleImageMode.desktop.allowFallback;
        }
        const browserCompatibility = BrowserHelper.checkBrowserCompatibility();
        if (!browserCompatibility.scannerSupport ||
            (!singleImageModeForced && !singleImageModeFallbackAllowed && !browserCompatibility.fullSupport)) {
            return Promise.reject(new CustomError({
                name: "UnsupportedBrowserError",
                message: "This OS / Browser has one or more missing features preventing it from working correctly",
                data: browserCompatibility
            }));
        }
        if (userLicenseKey == null || userLicenseKey.trim() === "") {
            return Promise.reject(new CustomError({
                name: "LibraryNotConfiguredError",
                message: "The library has not correctly been configured yet, please call 'configure' with valid parameters"
            }));
        }
        if (!(originElement instanceof HTMLElement)) {
            return Promise.reject(new CustomError({
                name: "NoOriginElementError",
                message: "A valid origin HTML element must be given"
            }));
        }
        if (targetScanningFPS <= 0) {
            targetScanningFPS = 30;
        }
        const barcodePicker = new BarcodePicker(originElement, {
            visible,
            singleImageMode: browserCompatibility.fullSupport ? singleImageModeForced : true,
            playSoundOnScan,
            vibrateOnScan,
            scanningPaused,
            guiStyle,
            videoFit,
            scanner,
            scanSettings,
            targetScanningFPS
        });
        barcodePicker.cameraManager.setInteractionOptions(enableCameraSwitcher, enableTorchToggle, enableTapToFocus, enablePinchToZoom);
        barcodePicker.cameraManager.setSelectedCamera(camera);
        barcodePicker.cameraManager.setSelectedCameraSettings(cameraSettings);
        barcodePicker.cameraAccess = accessCamera;
        // Show error in alert on ScanError by default when running on local IP address for easier customer debugging
        barcodePicker.onScanError(error => {
            if (["localhost", "127.0.0.1", ""].indexOf(window.location.hostname) !== -1) {
                alert(error);
            }
        });
        if (accessCamera) {
            return barcodePicker.cameraManager.setupCameras().then(() => {
                return barcodePicker;
            });
        }
        return Promise.resolve(barcodePicker);
    }
    /**
     * Stop scanning and displaying video output, remove HTML elements added to the page,
     * destroy the internal [[Scanner]] (by default) and destroy the barcode picker itself; ensuring complete cleanup.
     *
     * This method should be called after you don't plan to use the picker anymore,
     * before the object is automatically cleaned up by JavaScript.
     * The barcode picker must not be used in any way after this call.
     *
     * If the [[Scanner]] is or will be in use for other purposes, the relative option can be passed to prevent
     * its destruction.
     *
     * @param destroyScanner Whether to destroy the internally used [[Scanner]] or not.
     */
    destroy(destroyScanner = true) {
        this.pauseScanning(true);
        this.destroyed = true;
        if (destroyScanner) {
            this.scanner.destroy();
        }
        this.barcodePickerGui.destroy();
        this.eventEmitter.removeAllListeners();
    }
    /**
     * Apply a new set of scan settings to the internal scanner (replacing old settings).
     *
     * @param scanSettings The scan configuration object to be applied to the scanner.
     * @returns The updated [[BarcodePicker]] object.
     */
    applyScanSettings(scanSettings) {
        this.scanner.applyScanSettings(scanSettings);
        return this;
    }
    /**
     * @returns Whether the scanning is currently paused.
     */
    isScanningPaused() {
        return this.scanningPaused;
    }
    /**
     * Pause the recognition of codes in the input image.
     *
     * By default video from the camera is still shown, if the *pauseCamera* option is enabled the camera stream
     * is paused (camera access is fully interrupted) and will be resumed when calling [[resumeScanning]] or
     * [[accessCamera]], possibly requesting user permissions if needed.
     *
     * In "single image mode" the input for submitting a picture is disabled.
     *
     * @param pauseCamera Whether to also pause the camera stream.
     * @returns The updated [[BarcodePicker]] object.
     */
    pauseScanning(pauseCamera = false) {
        this.scanningPaused = true;
        if (pauseCamera) {
            this.cameraManager.stopStream();
        }
        if (this.scanner.isReady()) {
            this.barcodePickerGui.pauseScanning();
        }
        return this;
    }
    /**
     * Resume the recognition of codes in the input image.
     *
     * If the camera stream was stopped when calling [[pauseScanning]], the camera stream is also resumed and
     * user permissions are requested if needed to resume video input.
     *
     * In "single image mode" the input for submitting a picture is enabled.
     *
     * @returns The updated [[BarcodePicker]] object.
     */
    resumeScanning() {
        this.scanningPaused = false;
        if (this.scanner.isReady()) {
            this.barcodePickerGui.resumeScanning();
        }
        if (this.cameraManager.activeCamera == null && this.cameraAccess) {
            return this.cameraManager.setupCameras().then(() => {
                return this;
            });
        }
        return Promise.resolve(this);
    }
    /**
     * @returns The currently active camera.
     */
    getActiveCamera() {
        return this.cameraManager.activeCamera;
    }
    /**
     * Select a camera to be used for video input, if no camera is passed, the default one is selected.
     *
     * If camera access is enabled, the camera is enabled and accessed.
     *
     * Depending on device features and user permissions for camera access, any of the following errors
     * could be the rejected result of the returned promise:
     * - `PermissionDeniedError`
     * - `NotAllowedError`
     * - `NotFoundError`
     * - `AbortError`
     * - `NotReadableError`
     * - `InternalError`
     * - `NoCameraAvailableError`
     *
     * In "single image mode" this method has no effect.
     *
     * @param camera The new camera to be used, by default the automatically detected back camera is used.
     * @param cameraSettings The camera options used when accessing the camera, by default HD resolution is used.
     * @returns A promise resolving to the updated [[BarcodePicker]] object when the camera is set
     * (and accessed, if camera access is currently enabled).
     */
    setActiveCamera(camera, cameraSettings) {
        if (camera == null || !this.cameraAccess) {
            this.cameraManager.setSelectedCamera(camera);
            this.cameraManager.setSelectedCameraSettings(cameraSettings);
            if (this.cameraAccess) {
                return this.cameraManager.setupCameras().then(() => {
                    return this;
                });
            }
            else {
                return Promise.resolve(this);
            }
        }
        else {
            return this.cameraManager.initializeCameraWithSettings(camera, cameraSettings).then(() => {
                return this;
            });
        }
    }
    /**
     * Try to apply new settings to the currently used camera for video input,
     * if no settings are passed the default ones are set.
     *
     * If camera access is enabled, the camera is updated and accessed with the new settings.
     *
     * Depending on device features and user permissions for camera access, any of the following errors
     * could be the rejected result of the returned promise:
     * - `PermissionDeniedError`
     * - `NotAllowedError`
     * - `NotFoundError`
     * - `AbortError`
     * - `NotReadableError`
     * - `InternalError`
     * - `NoCameraAvailableError`
     *
     * In "single image mode" this method has no effect.
     *
     * @param cameraSettings The new camera options used when accessing the camera, by default HD resolution is used.
     * @returns A promise resolving to the updated [[BarcodePicker]] object when the camera is updated
     * (and accessed, if camera access is currently enabled).
     */
    applyCameraSettings(cameraSettings) {
        if (!this.cameraAccess) {
            this.cameraManager.setSelectedCameraSettings(cameraSettings);
            return Promise.resolve(this);
        }
        return this.cameraManager.applyCameraSettings(cameraSettings).then(() => {
            return this;
        });
    }
    /**
     * @returns Whether the picker is in a visible state or not.
     */
    isVisible() {
        return this.barcodePickerGui.isVisible();
    }
    /**
     * Enable or disable picker visibility.
     *
     * @param visible Whether the picker is in a visible state or not.
     * @returns The updated [[BarcodePicker]] object.
     */
    setVisible(visible) {
        this.barcodePickerGui.setVisible(visible);
        return this;
    }
    /**
     * @returns Whether the currently selected camera's video is mirrored along the vertical axis.
     */
    isMirrorImageEnabled() {
        return this.barcodePickerGui.isMirrorImageEnabled();
    }
    /**
     * Enable or disable camera video mirroring along the vertical axis.
     * By default front cameras are automatically mirrored.
     * This setting is applied per camera and the method has no effect if no camera is currently selected.
     *
     * In "single image mode" this method has no effect.
     *
     * @param enabled Whether the camera video is mirrored along the vertical axis.
     * @returns The updated [[BarcodePicker]] object.
     */
    setMirrorImageEnabled(enabled) {
        this.barcodePickerGui.setMirrorImageEnabled(enabled, true);
        return this;
    }
    /**
     * @returns Whether a sound should be played on barcode recognition (iOS requires user input).
     */
    isPlaySoundOnScanEnabled() {
        return this.playSoundOnScan;
    }
    /**
     * Enable or disable playing a sound on barcode recognition (iOS requires user input).
     *
     * @param enabled Whether a sound should be played on barcode recognition.
     * @returns The updated [[BarcodePicker]] object.
     */
    setPlaySoundOnScanEnabled(enabled) {
        this.playSoundOnScan = enabled;
        return this;
    }
    /**
     * @returns Whether the device should vibrate on barcode recognition (only Chrome & Firefox, requires user input).
     */
    isVibrateOnScanEnabled() {
        return this.vibrateOnScan;
    }
    /**
     * Enable or disable vibrating the device on barcode recognition (only Chrome & Firefox, requires user input).
     *
     * @param enabled Whether the device should vibrate on barcode recognition.
     * @returns The updated [[BarcodePicker]] object.
     */
    setVibrateOnScanEnabled(enabled) {
        this.vibrateOnScan = enabled;
        return this;
    }
    /**
     * @returns Whether a GUI button to switch between different cameras is shown (when available).
     */
    isCameraSwitcherEnabled() {
        return this.cameraManager.isCameraSwitcherEnabled();
    }
    /**
     * Show or hide a GUI button to switch between different cameras (when available).
     *
     * In "single image mode" this method has no effect.
     *
     * @param enabled Whether to show a GUI button to switch between different cameras.
     * @returns The updated [[BarcodePicker]] object.
     */
    setCameraSwitcherEnabled(enabled) {
        this.cameraManager.setCameraSwitcherEnabled(enabled);
        return this;
    }
    /**
     * @returns Whether a GUI button to toggle device torch on/off is shown (when available, only Chrome).
     */
    isTorchToggleEnabled() {
        return this.cameraManager.isTorchToggleEnabled();
    }
    /**
     * Show or hide a GUI button to toggle device torch on/off (when available, only Chrome).
     *
     * In "single image mode" this method has no effect.
     *
     * @param enabled Whether to show a GUI button to toggle device torch on/off.
     * @returns The updated [[BarcodePicker]] object.
     */
    setTorchToggleEnabled(enabled) {
        this.cameraManager.setTorchToggleEnabled(enabled);
        return this;
    }
    /**
     * @returns Whether manual camera focus when clicking/tapping on the video is enabled (when available, only Chrome).
     */
    isTapToFocusEnabled() {
        return this.cameraManager.isTapToFocusEnabled();
    }
    /**
     * Enable or disable manual camera focus when clicking/tapping on the video (when available, only Chrome).
     *
     * In "single image mode" this method has no effect.
     *
     * @param enabled Whether to enable manual camera focus when clicking/tapping on the video.
     * @returns The updated [[BarcodePicker]] object.
     */
    setTapToFocusEnabled(enabled) {
        this.cameraManager.setTapToFocusEnabled(enabled);
        return this;
    }
    /**
     * @returns Whether camera zoom control via pinching gesture on the video is enabled (when available, only Chrome).
     */
    isPinchToZoomEnabled() {
        return this.cameraManager.isPinchToZoomEnabled();
    }
    /**
     * Enable or disable camera zoom control via pinching gesture on the video (when available, only Chrome).
     *
     * In "single image mode" this method has no effect.
     *
     * @param enabled Whether to enable camera zoom control via pinching gesture on the video.
     * @returns The updated [[BarcodePicker]] object.
     */
    setPinchToZoomEnabled(enabled) {
        this.cameraManager.setPinchToZoomEnabled(enabled);
        return this;
    }
    /**
     * Enable or disable the torch/flashlight of the device (when available, only Chrome).
     * Changing active camera or camera settings will cause the torch to become disabled.
     *
     * A button on the [[BarcodePicker]] GUI to let the user toggle this functionality can also be set
     * on creation via the *enableTorchToggle* option (enabled by default, when available).
     *
     * In "single image mode" this method has no effect.
     *
     * @param enabled Whether the torch should be enabled or disabled.
     * @returns The updated [[BarcodePicker]] object.
     */
    setTorchEnabled(enabled) {
        this.cameraManager.setTorchEnabled(enabled);
        return this;
    }
    /**
     * Set the zoom level of the device (when available, only Chrome).
     * Changing active camera or camera settings will cause the zoom to be reset.
     *
     * In "single image mode" this method has no effect.
     *
     * @param zoomPercentage The percentage of the max zoom (between 0 and 1).
     * @returns The updated [[BarcodePicker]] object.
     */
    setZoom(zoomPercentage) {
        this.cameraManager.setZoom(zoomPercentage);
        return this;
    }
    /**
     * @returns Whether the barcode picker has loaded the external Scandit Engine library and is ready to scan.
     */
    isReady() {
        return this.isReadyToWork;
    }
    /**
     * Add the listener function to the listeners array for the "ready" event, fired when the external
     * Scandit Engine library has been loaded and the barcode picker can thus start to scan barcodes.
     *
     * No checks are made to see if the listener has already been added.
     * Multiple calls passing the same listener will result in the listener being added, and called, multiple times.
     *
     * @param listener The listener function.
     * @returns The updated [[BarcodePicker]] object.
     */
    onReady(listener) {
        if (this.isReadyToWork) {
            listener();
        }
        else {
            this.eventEmitter.once("ready", listener, this);
        }
        return this;
    }
    /**
     * Add the listener function to the listeners array for the "scan" event, fired when new barcodes
     * are recognized in the image frame. The returned barcodes are affected
     * by the [[ScanSettings.setCodeDuplicateFilter]] option.
     *
     * No checks are made to see if the listener has already been added.
     * Multiple calls passing the same listener will result in the listener being added, and called, multiple times.
     *
     * @param listener The listener function, which will be invoked with a [[ScanResult]] object.
     * @param once Whether the listener should just be triggered only once and then discarded.
     * @returns The updated [[BarcodePicker]] object.
     */
    onScan(listener, once = false) {
        if (once === true) {
            this.eventEmitter.once("scan", listener, this);
        }
        else {
            this.eventEmitter.on("scan", listener, this);
        }
        return this;
    }
    /**
     * Remove the specified listener from the "scan" event listener array.
     * This will remove, at most, one instance of a listener from the listener array.
     * If any single listener has been added multiple times then this method must
     * be called multiple times to remove each instance.
     *
     * @param listener The listener function to be removed.
     * @returns The updated [[BarcodePicker]] object.
     */
    removeScanListener(listener) {
        this.eventEmitter.removeListener("scan", listener);
        return this;
    }
    /**
     * Remove all listeners from the "scan" event listener array.
     *
     * @returns The updated [[BarcodePicker]] object.
     */
    removeScanListeners() {
        this.eventEmitter.removeAllListeners("scan");
        return this;
    }
    /**
     * Add the listener function to the listeners array for the "scan error" event, fired when an error occurs
     * during scanning initialization and execution. The barcode picker will be automatically paused when this happens.
     *
     * No checks are made to see if the listener has already been added.
     * Multiple calls passing the same listener will result in the listener being added, and called, multiple times.
     *
     * @param listener The listener function, which will be invoked with an `ScanditEngineError` object.
     * @param once Whether the listener should just be triggered only once and then discarded.
     * @returns The updated [[BarcodePicker]] object.
     */
    onScanError(listener, once = false) {
        if (once === true) {
            this.eventEmitter.once("scanError", listener, this);
        }
        else {
            this.eventEmitter.on("scanError", listener, this);
        }
        return this;
    }
    /**
     * Remove the specified listener from the "scan error" event listener array.
     * This will remove, at most, one instance of a listener from the listener array.
     * If any single listener has been added multiple times then this method must
     * be called multiple times to remove each instance.
     *
     * @param listener The listener function to be removed.
     * @returns The updated [[BarcodePicker]] object.
     */
    removeScanErrorListener(listener) {
        this.eventEmitter.removeListener("scanError", listener);
        return this;
    }
    /**
     * Remove all listeners from the "scan error" event listener array.
     *
     * @returns The updated [[BarcodePicker]] object.
     */
    removeScanErrorListeners() {
        this.eventEmitter.removeAllListeners("scanError");
        return this;
    }
    /**
     * Add the listener function to the listeners array for the "submitFrame" event, fired when a new frame is submitted
     * to the engine to be processed. As the frame is not processed yet, the [[ScanResult]]'s *barcodes* property will
     * always be empty (no results yet).
     *
     * No checks are made to see if the listener has already been added.
     * Multiple calls passing the same listener will result in the listener being added, and called, multiple times.
     *
     * @param listener The listener function, which will be invoked with a [[ScanResult]] object.
     * @param once Whether the listener should just be triggered only once and then discarded.
     * @returns The updated [[BarcodePicker]] object.
     */
    onSubmitFrame(listener, once = false) {
        if (once === true) {
            this.eventEmitter.once("submitFrame", listener, this);
        }
        else {
            this.eventEmitter.on("submitFrame", listener, this);
        }
        return this;
    }
    /**
     * Remove the specified listener from the "submitFrame" event listener array.
     * This will remove, at most, one instance of a listener from the listener array.
     * If any single listener has been added multiple times then this method must
     * be called multiple times to remove each instance.
     *
     * @param listener The listener function to be removed.
     * @returns The updated [[BarcodePicker]] object.
     */
    removeSubmitFrameListener(listener) {
        this.eventEmitter.removeListener("submitFrame", listener);
        return this;
    }
    /**
     * Remove all listeners from the "submitFrame" event listener array.
     *
     * @returns The updated [[BarcodePicker]] object.
     */
    removeSubmitFrameListeners() {
        this.eventEmitter.removeAllListeners("submitFrame");
        return this;
    }
    /**
     * Add the listener function to the listeners array for the "processFrame" event, fired when a new frame is processed.
     * This event is fired on every frame, independently from the number of recognized barcodes (can be none).
     * The returned barcodes are affected by the [[ScanSettings.setCodeDuplicateFilter]] option.
     *
     * No checks are made to see if the listener has already been added.
     * Multiple calls passing the same listener will result in the listener being added, and called, multiple times.
     *
     * @param listener The listener function, which will be invoked with a [[ScanResult]] object.
     * @param once Whether the listener should just be triggered only once and then discarded.
     * @returns The updated [[BarcodePicker]] object.
     */
    onProcessFrame(listener, once = false) {
        if (once === true) {
            this.eventEmitter.once("processFrame", listener, this);
        }
        else {
            this.eventEmitter.on("processFrame", listener, this);
        }
        return this;
    }
    /**
     * Remove the specified listener from the "processFrame" event listener array.
     * This will remove, at most, one instance of a listener from the listener array.
     * If any single listener has been added multiple times then this method must
     * be called multiple times to remove each instance.
     *
     * @param listener The listener function to be removed.
     * @returns The updated [[BarcodePicker]] object.
     */
    removeProcessFrameListener(listener) {
        this.eventEmitter.removeListener("processFrame", listener);
        return this;
    }
    /**
     * Remove all listeners from the "processFrame" event listener array.
     *
     * @returns The updated [[BarcodePicker]] object.
     */
    removeProcessFrameListeners() {
        this.eventEmitter.removeAllListeners("processFrame");
        return this;
    }
    /**
     * Set the GUI style for the picker.
     *
     * In "single image mode" this method has no effect.
     *
     * @param guiStyle The new GUI style to be applied.
     * @returns The updated [[BarcodePicker]] object.
     */
    setGuiStyle(guiStyle) {
        this.barcodePickerGui.setGuiStyle(guiStyle);
        return this;
    }
    /**
     * Set the fit type for the video element of the picker.
     *
     * If the "cover" type is selected the maximum available search area for barcode detection is (continuously) adjusted
     * automatically according to the visible area of the picker.
     *
     * In "single image mode" this method has no effect.
     *
     * @param objectFit The new fit type to be applied.
     * @returns The updated [[BarcodePicker]] object.
     */
    setVideoFit(objectFit) {
        this.barcodePickerGui.setVideoFit(objectFit);
        return this;
    }
    /**
     * Access the currently set or default camera, requesting user permissions if needed.
     * This method is meant to be used after the picker has been initialized with disabled camera access
     * (*accessCamera*=false) or after [[pauseScanning]] has been called with the pause camera stream option.
     * Calling this doesn't do anything if the camera is already being accessed.
     *
     * Depending on device features and user permissions for camera access, any of the following errors
     * could be the rejected result of the returned promise:
     * - `PermissionDeniedError`
     * - `NotAllowedError`
     * - `NotFoundError`
     * - `AbortError`
     * - `NotReadableError`
     * - `InternalError`
     * - `NoCameraAvailableError`
     *
     * In "single image mode" this method has no effect.
     *
     * @returns A promise resolving to the updated [[BarcodePicker]] object when the camera is accessed.
     */
    accessCamera() {
        if (!this.cameraAccess || this.cameraManager.activeCamera == null) {
            return new Promise((resolve, reject) => {
                this.cameraManager
                    .setupCameras()
                    .then(() => {
                    this.cameraAccess = true;
                    return resolve(this);
                })
                    .catch(reject);
            });
        }
        return Promise.resolve(this);
    }
    /**
     * Create a new parser object.
     *
     * @param dataFormat The format of the input data for the parser.
     * @returns The newly created parser.
     */
    createParserForFormat(dataFormat) {
        return this.scanner.createParserForFormat(dataFormat);
    }
    /**
     * Reassign the barcode picker to a different HTML element.
     *
     * All the barcode picker elements inside the current origin element will be moved to the new given one.
     *
     * @param originElement The HTMLElement into which all the necessary elements for the picker will be moved.
     * @returns The updated [[BarcodePicker]] object.
     */
    reassignOriginElement(originElement) {
        this.barcodePickerGui.reassignOriginElement(originElement);
        return this;
    }
    /**
     * Set the target frames per second to be processed by the scanning engine.
     *
     * The final speed is limited by the camera framerate (usually 30 FPS) and the frame processing time of the device.
     * By setting this to lower numbers devices can save power by performing less work during scanning operations,
     * depending on device speed (faster devices can "sleep" for longer periods).
     *
     * In "single image mode" this method has no effect.
     *
     * @param targetScanningFPS The target frames per second to be processed.
     * Must be a number bigger than 0, by default set to 30.
     * @returns The updated [[BarcodePicker]] object.
     */
    setTargetScanningFPS(targetScanningFPS) {
        if (targetScanningFPS > 0) {
            this.targetScanningFPS = targetScanningFPS;
        }
        return this;
    }
    /**
     * @returns The internally used initialized (and possibly configured) [[Scanner]] object instance.
     */
    getScanner() {
        return this.scanner;
    }
    /**
     * Clear the internal scanner session.
     *
     * This removes all recognized barcodes from the scanner session and allows them to be scanned again in case a custom
     * *codeDuplicateFilter* was set in the [[ScanSettings]].
     *
     * @returns The updated [[BarcodePicker]] object.
     */
    clearSession() {
        this.scanner.clearSession();
        return this;
    }
    triggerFatalError(error) {
        this.fatalError = error;
        console.error(error);
    }
    handleScanResult(scanResult) {
        this.eventEmitter.emit("processFrame", scanResult);
        if (scanResult.barcodes.length !== 0) {
            this.barcodePickerGui.flashGUI();
            if (this.playSoundOnScan) {
                this.beepSound.play();
            }
            if (this.vibrateOnScan && this.vibrateFunction != null) {
                this.vibrateFunction.call(navigator, 300);
            }
            this.eventEmitter.emit("scan", scanResult);
        }
    }
    scheduleVideoProcessing(timeout = 0) {
        window.setTimeout(() => {
            this.videoProcessing();
        }, timeout); // Leave some breathing room for other operations
    }
    scheduleNextVideoProcessing(processingStartTime) {
        if (this.targetScanningFPS < 30) {
            if (this.averageProcessingTime == null) {
                this.averageProcessingTime = performance.now() - processingStartTime;
            }
            else {
                this.averageProcessingTime = this.averageProcessingTime * 0.9 + (performance.now() - processingStartTime) * 0.1;
            }
            const nextProcessingCallDelay = 1000 / this.targetScanningFPS - this.averageProcessingTime;
            if (nextProcessingCallDelay > 16) {
                // More than 60 FPS, we have time to sleep
                this.scheduleVideoProcessing(nextProcessingCallDelay);
            }
            else {
                this.scheduleVideoProcessing();
            }
        }
        else {
            this.scheduleVideoProcessing();
        }
    }
    processVideoFrame(highQualitySingleFrameMode) {
        const imageData = this.barcodePickerGui.getVideoImageData();
        // This could happen in very weird situations and should be temporary
        if (imageData == null) {
            return Promise.resolve();
        }
        if (this.eventEmitter.listenerCount("submitFrame") > 0 && !this.scanningPaused) {
            this.eventEmitter.emit("submitFrame", {
                barcodes: [],
                imageData: imageData.slice(),
                imageSettings: this.scanner.getImageSettings()
            });
        }
        return new Promise(resolve => {
            this.scanner
                .processImage(imageData, highQualitySingleFrameMode)
                .then(scanResult => {
                if (!this.scanningPaused) {
                    this.handleScanResult(scanResult);
                }
                resolve();
            })
                .catch(scanError => {
                if (!this.scanningPaused) {
                    this.pauseScanning();
                    this.eventEmitter.emit("scanError", scanError);
                }
                resolve();
            });
        });
    }
    videoProcessing() {
        if (this.destroyed) {
            return;
        }
        if (this.cameraManager.activeCamera == null ||
            this.cameraManager.activeCamera.currentResolution == null ||
            this.fatalError != null ||
            this.scanningPaused ||
            !this.scanner.isReady() ||
            this.scanner.isBusyProcessing() ||
            this.latestVideoTimeProcessed === this.barcodePickerGui.getVideoCurrentTime()) {
            this.scheduleVideoProcessing();
            return;
        }
        if (this.latestVideoTimeProcessed == null) {
            // Show active GUI if needed, as now it's the moment the scanner is ready and used for the first time
            this.resumeScanning();
        }
        const processingStartTime = performance.now();
        this.latestVideoTimeProcessed = this.barcodePickerGui.getVideoCurrentTime();
        try {
            this.processVideoFrame(false).then(() => {
                this.scheduleNextVideoProcessing(processingStartTime);
            });
        }
        catch (error) {
            this.triggerFatalError(error);
        }
    }
}
// istanbul ignore next
(function (BarcodePicker) {
    /**
     * GUI style to be used by a barcode picker, used to hint barcode placement in the frame.
     */
    let GuiStyle;
    (function (GuiStyle) {
        /**
         * No GUI is shown to indicate where the barcode should be placed.
         * Be aware that the Scandit logo continues to be displayed as showing it is part of the license agreement.
         */
        GuiStyle["NONE"] = "none";
        /**
         * A laser line is shown.
         */
        GuiStyle["LASER"] = "laser";
        /**
         * A rectangular viewfinder with rounded corners is shown.
         */
        GuiStyle["VIEWFINDER"] = "viewfinder";
    })(GuiStyle = BarcodePicker.GuiStyle || (BarcodePicker.GuiStyle = {}));
    /**
     * Fit type used to control the resizing (scale) of the barcode picker to fit in its container *originElement*.
     */
    let ObjectFit;
    (function (ObjectFit) {
        /**
         * Scale to maintain aspect ratio while fitting within the *originElement*'s content box.
         * Aspect ratio is preserved, so the barcode picker will be "letterboxed" if its aspect ratio
         * does not match the aspect ratio of the box.
         */
        ObjectFit["CONTAIN"] = "contain";
        /**
         * Scale to maintain aspect ratio while filling the *originElement*'s entire content box.
         * Aspect ratio is preserved, so the barcode picker will be clipped to fit if its aspect ratio
         * does not match the aspect ratio of the box.
         */
        ObjectFit["COVER"] = "cover";
    })(ObjectFit = BarcodePicker.ObjectFit || (BarcodePicker.ObjectFit = {}));
})(BarcodePicker || (BarcodePicker = {}));
//# sourceMappingURL=barcodePicker.js.map