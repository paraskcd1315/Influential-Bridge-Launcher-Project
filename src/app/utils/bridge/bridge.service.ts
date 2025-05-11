import { computed, Injectable, resource, signal } from '@angular/core';
import { BridgeGetAppsResponse } from '@bridgelauncher/api';
import { BridgeMock } from '@bridgelauncher/api-mock';
import { environment } from '../../../environments/environment';
const { Bridge } = window as any;

@Injectable({
    providedIn: 'root',
})
export class BridgeService {
    bridge = signal<any>(undefined);

    constructor() {
        this._injectBridgeMockInDev();
    }

    appsResource = resource({
        request: () => ({ bridge: this.bridge() }),
        loader: ({ request }) => fetch(request.bridge.getAppsURL()).then((res) => res.json()),
    });

    apps = computed(() => {
        return (this.appsResource.value() as BridgeGetAppsResponse)?.apps.sort((x, y) => x.label.localeCompare(y.label)) ?? [];
    });

    getAppIcon(packageName: string) {
        return this.bridge().getDefaultAppIconURL(packageName);
    }

    requestLaunchApp(packageName: string) {
        return this.bridge().requestLaunchApp(packageName, true);
    }

    private _injectBridgeMockInDev() {
        if (!environment.production && !Bridge) {
            window.Bridge = new BridgeMock();
        }

        this.bridge.set(window.Bridge);
    }
}
