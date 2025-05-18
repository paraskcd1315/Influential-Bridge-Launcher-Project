import { effect, inject, Injectable, signal } from '@angular/core';
import { BridgeService } from '../bridge/bridge.service';

@Injectable({
	providedIn: 'root',
})
export class StatusbarService {
	private readonly _bridgeService = inject(BridgeService);

	batteryIsCharging = signal<boolean>(false);
	batteryLevel = signal<number>(0);

	mobileLevel = signal<number>(0);

	wifiLevel = signal<number>(0);
	wifiStrength = signal<number>(0);

	constructor() {
		this.batteryIsCharging.set(this._bridgeService.getBatteryIsCharging());
		this.batteryLevel.set(this._bridgeService.getBatteryLevel());
		this.mobileLevel.set(this._bridgeService.getMobileSignalLevel());
		this.wifiLevel.set(this._bridgeService.getWifiSignalLevel());
		this.wifiStrength.set(this._bridgeService.getWifiSignalStrength());

		window.onBridgeEvent = (event: any) => {
			switch (event.name) {
				case 'batteryChargingIsChanged':
					this.batteryIsCharging.set(event.value);
					break;
				case 'batteryLevelChanged':
					this.batteryLevel.set(event.value);
					break;
				case 'wifiStrengthIsChanged':
					console.log('wifiStrengthIsChanged', event.value);
					this.wifiLevel.set(this._bridgeService.getWifiSignalLevel());
					break;
				case 'mobileSignalLevelChanged':
					this.mobileLevel.set(event.value);
					break;
			}
		};

		effect(() => {
			console.log('Battery', this.batteryIsCharging());
			console.log('batteryLevel', this.batteryLevel());
			console.log('mobileLevel', this.mobileLevel());
			console.log('wifiLevel', this.wifiLevel());
			console.log('wifiStrength', this.wifiStrength());
		});
	}
}
