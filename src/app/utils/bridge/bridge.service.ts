import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { BridgeGetAppsResponse } from '@bridgelauncher/api';
import { BridgeMock } from '@bridgelauncher/api-mock';
import { environment } from '../../../environments/environment';
const { Bridge } = window as any;

@Injectable({
	providedIn: 'root',
})
export class BridgeService {
	private readonly _httpClient = inject(HttpClient);
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

	getBatteryLevel() {
		return this.bridge().getBatteryLevel();
	}

	getBatteryIsCharging() {
		return this.bridge().getBatteryIsCharging();
	}

	getWifiSignalLevel() {
		return this.bridge().getWifiSignalLevel();
	}

	getMobileSignalLevel() {
		return this.bridge().getMobileSignalLevel();
	}

	getMobileSignalStrength() {
		return this.bridge().getMobileSignalStrength();
	}

	getWifiSignalStrength() {
		return this.bridge().getWifiSignalStrength();
	}

	getNetworkType() {
		return this.bridge().getNetworkType();
	}

	getWallpaper() {
		return `data:image/png;base64,${this.bridge().getSystemWallpaperBase64()}`;
	}

	refreshWallpaper() {
		this.bridge().requestWallpaperRefresh();
	}

	getAppIcon(packageName: string) {
		return this.bridge().getDefaultAppIconURL(packageName);
	}

	requestLaunchApp(packageName: string) {
		return this.bridge().requestLaunchApp(packageName, true);
	}

	requestUninstallApp(packageName: string) {
		this.bridge().requestAppUninstall(packageName);
	}

	requestShowAppProperties(packageName: string) {
		this.bridge().requestOpenAppInfo(packageName);
	}

	private _injectBridgeMockInDev() {
		if (!environment.production && !Bridge) {
			window.Bridge = new BridgeMock();
		}

		this.bridge.set(window.Bridge);
	}
}
