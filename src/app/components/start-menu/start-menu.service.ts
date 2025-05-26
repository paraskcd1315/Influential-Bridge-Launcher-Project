import { computed, inject, Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeService } from '../../utils/bridge/bridge.service';

@Injectable({
	providedIn: 'root',
})
export class StartMenuService {
	private readonly _bridgeService = inject(BridgeService);

	startMenuActive = signal<boolean>(false);
	filter = signal<string | undefined>(undefined);
	apps = this._bridgeService.apps;

	alphabeticDistributedApps = computed(() => {
		const grouped: Record<string, BridgeInstalledAppInfo[]> = {};

		for (const app of this.apps()) {
			const firstLetter = app.label[0]?.toLowerCase() ?? '#';
			const key = /^[a-z]$/.test(firstLetter) ? firstLetter : '#';

			if (!grouped[key]) {
				grouped[key] = [];
			}

			grouped[key].push(app);
		}

		return grouped;
	});

	filteredApps = computed(() => {
		const query = this.filter();
		if (!query && this.apps().length > 0) return this.alphabeticDistributedApps();

		const original = this.alphabeticDistributedApps();
		const filtered: Record<string, (typeof original)[string]> = {};

		for (const [letter, apps] of Object.entries(original)) {
			const matchingApps = apps.filter((app) => app.label.toLowerCase().includes(query!.toLowerCase()));
			if (matchingApps.length > 0) {
				filtered[letter] = matchingApps;
			}
		}

		return filtered;
	});

	getAppIcon(packageName: string) {
		return this._bridgeService.getAppIcon(packageName);
	}

	openApp(packageName: string) {
		return this._bridgeService.requestLaunchApp(packageName);
	}
}
