import { Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeMock } from '@bridgelauncher/api-mock';
import { environment } from '../../../environments/environment';
import { IMonetColors } from '../bridge/monet.types';
import { HEXTORGB } from '../colors/colors.utils';
import { INFLUENTIAL_COLOR_SETTINGS_KEY, INFLUENTIAL_SETTINGS_KEY, PINNED_APPS_KEY, PINNED_DOCK_APPS_KEY } from '../constants';
import { ISettings, ISettingsColors, NullableBridgeApp } from './persistence.types';

@Injectable({
	providedIn: 'root',
})
export class PersistenceService {
	pinnedAppsStore = signal<NullableBridgeApp[]>([]);
	pinnedDockAppsStore = signal<BridgeInstalledAppInfo[]>([]);
	settingsStore = signal<Partial<ISettings>>({});
	colorSettingsStore = signal<Partial<ISettingsColors>>({});
	bridge = signal<any>(undefined);

	constructor() {
		this._injectBridgeMockInDev();
		this._loadApps();
		this._loadSettings();
	}

	clearApps() {
		localStorage.removeItem(PINNED_APPS_KEY);
		localStorage.removeItem(PINNED_DOCK_APPS_KEY);
		this.pinnedAppsStore.set([]);
		this.pinnedDockAppsStore.set([]);
	}

	updateSettings(settings: Partial<ISettings>) {
		this.settingsStore.update((currentSettings) => {
			return { ...currentSettings, ...settings };
		});
		this._saveSettings();
	}

	updateColorSettings(settings: Partial<ISettingsColors>) {
		this.colorSettingsStore.update((currentSettings) => {
			return { ...currentSettings, ...settings };
		});
		this._saveSettings();
		this._applyColors();
	}

	addPinnedApp(app: BridgeInstalledAppInfo) {
		this.pinnedAppsStore.update((state) => [...state, app]);
		this._saveApps();
	}

	addPinnedDockApp(app: BridgeInstalledAppInfo) {
		this.pinnedDockAppsStore.update((state) => [...state, app]);
		this._saveApps();
	}

	removePinnedApp(app: BridgeInstalledAppInfo) {
		this.pinnedAppsStore.update((state) => state.map((a) => (a?.packageName === app.packageName ? null : a)));
		this._saveApps();
	}

	removePinnedDockApp(app: BridgeInstalledAppInfo) {
		this.pinnedDockAppsStore.update((state) => state.filter((a) => a?.packageName != app.packageName));
		this._saveApps();
	}

	updateIndex(apps: (BridgeInstalledAppInfo | null)[]) {
		this.pinnedAppsStore.set(apps);
		this._saveApps();
	}

	private _loadApps() {
		const pinnedApps = localStorage.getItem(PINNED_APPS_KEY);
		const pinnedDockApps = localStorage.getItem(PINNED_DOCK_APPS_KEY);

		if (pinnedApps) {
			this.pinnedAppsStore.set(JSON.parse(pinnedApps));
		}

		if (pinnedDockApps) {
			this.pinnedDockAppsStore.set(JSON.parse(pinnedDockApps));
		}
	}

	resetSettings() {
		this.settingsStore.set({
			showHideUnthemedIcons: true,
			showHideHomescreenDate: true,
			showHideStatusbar: true,
			showHideNotificationBadges: true,
			showHideHomescreenIconLabels: true,
			showHideStartMenuCalendar: true,
			showHideStartMenuApps: true,
			showHideStartMenuContacts: true,
			enableSpotlight: true,
			enableWeatherWidget: true,
			enableMediaWidget: true,
			pageSize: 20,
		});

		this._saveSettings();
	}

	resetColors() {
		const monetColors = this.getMonetColors();
		this.colorSettingsStore.set({
			accent: monetColors.accent.trim(),
			background: monetColors.background.trim(),
			textPrimary: monetColors.textPrimary.trim(),
		});
		this._saveSettings();
		this._applyColors();
	}

	private _applyColors() {
		const monetColors = this.getMonetColors();
		Object.keys(this.colorSettingsStore()).forEach((key) => {
			const hex = this.colorSettingsStore()[key as keyof ISettingsColors] ?? monetColors[key as keyof IMonetColors].trim();
			const rgb = HEXTORGB(hex);

			document.documentElement.style.setProperty(`--monet-${key}`, hex);
			document.documentElement.style.setProperty(`--monet-${key}-rgb`, rgb);
		});
	}

