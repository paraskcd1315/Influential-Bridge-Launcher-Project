import { Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeMock } from '@bridgelauncher/api-mock';
import { environment } from '../../../environments/environment';
import { IMonetColors } from '../bridge/monet.types';
import { HEXTORGB } from '../colors/colors.utils';
import { INFLUENTIAL_API_KEYS_KEY, INFLUENTIAL_COLOR_SETTINGS_KEY, INFLUENTIAL_SETTINGS_KEY, PINNED_APPS_KEY, PINNED_DOCK_APPS_KEY } from '../constants';
import { IApiKeys, ISettings, ISettingsColors, NullableBridgeApp } from './persistence.types';

@Injectable({
	providedIn: 'root',
})
export class PersistenceService {
	pinnedAppsStore = signal<NullableBridgeApp[]>([]);
	pinnedDockAppsStore = signal<BridgeInstalledAppInfo[]>([]);
	settingsStore = signal<Partial<ISettings>>({});
	colorSettingsStore = signal<Partial<ISettingsColors>>({});
	apiKeysStore = signal<Partial<IApiKeys>>({});
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

	updateApiKeys(apiKeys: Partial<IApiKeys>) {
		this.apiKeysStore.update((currentApiKeys) => {
			return { ...currentApiKeys, ...apiKeys };
		});
		this._saveSettings();
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

	resetSettings() {
		this.settingsStore.set(this._applyDefaultSettings({}));
		this._saveSettings();
	}

	resetColors() {
		const monetColors = this._getMonetColors();
		this.colorSettingsStore.set(this._applyDefaultColorSettings({}, monetColors));
		this._saveSettings();
		this._applyColors();
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

	private _applyColors() {
		const monetColors = this._getMonetColors();
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
		const apiKeys = localStorage.getItem(INFLUENTIAL_API_KEYS_KEY);

		this._initSettingsStore(settings);
		this._initializeColorSettings(colorSettings);
		this._loadApiKeys(apiKeys);

		if (!this.apiKeysStore().weatherApiKey) {
			this.updateSettings({ enableWeatherWidget: false });
		}
	}

	private _initSettingsStore(settings: string | null) {
		try {
			const parsedSettings = settings ? JSON.parse(settings) : {};
			const finalSettings = this._applyDefaultSettings(parsedSettings);
			this.settingsStore.set(finalSettings);
		} catch (error) {
			console.error('Failed to parse settings from localStorage:', error);
			// fallback a valores por defecto
			this.settingsStore.set(this._applyDefaultSettings({}));
		}
	}

	private _applyDefaultSettings(settings: Partial<ISettings>): ISettings {
		return {
			showHideUnthemedIcons: settings.showHideUnthemedIcons ?? true,
			showHideHomescreenDate: settings.showHideHomescreenDate ?? true,
			showHideStatusbar: settings.showHideStatusbar ?? true,
			showHideNotificationBadges: settings.showHideNotificationBadges ?? true,
			showHideHomescreenIconLabels: settings.showHideHomescreenIconLabels ?? true,
			showHideStartMenuCalendar: settings.showHideStartMenuCalendar ?? true,
			showHideStartMenuApps: settings.showHideStartMenuApps ?? true,
			showHideStartMenuContacts: settings.showHideStartMenuContacts ?? true,
			enableSpotlight: settings.enableSpotlight ?? true,
			enableWeatherWidget: settings.enableWeatherWidget ?? false,
			enableMediaWidget: settings.enableMediaWidget ?? true,
			pageSize: settings.pageSize ?? 20,
		};
	}

	private _initializeColorSettings(colorSettings: string | null) {
		const monetColors = this._getMonetColors();

		try {
			const parsed = colorSettings ? (JSON.parse(colorSettings) as Partial<ISettingsColors>) : {};
			const finalSettings = this._applyDefaultColorSettings(parsed, monetColors);
			this.colorSettingsStore.set(finalSettings);
		} catch (error) {
			console.error('Failed to parse color settings from localStorage:', error);
			this.colorSettingsStore.set(this._applyDefaultColorSettings({}, monetColors));
		}
	}

	private _applyDefaultColorSettings(settings: Partial<ISettingsColors>, defaults: IMonetColors): ISettingsColors {
		return {
			accent: settings.accent?.trim() ?? defaults.accent.trim(),
			background: settings.background?.trim() ?? defaults.background.trim(),
			textPrimary: settings.textPrimary?.trim() ?? defaults.textPrimary.trim(),
		};
	}

	private _loadApiKeys(apiKeys: string | null) {
		if (!apiKeys) {
			return;
		}

		try {
			const parsed = JSON.parse(apiKeys) as IApiKeys;
			this.apiKeysStore.set(parsed);
		} catch (error) {
			console.error('Failed to parse API keys from localStorage:', error);
			this.apiKeysStore.set({});
		}
	}

	private _saveSettings() {
		const settings = this.settingsStore();
		const colorSettings = this.colorSettingsStore();
		const apiKeys = this.apiKeysStore();
		localStorage.setItem(INFLUENTIAL_SETTINGS_KEY, JSON.stringify(settings));
		localStorage.setItem(INFLUENTIAL_COLOR_SETTINGS_KEY, JSON.stringify(colorSettings));
		localStorage.setItem(INFLUENTIAL_API_KEYS_KEY, JSON.stringify(apiKeys));
	}

	private _saveApps() {
		const apps = this.pinnedAppsStore();
		const serializable = apps.map((app) => app ?? null);
		localStorage.setItem(PINNED_APPS_KEY, JSON.stringify(serializable));
		localStorage.setItem(PINNED_DOCK_APPS_KEY, JSON.stringify(this.pinnedDockAppsStore()));
	}

	private _getMonetColors(): IMonetColors {
		return JSON.parse(this.bridge().getMonetPaletteJson());
	}

	private _injectBridgeMockInDev() {
		if (!environment.production && !window.Bridge) {
			window.Bridge = new BridgeMock();
		}

		this.bridge.set(window.Bridge);
	}
}
