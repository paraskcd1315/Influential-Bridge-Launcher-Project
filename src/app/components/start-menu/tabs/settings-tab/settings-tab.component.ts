import { Component, inject, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BridgeService } from '../../../../utils/bridge/bridge.service';
import { PersistenceService } from '../../../../utils/persistence/persistence.service';
import { ISettings, ISettingsColors } from '../../../../utils/persistence/persistence.types';
import { DialogAction } from '../../dialog/dialog.types';

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
	apiKeys = this._persistenceService.apiKeysStore;

	invokeDialog = output<DialogAction>();

	openBridgeSettings() {
		this._bridgeService.requestOpenBridgeSettings();
	}

	openWallpaperPicker() {
		this._bridgeService.requestChangeSystemWallpaper();
	}

	resetSettings() {
		this.invokeDialog.emit(DialogAction.ResetSettings);
	}

	resetPinnedApps() {
		this.invokeDialog.emit(DialogAction.ResetPinnedApps);
	}

	resetColors() {
		this.invokeDialog.emit(DialogAction.ResetColors);
	}

	addSpotlightCurrencyApiKey() {
		this.invokeDialog.emit(DialogAction.AddCurrencyApiKey);
	}

	applyChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const settingsKey = target.name as keyof Partial<ISettings>;

		if (settingsKey === 'enableWeatherWidget' && !this.apiKeys().weatherApiKey) {
			this.invokeDialog.emit(DialogAction.AddWeatherApiKey);
			target.checked = false; // Reset the checkbox if no API key is set
			return;
		}

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
