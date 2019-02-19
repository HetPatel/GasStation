import { UAParser } from "ua-parser-js";
export { UAParser };
import { BrowserCompatibility } from "./browserCompatibility";
export declare namespace BrowserHelper {
    /**
     * @hidden
     */
    interface Browser {
        name: string | undefined;
        version: string | undefined;
    }
    /**
     * @hidden
     */
    interface CPU {
        architecture: string | undefined;
    }
    /**
     * @hidden
     */
    interface Device {
        model: string | undefined;
        vendor: string | undefined;
        type: string | undefined;
    }
    /**
     * @hidden
     */
    interface Engine {
        name: string | undefined;
        version: string | undefined;
    }
    /**
     * @hidden
     */
    interface OS {
        name: string | undefined;
        version: string | undefined;
    }
    /**
     * @hidden
     */
    const userAgentInfo: {
        getBrowser(): Browser;
        getOS(): OS;
        getEngine(): Engine;
        getDevice(): Device;
        getCPU(): CPU;
        getUA(): string;
        setUA(uastring: string): void;
    };
    /**
     * @returns The built [[BrowserCompatibility]] object representing the current OS/Browser's support for features.
     */
    function checkBrowserCompatibility(): BrowserCompatibility;
    /**
     * @hidden
     *
     * Get a device id for the current browser, when available it's retrieved from a cookie,
     * when not it's randomly generated and stored in a cookie to be retrieved by later calls.
     *
     * @returns The device id for the current browser.
     */
    function getDeviceId(): string;
}