	private _loadSettings() {
		const settings = localStorage.getItem(INFLUENTIAL_SETTINGS_KEY);
		const colorSettings = localStorage.getItem(INFLUENTIAL_COLOR_SETTINGS_KEY);

		if (settings) {
			try {
				const parsedSettings = JSON.parse(settings);
				if (parsedSettings) {
					this.settingsStore.set(parsedSettings as ISettings);
				}
				if (!parsedSettings.showHideUnthemedIcons) {
					this.settingsStore.update((current) => ({ showHideUnthemedIcons: true, ...current }));
				}
				if (!parsedSettings.showHideHomescreenDate) {
					this.settingsStore.update((current) => ({ showHideHomescreenDate: true, ...current }));
				}
				if (!parsedSettings.showHideStatusbar) {
					this.settingsStore.update((current) => ({ showHideStatusbar: true, ...current }));
				}
				if (!parsedSettings.showHideNotificationBadges) {
					this.settingsStore.update((current) => ({ showHideNotificationBadges: true, ...current }));
				}
				if (!parsedSettings.showHideHomescreenIconLabels) {
					this.settingsStore.update((current) => ({ showHideHomescreenIconLabels: true, ...current }));
				}
				if (!parsedSettings.enableSpotlight) {
					this.settingsStore.update((current) => ({ enableSpotlight: true, ...current }));
				}
				if (!parsedSettings.enableWeatherWidget) {
					this.settingsStore.update((current) => ({ enableWeatherWidget: true, ...current }));
				}
				if (!parsedSettings.enableMediaWidget) {
					this.settingsStore.update((current) => ({ enableMediaWidget: true, ...current }));
				}
				if (!parsedSettings.showHideStartMenuApps) {
					this.settingsStore.update((current) => ({ showHideStartMenuApps: true, ...current }));
				}
				if (!parsedSettings.showHideStartMenuContacts) {
					this.settingsStore.update((current) => ({ showHideStartMenuContacts: true, ...current }));
				}
				if (!parsedSettings.showHideStartMenuCalendar) {
					this.settingsStore.update((current) => ({ showHideStartMenuCalendar: true, ...current }));
				}
				if (!parsedSettings.pageSize) {
					this.settingsStore.update((current) => ({ pageSize: 20, ...current }));
				}
			} catch (error) {
				console.error('Failed to parse settings from localStorage:', error);
			}
		} else {
			// Initialize with default settings if not found
			this.settingsStore.set({
				showHideUnthemedIcons: true,
				showHideHomescreenDate: true,
				showHideStatusbar: true,
				showHideNotificationBadges: true,
				showHideHomescreenIconLabels: true,
				showHideStartMenuCalendar: true,
				showHideStartMenuApps: true,
				showHideStartMenuContacts: true,
				enableSpotlight: true,
				enableWeatherWidget: true,
				enableMediaWidget: true,
				pageSize: 20,
			});
		}
		const monetColors = this.getMonetColors();
		if (colorSettings) {
			try {
				const parsedColorSettings = JSON.parse(colorSettings) as ISettingsColors;
				if (parsedColorSettings) {
					this.colorSettingsStore.set(parsedColorSettings);
				}
				if (!parsedColorSettings.accent) {
					this.colorSettingsStore.update((current) => ({ accent: monetColors.accent.trim(), ...current }));
				}
				if (!parsedColorSettings.background) {
					this.colorSettingsStore.update((current) => ({ background: monetColors.background.trim(), ...current }));
				}
				if (!parsedColorSettings.textPrimary) {
					this.colorSettingsStore.update((current) => ({ textPrimary: monetColors.textPrimary.trim(), ...current }));
				}
			} catch (error) {
				console.error('Failed to parse color settings from localStorage:', error);
			}
		} else {
			// Initialize with default color settings if not found
			this.colorSettingsStore.set({
				accent: monetColors.accent.trim(),
				background: monetColors.background.trim(),
				textPrimary: monetColors.textPrimary.trim(),
			});
		}
	}

	private _saveSettings() {
		const settings = this.settingsStore();
		const colorSettings = this.colorSettingsStore();
		localStorage.setItem(INFLUENTIAL_SETTINGS_KEY, JSON.stringify(settings));
		localStorage.setItem(INFLUENTIAL_COLOR_SETTINGS_KEY, JSON.stringify(colorSettings));
	}

	private _saveApps() {
		const apps = this.pinnedAppsStore();
		const serializable = apps.map((app) => app ?? null);
		localStorage.setItem(PINNED_APPS_KEY, JSON.stringify(serializable));
		localStorage.setItem(PINNED_DOCK_APPS_KEY, JSON.stringify(this.pinnedDockAppsStore()));
	}

	checkIfAppIsPinned(packageName?: string) {
		if (!packageName) {
			return false;
		}
		return this.pinnedAppsStore().some((app) => app?.packageName === packageName);
	}

	checkIfDockAppIsPinned(packageName?: string) {
		if (!packageName) {
			return false;
		}
		return this.pinnedDockAppsStore().some((app) => app.packageName === packageName);
	}

	getMonetColors(): IMonetColors {
		return JSON.parse(this.bridge().getMonetPaletteJson());
	}

	private _injectBridgeMockInDev() {
		if (!environment.production && !window.Bridge) {
			window.Bridge = new BridgeMock();
		}

		this.bridge.set(window.Bridge);
	}
}
