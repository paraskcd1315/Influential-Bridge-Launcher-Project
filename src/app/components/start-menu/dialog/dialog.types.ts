export enum DialogType {
	Prompt = 'prompt',
	Confirmation = 'confirmation',
}

export enum DialogAction {
	ResetSettings = 'resetSettings',
	ResetPinnedApps = 'resetPinnedApps',
	ResetColors = 'resetColors',
	AddWeatherApiKey = 'addWeatherApiKey',
	AddCurrencyApiKey = 'addCurrencyApiKey',
}

export interface IDialogConfig {
	title: string;
	message?: string;
	confirmButtonText?: string;
	cancelButtonText?: string;
	textFieldPlaceholder?: string;
}
