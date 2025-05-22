import { inject, Injectable, signal } from '@angular/core';
import { BridgeService } from '../bridge/bridge.service';

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

	notificationCounts = signal<Record<string, number>>({});

	constructor() {
		this.batteryIsCharging.set(this._bridgeService.getBatteryIsCharging());
		this.batteryLevel.set(this._bridgeService.getBatteryLevel());
		this.mobileLevel.set(this._bridgeService.getMobileSignalLevel());
		this.mobileNetworkType.set(this._bridgeService.getNetworkType());
		this.wifiLevel.set(this._bridgeService.getWifiSignalLevel());
		this.wifiStrength.set(this._bridgeService.getWifiSignalStrength());
		this.notificationCounts.set(this._bridgeService.getNotificationCounts());

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
			}
		};
	}
}
