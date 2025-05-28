import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
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
		effect(() => {
			console.log(JSON.stringify(this.apps()));
		});
	}

	appsResource = rxResource({
		request: () => ({ bridge: this.bridge() }),
		loader: ({ request }) => this._httpClient.get(request.bridge.getAppsURL()).pipe(map((x) => (x as BridgeGetAppsResponse).apps)),
	});

	apps = computed(() => {
		return this.appsResource.value()?.sort((x, y) => x.label.localeCompare(y.label)) ?? [];
	});

	getBatteryLevel() {
		return this.bridge().getBatteryLevel?.();
	}

	getBatteryIsCharging() {
		return this.bridge().getBatteryIsCharging?.();
	}

	getWifiSignalLevel() {
		return this.bridge().getWifiSignalLevel?.();
	}

	getMobileSignalLevel() {
		return this.bridge().getMobileSignalLevel?.();
	}

	getMobileSignalStrength() {
		return this.bridge().getMobileSignalStrength?.();
	}

	getWifiSignalStrength() {
		return this.bridge().getWifiSignalStrength?.();
	}

	getNetworkType() {
		return this.bridge().getNetworkType?.();
	}

	getWallpaper() {
		if (this.bridge().getSystemWallpaperBase64?.()) {
			return `data:image/png;base64,${this.bridge().getSystemWallpaperBase64()}`;
		} else {
			return 'assets/wallpaper/wallpaper.jpg';
		}
	}

	refreshWallpaper() {
		this.bridge().requestWallpaperRefresh?.();
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

	getNotificationCounts(): Record<string, number> | undefined {
		if (this.bridge().getNotificationCounts?.()) {
			return JSON.parse(this.bridge().getNotificationCounts());
		}

		return undefined;
	}

	requestMediaPlay() {
		this.bridge().requestMediaPlay?.();
	}

	requestMediaPause() {
		this.bridge().requestMediaPause?.();
	}

	requestMediaSkipNext() {
		this.bridge().requestMediaSkipNext?.();
	}

	requestMediaSkipPrevious() {
		this.bridge().requestMediaSkipPrevious?.();
	}

	getCurrentMediaMetadataArtist() {
		return this.bridge().getCurrentMediaMetadataArtist?.();
	}

	getCurrentMediaMetadataAlbum() {
		return this.bridge().getCurrentMediaMetadataAlbum?.();
	}

	getCurrentMediaMetadataTitle() {
		return this.bridge().getCurrentMediaMetadataTitle?.();
	}

	getCurrentMediaMetadataDuration() {
		return this.bridge().getCurrentMediaMetadataDuration?.();
	}

	getCurrentMediaMetadataArtworkBase64() {
		return this.bridge().getCurrentMediaMetadataArtworkBase64?.();
	}

	getIsPlaying() {
		return this.bridge().getIsPlaying?.();
	}

	getLocationLatitude() {
		return this.bridge().getLocationLatitude?.();
	}

	getLocationLongitude() {
		return this.bridge().getLocationLongitude?.();
	}

	requestMediaAppLaunch() {
		this.bridge().requestMediaAppLaunch?.();
	}

	getGoogleSearchSuggestions(query: string) {
		return this.bridge().getGoogleSearchSuggestions?.(query);
	}

	requestGoogleSearch(query: string) {
		return this.bridge().requestGoogleSearch?.(query);
	}

	private _injectBridgeMockInDev() {
		if (!environment.production && !Bridge) {
			window.Bridge = new BridgeMock();
		}

		this.bridge.set(window.Bridge);
	}
}
