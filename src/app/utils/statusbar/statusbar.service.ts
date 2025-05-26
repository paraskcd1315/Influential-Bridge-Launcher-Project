import { inject, Injectable, signal } from '@angular/core';
import { BridgeService } from '../bridge/bridge.service';
import { MediaType } from './media.type';

@Injectable({
	providedIn: 'root',
})
export class StatusbarService {
	private readonly _bridgeService = inject(BridgeService);

	batteryIsCharging = signal<boolean>(false);
	batteryLevel = signal<number>(0);

	mobileLevel = signal<number>(0);
	mobileNetworkType = signal<string>('');

	wifiLevel = signal<number>(0);
	wifiStrength = signal<number>(0);

	notificationCounts = signal<any>({});

	media = signal<MediaType>({});
	isPlaying = signal<boolean>(false);

	location = signal<{ latitude: number; longitude: number }>({ latitude: 0, longitude: 0 });

	constructor() {
		this.batteryIsCharging.set(this._bridgeService.getBatteryIsCharging());
		this.batteryLevel.set(this._bridgeService.getBatteryLevel());
		this.mobileLevel.set(this._bridgeService.getMobileSignalLevel());
		this.mobileNetworkType.set(this._bridgeService.getNetworkType());
		this.wifiLevel.set(this._bridgeService.getWifiSignalLevel());
		this.wifiStrength.set(this._bridgeService.getWifiSignalStrength());
		this.notificationCounts.set(this._bridgeService.getNotificationCounts());
		this.media.set({
			artist: this._bridgeService.getCurrentMediaMetadataArtist(),
			album: this._bridgeService.getCurrentMediaMetadataAlbum(),
			title: this._bridgeService.getCurrentMediaMetadataTitle(),
			duration: this._bridgeService.getCurrentMediaMetadataDuration(),
			artworkBase64: this._bridgeService.getCurrentMediaMetadataArtworkBase64(),
		});
		this.isPlaying.set(this._bridgeService.getIsPlaying());
		this.location.set({
			latitude: this._bridgeService.getLocationLatitude(),
			longitude: this._bridgeService.getLocationLongitude(),
		});

		window.onBridgeEvent = (event: any) => {
			switch (event.name) {
				case 'batteryChargingIsChanged':
					this.batteryIsCharging.set(event.value);
					break;
				case 'batteryLevelChanged':
					this.batteryLevel.set(event.value);
					break;
				case 'wifiSignalLevelIsChanged':
					this.wifiLevel.set(event.value);
					break;
				case 'mobileSignalLevelChanged':
					this.mobileLevel.set(event.value);
					break;
				case 'mobileNetworkTypeIsChanged':
					this.mobileNetworkType.set(event.value);
					break;
				case 'notificationCountsChanged':
					this.notificationCounts.set(event.value);
					break;
				case 'mediaMetadataChanged':
					this.media.set({
						artist: event.artist,
						album: event.album,
						title: event.title,
						duration: event.duration,
						artworkBase64: event.artworkBase64,
					});
					break;
				case 'isPlayingChanged':
					this.isPlaying.set(event.value);
					break;
				case 'locationChanged':
					this.location.set({
						latitude: event.latitude,
						longitude: event.longitude,
					});
					break;
			}
		};
	}
}
