import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { BridgeGetAppsResponse } from '@bridgelauncher/api';
import { BridgeMock } from '@bridgelauncher/api-mock';
import { map } from 'rxjs';
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
		console.log('Get Notifications', this.bridge().getNotificationCounts());
	}

	appsResource = rxResource({
		request: () => ({ bridge: this.bridge() }),
		loader: ({ request }) => this._httpClient.get(request.bridge.getAppsURL()).pipe(map((x) => (x as BridgeGetAppsResponse).apps)),
	});

	apps = computed(() => {
		return this.appsResource.value()?.sort((x, y) => x.label.localeCompare(y.label)) ?? [];
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

	getNotificationCounts(): Record<string, number> {
		return JSON.parse(this.bridge().getNotificationCounts());
	}

	private _injectBridgeMockInDev() {
		if (!environment.production && !Bridge) {
			window.Bridge = new BridgeMock();
		}

		this.bridge.set(window.Bridge);
	}
}
