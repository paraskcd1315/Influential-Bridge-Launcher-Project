import { BridgeInstalledAppInfo } from '@bridgelauncher/api';

export type NullableBridgeApp = BridgeInstalledAppInfo | null;

export interface ISettings {
	showHideUnthemedIcons: boolean;
	showHideHomescreenDate: boolean;
	showHideStatusbar: boolean;
	showHideNotificationBadges: boolean;
	showHideHomescreenIconLabels: boolean;
	showHideStartMenuCalendar: boolean;
	enableSpotlight: boolean;
	enableWeatherWidget: boolean;
	enableMediaWidget: boolean;
	pageSize: number;
}
