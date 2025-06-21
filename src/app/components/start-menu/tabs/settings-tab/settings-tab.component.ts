import { Component, inject } from '@angular/core';
import { BridgeService } from '../../../../utils/bridge/bridge.service';
import { IMonetColors } from '../../../../utils/bridge/monet.types';

@Component({
	selector: 'start-menu-settings-tab',
	imports: [],
	templateUrl: './settings-tab.component.html',
	styleUrl: './settings-tab.component.scss',
})
export class SettingsTabComponent {
	private readonly _bridgeService = inject(BridgeService);

	get monetColors(): IMonetColors {
		return this._bridgeService.getMonetColors();
	}

	openBridgeSettings() {
		this._bridgeService.requestOpenBridgeSettings();
	}
}
