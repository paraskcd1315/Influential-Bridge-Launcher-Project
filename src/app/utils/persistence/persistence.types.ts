import { BridgeInstalledAppInfo } from '@bridgelauncher/api';

export type NullableBridgeApp = BridgeInstalledAppInfo | null;

export interface ISettings {
	showHideUnthemedIcons: boolean;
	showHideHomescreenDate: boolean;
	showHideStatusbar: boolean;
	showHideNotificationBadges: boolean;
	showHideHomescreenIconLabels: boolean;
	showHideStartMenuCalendar: boolean;
	showHideStartMenuContacts: boolean;
	showHideStartMenuApps: boolean;
	enableSpotlight: boolean;
	enableWeatherWidget: boolean;
	enableMediaWidget: boolean;
	pageSize: number;
}

export interface ISettingsColors {
	accent: string;
	background: string;
	textPrimary: string;
}
