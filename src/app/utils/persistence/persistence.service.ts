import { Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { INFLUENTIAL_SETTINGS_KEY, PINNED_APPS_KEY, PINNED_DOCK_APPS_KEY } from '../constants';
import { ISettings, NullableBridgeApp } from './persistence.types';

@Injectable({
	providedIn: 'root',
})
export class PersistenceService {
	pinnedAppsStore = signal<NullableBridgeApp[]>([]);
	pinnedDockAppsStore = signal<BridgeInstalledAppInfo[]>([]);
	settingsStore = signal<Partial<ISettings>>({});

	constructor() {
		this._loadApps();
		this._loadSettings();
	}

	clearApps() {
		localStorage.removeItem(PINNED_APPS_KEY);
		localStorage.removeItem(PINNED_DOCK_APPS_KEY);
	}

	updateSettings(settings: Partial<ISettings>) {
		this.settingsStore.update((currentSettings) => {
			return { ...currentSettings, ...settings };
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

	private _loadSettings() {
		const settings = localStorage.getItem(INFLUENTIAL_SETTINGS_KEY);
		if (settings) {
			try {
				const parsedSettings = JSON.parse(settings);
				if (parsedSettings) {
					this.settingsStore.set(parsedSettings as ISettings);
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
				enableSpotlight: true,
				enableWeatherWidget: true,
				enableMediaWidget: true,
				pageSize: 20,
			});
		}
	}

	private _saveSettings() {
		const settings = this.settingsStore();
		localStorage.setItem(INFLUENTIAL_SETTINGS_KEY, JSON.stringify(settings));
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
}
