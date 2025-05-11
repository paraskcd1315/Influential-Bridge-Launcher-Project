import { Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';

@Injectable({
	providedIn: 'root',
})
export class PersistenceService {
	pinnedAppsStore = signal<BridgeInstalledAppInfo[]>([]);
	pinnedDockAppsStore = signal<BridgeInstalledAppInfo[]>([]);

	constructor() {
		this.loadApps();
	}

	loadApps() {
		const pinnedApps = localStorage.getItem('pinnedApps');
		const pinnedDockApps = localStorage.getItem('pinnedDockApps');

		if (pinnedApps) {
			this.pinnedAppsStore.set(JSON.parse(pinnedApps));
		}

		if (pinnedDockApps) {
			this.pinnedDockAppsStore.set(JSON.parse(pinnedDockApps));
		}
	}

	saveApps() {
		localStorage.setItem('pinnedApps', JSON.stringify(this.pinnedAppsStore()));
		localStorage.setItem('pinnedDockApps', JSON.stringify(this.pinnedDockAppsStore()));
	}

	clearApps() {
		localStorage.removeItem('pinnedApps');
		localStorage.removeItem('pinnedDockApps');
	}

	addPinnedApp(app: BridgeInstalledAppInfo) {
		this.pinnedAppsStore.update((state) => [...state, app]);
		this.saveApps();
	}

	addPinnedDockApp(app: BridgeInstalledAppInfo) {
		this.pinnedDockAppsStore.update((state) => [...state, app]);
		this.saveApps();
	}

	removePinnedApp(app: BridgeInstalledAppInfo) {
		this.pinnedAppsStore.update((state) => state.filter((a) => a.packageName !== app.packageName));
		this.saveApps();
	}

	removePinnedDockApp(app: BridgeInstalledAppInfo) {
		this.pinnedDockAppsStore.update((state) => state.filter((a) => a.packageName !== app.packageName));
		this.saveApps();
	}
}
