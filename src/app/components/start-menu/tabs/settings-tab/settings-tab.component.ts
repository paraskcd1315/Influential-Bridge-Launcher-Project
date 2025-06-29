import { Component, inject } from '@angular/core';
import { BridgeService } from '../../../../utils/bridge/bridge.service';
import { IMonetColors } from '../../../../utils/bridge/monet.types';
import { PersistenceService } from '../../../../utils/persistence/persistence.service';
import { ISettings } from '../../../../utils/persistence/persistence.types';

@Component({
	selector: 'start-menu-settings-tab',
	imports: [],
	templateUrl: './settings-tab.component.html',
	styleUrl: './settings-tab.component.scss',
})
export class SettingsTabComponent {
	private readonly _bridgeService = inject(BridgeService);
	private readonly _persistenceService = inject(PersistenceService);

	settings = this._persistenceService.settingsStore;

	get monetColors(): IMonetColors {
		return this._bridgeService.getMonetColors();
	}

	openBridgeSettings() {
		this._bridgeService.requestOpenBridgeSettings();
	}

	openWallpaperPicker() {
		this._bridgeService.requestChangeSystemWallpaper();
	}

	resetSettings() {}

	resetPinnedApps() {}

	applyChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const settingsKey = target.name as keyof Partial<ISettings>;

		this._persistenceService.updateSettings({ [settingsKey]: target.checked });

		if (!this.settings().enableWeatherWidget && !this.settings().enableMediaWidget) {
			this._persistenceService.updateSettings({ pageSize: 28 });
		} else {
			this._persistenceService.updateSettings({ pageSize: 20 });
		}
	}
}
