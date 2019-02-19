/* tslint:disable:no-implicit-dependencies */
/**
 * BarcodePickerCameraManager tests
 */
import test from "ava";
import * as sinon from "sinon";
import { BarcodePickerCameraManager } from "./barcodePickerCameraManager";
import { BarcodePickerGui } from "./barcodePickerGui";
import { CameraAccess } from "./cameraAccess";
Object.defineProperty(screen, "width", {
    writable: true
});
Object.defineProperty(screen, "height", {
    writable: true
});
screen.width = 100;
screen.height = 100;
const triggerFatalErrorSpy = sinon.spy();
// Speed up times
BarcodePickerCameraManager.cameraAccessTimeoutMs /= 10;
BarcodePickerCameraManager.cameraMetadataCheckTimeoutMs /= 10;
BarcodePickerCameraManager.cameraMetadataCheckIntervalMs /= 10;
BarcodePickerCameraManager.getCapabilitiesTimeoutMs /= 10;
BarcodePickerCameraManager.autofocusIntervalMs /= 10;
BarcodePickerCameraManager.manualToAutofocusResumeTimeoutMs /= 10;
BarcodePickerCameraManager.manualFocusWaitTimeoutMs /= 10;
async function wait(ms) {
    return new Promise(resolve => {
        // tslint:disable-next-line no-string-based-set-timeout
        setTimeout(resolve, ms);
    });
}
function fakeGetCameras(cameraAmount) {
    if (CameraAccess.getCameras.restore != null) {
        CameraAccess.getCameras.restore();
    }
    sinon.stub(CameraAccess, "getCameras").returns(Promise.resolve(
    // tslint:disable-next-line:prefer-array-literal
    new Array(cameraAmount).fill({
        deviceId: "1",
        groupId: "1",
        kind: "videoinput",
        label: "Fake Camera Device (back)"
    })));
}
function fakeAccessCameraStream(mediaTrackCapabilities) {
    if (CameraAccess.accessCameraStream.restore != null) {
        CameraAccess.accessCameraStream.restore();
    }
    sinon.stub(CameraAccess, "accessCameraStream").callsFake(() => {
        const mediaStreamTrack = {
            stop: sinon.spy(),
            addEventListener: sinon.spy(),
            getSettings: () => {
                return {
                    width: 640,
                    height: 480
                };
            }
        };
        if (mediaTrackCapabilities != null) {
            mediaStreamTrack.getCapabilities = () => {
                return mediaTrackCapabilities;
            };
        }
        return Promise.resolve({
            getTracks: () => {
                return [mediaStreamTrack];
            },
            getVideoTracks: () => {
                return [mediaStreamTrack];
            }
        });
    });
}
function fakeMediaStream(cameraManager, mediaTrackCapabilities) {
    const mediaStreamTrack = {
        constraints: {},
        stop: sinon.spy(),
        getConstraints: function () {
            return this.constraints;
        },
        applyConstraints: sinon.stub().callsFake((mediaTrackConstraints) => {
            mediaStreamTrack.constraints = mediaTrackConstraints;
            return Promise.resolve();
        })
    };
    if (mediaTrackCapabilities != null) {
        mediaStreamTrack.getCapabilities = () => {
            return mediaTrackCapabilities;
        };
    }
    const mediaStream = {
        getVideoTracks: () => {
            return [mediaStreamTrack];
        }
    };
    cameraManager.mediaStream = mediaStream;
    cameraManager.storeStreamCapabilities();
    return mediaStream;
}
test("isCameraSwitcherEnabled & setCameraSwitcherEnabled", async (t) => {
    const barcodePickerGui = sinon.createStubInstance(BarcodePickerGui);
    const cameraManager = new BarcodePickerCameraManager(triggerFatalErrorSpy, barcodePickerGui);
    cameraManager.setInteractionOptions(false, false, false, false);
    t.is(cameraManager.isCameraSwitcherEnabled(), false);
    t.is(barcodePickerGui.setCameraSwitcherVisible.callCount, 0);
    fakeGetCameras(1);
    await cameraManager.setCameraSwitcherEnabled(true);
    t.is(barcodePickerGui.setCameraSwitcherVisible.callCount, 0);
    fakeGetCameras(2);
    await cameraManager.setCameraSwitcherEnabled(true);
    t.is(barcodePickerGui.setCameraSwitcherVisible.callCount, 1);
    t.deepEqual(barcodePickerGui.setCameraSwitcherVisible.lastCall.args, [true]);
    t.is(cameraManager.isCameraSwitcherEnabled(), true);
    await cameraManager.setCameraSwitcherEnabled(false);
    t.is(barcodePickerGui.setCameraSwitcherVisible.callCount, 2);
    t.deepEqual(barcodePickerGui.setCameraSwitcherVisible.lastCall.args, [false]);
    t.is(cameraManager.isCameraSwitcherEnabled(), false);
});
test("isTorchToggleEnabled & setTorchToggleEnabled", t => {
    const barcodePickerGui = sinon.createStubInstance(BarcodePickerGui);
    const cameraManager = new BarcodePickerCameraManager(triggerFatalErrorSpy, barcodePickerGui);
    cameraManager.setInteractionOptions(false, false, false, false);
    t.is(cameraManager.isTorchToggleEnabled(), false);
    t.is(barcodePickerGui.setTorchTogglerVisible.callCount, 0);
    cameraManager.setTorchToggleEnabled(true);
    t.is(barcodePickerGui.setTorchTogglerVisible.callCount, 0);
    fakeMediaStream(cameraManager, {
        torch: true
    });
    cameraManager.setTorchToggleEnabled(true);
    t.is(barcodePickerGui.setTorchTogglerVisible.callCount, 1);
    t.deepEqual(barcodePickerGui.setTorchTogglerVisible.lastCall.args, [true]);
    t.is(cameraManager.isTorchToggleEnabled(), true);
    cameraManager.setTorchToggleEnabled(false);
    t.is(barcodePickerGui.setTorchTogglerVisible.callCount, 2);
    t.deepEqual(barcodePickerGui.setTorchTogglerVisible.lastCall.args, [false]);
    t.is(cameraManager.isTorchToggleEnabled(), false);
});
test("isTapToFocusEnabled & setTapToFocusEnabled", t => {
    const barcodePickerGui = sinon.createStubInstance(BarcodePickerGui);
    const videoElementAddEventListener = sinon.spy();
    const videoElementRemoveEventListener = sinon.spy();
    barcodePickerGui.videoElement = {
        addEventListener: videoElementAddEventListener,
        removeEventListener: videoElementRemoveEventListener
    };
    const cameraManager = new BarcodePickerCameraManager(triggerFatalErrorSpy, barcodePickerGui);
    cameraManager.setInteractionOptions(false, false, false, false);
    t.is(cameraManager.isTapToFocusEnabled(), false);
    t.is(videoElementAddEventListener.callCount, 0);
    cameraManager.setTapToFocusEnabled(true);
    t.is(videoElementAddEventListener.callCount, 0);
    fakeMediaStream(cameraManager);
    cameraManager.setTapToFocusEnabled(true);
    t.is(videoElementAddEventListener.callCount, 2);
    t.true(videoElementAddEventListener.calledWith("mousedown"));
    t.true(videoElementAddEventListener.calledWith("touchend"));
    t.is(cameraManager.isTapToFocusEnabled(), true);
    t.is(videoElementRemoveEventListener.callCount, 0);
    cameraManager.setTapToFocusEnabled(false);
    t.is(videoElementRemoveEventListener.callCount, 2);
    t.true(videoElementRemoveEventListener.calledWith("mousedown"));
    t.true(videoElementRemoveEventListener.calledWith("touchend"));
    t.is(cameraManager.isTapToFocusEnabled(), false);
});
test("setTorchEnabled & toggleTorch", t => {
    const barcodePickerGui = sinon.createStubInstance(BarcodePickerGui);
    const cameraManager = new BarcodePickerCameraManager(triggerFatalErrorSpy, barcodePickerGui);
    cameraManager.setTorchEnabled(true);
    const mediaTrackCapabilities = {
        torch: true
    };
    const applyConstraintsStub = (fakeMediaStream(cameraManager, mediaTrackCapabilities).getVideoTracks()[0].applyConstraints);
    t.true(applyConstraintsStub.notCalled);
    cameraManager.setTorchEnabled(true);
    t.true(applyConstraintsStub.calledOnce);
    t.true(applyConstraintsStub.calledWith({ advanced: [{ torch: true }] }));
    cameraManager.setTorchEnabled(false);
    t.true(applyConstraintsStub.calledTwice);
    t.true(applyConstraintsStub.calledWith({ advanced: [{ torch: false }] }));
    applyConstraintsStub.resetHistory();
    cameraManager.toggleTorch();
    t.true(applyConstraintsStub.calledOnce);
    t.true(applyConstraintsStub.calledWith({ advanced: [{ torch: true }] }));
    cameraManager.toggleTorch();
    t.true(applyConstraintsStub.calledTwice);
    t.true(applyConstraintsStub.calledWith({ advanced: [{ torch: false }] }));
});
test("setZoom", t => {
    const barcodePickerGui = sinon.createStubInstance(BarcodePickerGui);
    const cameraManager = new BarcodePickerCameraManager(triggerFatalErrorSpy, barcodePickerGui);
    cameraManager.setZoom(2);
    const mediaTrackCapabilities = {
        zoom: {
            max: 9,
            min: 1,
            step: 0.1
        }
    };
    const applyConstraintsStub = (fakeMediaStream(cameraManager, mediaTrackCapabilities).getVideoTracks()[0].applyConstraints);
    t.true(applyConstraintsStub.notCalled);
    cameraManager.setZoom(0);
    t.deepEqual(applyConstraintsStub.lastCall.args, [{ advanced: [{ zoom: 1 }] }]);
    cameraManager.setZoom(1);
    t.deepEqual(applyConstraintsStub.lastCall.args, [{ advanced: [{ zoom: 9 }] }]);
    cameraManager.setZoom(0.5);
    t.deepEqual(applyConstraintsStub.lastCall.args, [{ advanced: [{ zoom: 5 }] }]);
    cameraManager.setZoom(10);
    t.deepEqual(applyConstraintsStub.lastCall.args, [{ advanced: [{ zoom: 9 }] }]);
    cameraManager.setZoom(0.25, 5);
    t.deepEqual(applyConstraintsStub.lastCall.args, [{ advanced: [{ zoom: 7 }] }]);
});
test("triggerZoomStart & triggerZoomMove", t => {
    const barcodePickerGui = sinon.createStubInstance(BarcodePickerGui);
    const cameraManager = new BarcodePickerCameraManager(triggerFatalErrorSpy, barcodePickerGui);
    const touchStartEvent = {
        preventDefault: sinon.spy(),
        type: "touchstart"
    };
    const touchStart0xEvent = {
        ...touchStartEvent,
        touches: [
            {
                screenX: 0,
                screenY: 0
            },
            {
                screenX: 0,
                screenY: 0
            }
        ]
    };
    const touchStart25xEvent = {
        ...touchStartEvent,
        touches: [
            {
                screenX: 0,
                screenY: 0
            },
            {
                screenX: 25,
                screenY: 0
            }
        ]
    };
    const touchStart50xEvent = {
        ...touchStartEvent,
        touches: [
            {
                screenX: 0,
                screenY: 0
            },
            {
                screenX: 50,
                screenY: 0
            }
        ]
    };
    cameraManager.triggerZoomStart({
        ...touchStartEvent,
        touches: [1]
    });
    cameraManager.triggerZoomMove({
        ...touchStartEvent,
        touches: [1]
    });
    cameraManager.triggerZoomStart(touchStart25xEvent);
    const mediaTrackCapabilities = {
        torch: true,
        zoom: {
            max: 9,
            min: 1,
            step: 0.1
        }
    };
    const applyConstraintsStub = (fakeMediaStream(cameraManager, mediaTrackCapabilities).getVideoTracks()[0].applyConstraints);
    t.true(applyConstraintsStub.notCalled);
    cameraManager.triggerZoomStart(touchStart0xEvent);
    cameraManager.setTorchEnabled(true);
    cameraManager.triggerZoomStart(touchStart0xEvent);
    cameraManager.triggerZoomMove(touchStart0xEvent);
    t.deepEqual(applyConstraintsStub.lastCall.args, [{ advanced: [{ zoom: 1 }] }]);
    cameraManager.triggerZoomMove(touchStart25xEvent);
    t.deepEqual(applyConstraintsStub.lastCall.args, [{ advanced: [{ zoom: 5 }] }]);
    cameraManager.triggerZoomMove(touchStart50xEvent);
    t.deepEqual(applyConstraintsStub.lastCall.args, [{ advanced: [{ zoom: 9 }] }]);
    cameraManager.triggerZoomStart(touchStart25xEvent);
    cameraManager.triggerZoomMove(touchStart0xEvent);
    t.deepEqual(applyConstraintsStub.lastCall.args, [{ advanced: [{ zoom: 5 }] }]);
});
// tslint:disable-next-line:max-func-body-length
test("manual / auto focus", async (t) => {
    const barcodePickerGui = sinon.createStubInstance(BarcodePickerGui);
    const cameraManager = new BarcodePickerCameraManager(triggerFatalErrorSpy, barcodePickerGui);
    cameraManager.triggerManualFocus({
        preventDefault: sinon.spy(),
        type: "touchend",
        touches: [1, 2]
    });
    cameraManager.pinchToZoomDistance = 1;
    cameraManager.triggerManualFocus({
        preventDefault: sinon.spy(),
        type: "mousedown"
    });
    cameraManager.triggerManualFocus({
        preventDefault: sinon.spy(),
        type: "touchend",
        touches: []
    });
    // Trigger manual focus when not supported
    let mediaTrackCapabilities = {};
    let applyConstraintsStub = (fakeMediaStream(cameraManager, mediaTrackCapabilities).getVideoTracks()[0].applyConstraints);
    t.true(applyConstraintsStub.notCalled);
    cameraManager.triggerManualFocus();
    t.true(applyConstraintsStub.notCalled);
    mediaTrackCapabilities = {
        focusMode: ["single-shot", "continuous"] // this is a weird mix
    };
    applyConstraintsStub = (fakeMediaStream(cameraManager, mediaTrackCapabilities).getVideoTracks()[0].applyConstraints);
    t.true(applyConstraintsStub.notCalled);
    cameraManager.triggerManualFocus();
    t.true(applyConstraintsStub.notCalled);
    // Trigger manual focus when single-shot only is supported
    mediaTrackCapabilities = {
        focusMode: ["single-shot"]
    };
    applyConstraintsStub = (fakeMediaStream(cameraManager, mediaTrackCapabilities).getVideoTracks()[0].applyConstraints);
    t.true(applyConstraintsStub.notCalled);
    cameraManager.triggerManualFocus();
    t.true(applyConstraintsStub.calledOnce);
    t.true(applyConstraintsStub.calledWith({ advanced: [{ focusMode: "single-shot" }] }));
    // Enable background single-shot autofocus
    applyConstraintsStub.resetHistory();
    cameraManager.storeStreamCapabilities();
    cameraManager.setupAutofocus();
    await wait(BarcodePickerCameraManager.autofocusIntervalMs * 4);
    t.true(applyConstraintsStub.callCount >= 2);
    t.true(applyConstraintsStub.alwaysCalledWith({ advanced: [{ focusMode: "single-shot" }] }));
    // Trigger manual focus when single-shot only is supported (while background single-shot autofocus is active)
    cameraManager.triggerManualFocus();
    applyConstraintsStub.resetHistory();
    // Background single-shot autofocus should be disabled for a while
    await wait(BarcodePickerCameraManager.autofocusIntervalMs * 2);
    t.true(applyConstraintsStub.notCalled);
    await wait(BarcodePickerCameraManager.manualToAutofocusResumeTimeoutMs * 2);
    // Background single-shot autofocus should be enabled now
    t.true(applyConstraintsStub.called);
    t.true(applyConstraintsStub.alwaysCalledWith({ advanced: [{ focusMode: "single-shot" }] }));
    cameraManager.stopStream();
    // Trigger manual focus when all focus modes are supported
    mediaTrackCapabilities = {
        focusMode: ["single-shot", "continuous", "manual"]
    };
    applyConstraintsStub = (fakeMediaStream(cameraManager, mediaTrackCapabilities).getVideoTracks()[0].applyConstraints);
    cameraManager.triggerManualFocus();
    t.true(applyConstraintsStub.calledOnce);
    t.true(applyConstraintsStub.calledWith({ advanced: [{ focusMode: "continuous" }] }));
    applyConstraintsStub.resetHistory();
    await wait(BarcodePickerCameraManager.manualFocusWaitTimeoutMs * 2);
    t.true(applyConstraintsStub.calledOnce);
    t.true(applyConstraintsStub.calledWith({ advanced: [{ focusMode: "manual" }] }));
    applyConstraintsStub.resetHistory();
    await wait(BarcodePickerCameraManager.manualToAutofocusResumeTimeoutMs * 2);
    t.true(applyConstraintsStub.calledOnce);
    t.true(applyConstraintsStub.calledWith({ advanced: [{ focusMode: "continuous" }] }));
});
test("isPinchToZoomEnabled & setPinchToZoomEnabled", t => {
    const barcodePickerGui = sinon.createStubInstance(BarcodePickerGui);
    const videoElementAddEventListener = sinon.spy();
    const videoElementRemoveEventListener = sinon.spy();
    barcodePickerGui.videoElement = {
        addEventListener: videoElementAddEventListener,
        removeEventListener: videoElementRemoveEventListener
    };
    const cameraManager = new BarcodePickerCameraManager(triggerFatalErrorSpy, barcodePickerGui);
    cameraManager.setInteractionOptions(false, false, false, false);
    t.is(cameraManager.isPinchToZoomEnabled(), false);
    t.is(videoElementAddEventListener.callCount, 0);
    cameraManager.setPinchToZoomEnabled(true);
    t.is(videoElementAddEventListener.callCount, 0);
    fakeMediaStream(cameraManager);
    cameraManager.setPinchToZoomEnabled(true);
    t.is(videoElementAddEventListener.callCount, 2);
    t.true(videoElementAddEventListener.calledWith("touchstart"));
    t.true(videoElementAddEventListener.calledWith("touchmove"));
    t.is(cameraManager.isPinchToZoomEnabled(), true);
    t.is(videoElementRemoveEventListener.callCount, 0);
    cameraManager.setPinchToZoomEnabled(false);
    t.is(videoElementRemoveEventListener.callCount, 2);
    t.true(videoElementRemoveEventListener.calledWith("touchstart"));
    t.true(videoElementRemoveEventListener.calledWith("touchmove"));
    t.is(cameraManager.isPinchToZoomEnabled(), false);
});
test("setupCameras", async (t) => {
    const barcodePickerGui = sinon.createStubInstance(BarcodePickerGui);
    const videoElementRemoveEventListener = sinon.spy();
    barcodePickerGui.videoElement = {
        loadedmetadataEventListener: null,
        addEventListener: function (eventType, listener) {
            if (eventType === "loadedmetadata") {
                this.loadedmetadataEventListener = listener;
            }
        },
        removeEventListener: videoElementRemoveEventListener,
        dispatchEvent: sinon.spy()
    };
    barcodePickerGui.videoElement.load = function () {
        this.loadedmetadataEventListener();
        this.videoWidth = 640;
        this.videoHeight = 480;
        this.currentTime = 0;
        this.onloadeddata();
        setTimeout(() => {
            this.currentTime = 1;
        }, BarcodePickerCameraManager.cameraMetadataCheckIntervalMs * 2);
    };
    const cameraManager = new BarcodePickerCameraManager(triggerFatalErrorSpy, barcodePickerGui);
    cameraManager.setInteractionOptions(true, true, true, true);
    t.is(cameraManager.isCameraSwitcherEnabled(), true);
    t.is(barcodePickerGui.setCameraSwitcherVisible.callCount, 0);
    let mediaTrackCapabilities = {
        torch: true
    };
    fakeAccessCameraStream(mediaTrackCapabilities);
    fakeGetCameras(1);
    await cameraManager.setupCameras();
    t.is(barcodePickerGui.setCameraSwitcherVisible.callCount, 0);
    await wait(BarcodePickerCameraManager.getCapabilitiesTimeoutMs * 2);
    t.deepEqual(cameraManager.mediaTrackCapabilities, mediaTrackCapabilities);
    mediaTrackCapabilities = {
        torch: false,
        focusMode: ["single-shot"]
    };
    fakeAccessCameraStream(mediaTrackCapabilities);
    fakeGetCameras(2);
    await cameraManager.setupCameras();
    t.is(barcodePickerGui.setCameraSwitcherVisible.callCount, 1);
    await wait(BarcodePickerCameraManager.getCapabilitiesTimeoutMs * 2);
    t.deepEqual(cameraManager.mediaTrackCapabilities, mediaTrackCapabilities);
    barcodePickerGui.videoElement.load = function () {
        this.loadedmetadataEventListener();
        this.videoWidth = 640;
        this.videoHeight = 480;
        this.currentTime = 0;
        this.onloadeddata();
        // Intentionally never have valid metadata
    };
    let error = await t.throwsAsync(cameraManager.setupCameras());
    t.is(error.message, "Could not initialize camera correctly");
    barcodePickerGui.videoElement.load = function () {
        this.loadedmetadataEventListener();
        // Intentionally never call onloadeddata()
    };
    error = await t.throwsAsync(cameraManager.setupCameras());
    t.is(error.message, "Could not initialize camera correctly");
});
//# sourceMappingURL=barcodePickerCameraManager.spec.js.map