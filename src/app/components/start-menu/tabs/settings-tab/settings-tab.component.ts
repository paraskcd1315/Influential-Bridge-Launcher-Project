import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BridgeService } from '../../../../utils/bridge/bridge.service';
import { PersistenceService } from '../../../../utils/persistence/persistence.service';
import { ISettings, ISettingsColors } from '../../../../utils/persistence/persistence.types';

@Component({
	selector: 'start-menu-settings-tab',
	imports: [MatIconModule],
	templateUrl: './settings-tab.component.html',
	styleUrl: './settings-tab.component.scss',
})
export class SettingsTabComponent {
	private readonly _bridgeService = inject(BridgeService);
	private readonly _persistenceService = inject(PersistenceService);

	settings = this._persistenceService.settingsStore;
	colorSettings = this._persistenceService.colorSettingsStore;

	openBridgeSettings() {
		this._bridgeService.requestOpenBridgeSettings();
	}

	openWallpaperPicker() {
		this._bridgeService.requestChangeSystemWallpaper();
	}

	resetSettings() {
		this._persistenceService.resetSettings();
	}

	resetPinnedApps() {
		this._persistenceService.clearApps();
	}

	resetColors() {
		this._persistenceService.resetColors();
	}

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

	colorChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const colorKey = target.name as keyof ISettingsColors;

		this._persistenceService.updateColorSettings({ [colorKey]: target.value });
	}
}
