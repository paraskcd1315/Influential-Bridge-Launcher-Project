import { Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { PINNED_APPS_KEY, PINNED_DOCK_APPS_KEY } from '../constants';
import { NullableBridgeApp } from './persistence.types';

@Injectable({
	providedIn: 'root',
})
export class PersistenceService {
	pinnedAppsStore = signal<NullableBridgeApp[]>([]);
	pinnedDockAppsStore = signal<BridgeInstalledAppInfo[]>([]);

	constructor() {
		this._loadApps();
	}

	clearApps() {
		localStorage.removeItem(PINNED_APPS_KEY);
		localStorage.removeItem(PINNED_DOCK_APPS_KEY);
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
