import { inject, Injectable, signal } from '@angular/core';
import { PersistenceService } from '../../../utils/persistence/persistence.service';
import { DialogType } from './dialog.types';

@Injectable({
	providedIn: 'root',
})
export class StartMenuDialogService {
	private readonly persistenceService = inject(PersistenceService);

	isVisible = signal<boolean>(false);
	dialogType = signal<DialogType | null>(null);
	textField = signal<string | undefined>(undefined);

	initializeDialog(type: DialogType) {
		this.isVisible.set(true);
		this.dialogType.set(type);
	}

	dismissDialog() {
		this.isVisible.set(false);
		this.dialogType.set(null);
	}

	resetSettings() {
		this.persistenceService.resetSettings();
	}

	resetPinnedApps() {
		this.persistenceService.clearApps();
	}

	resetColors() {
		this.persistenceService.resetColors();
	}

	addWeatherApiKey() {
		if (this._isStringNullOrEmpty(this.textField())) return;

		this.persistenceService.updateApiKeys({ weatherApiKey: this.textField() });
		this.persistenceService.updateSettings({ enableWeatherWidget: true });
	}

	addCurrencyApiKey() {
		if (this._isStringNullOrEmpty(this.textField())) return;

		this.persistenceService.updateApiKeys({ currencyApiKey: this.textField() });
	}

	private _isStringNullOrEmpty(value: string | undefined): boolean {
		return value === undefined || value.trim() === '';
	}
}
