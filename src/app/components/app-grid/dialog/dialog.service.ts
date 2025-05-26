import { inject, Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeService } from '../../../utils/bridge/bridge.service';
import { PersistenceService } from '../../../utils/persistence/persistence.service';

@Injectable({
	providedIn: 'root',
})
export class DialogService {
	private readonly _bridgeService = inject(BridgeService);
	private readonly _persistenceService = inject(PersistenceService);
	isVisible = signal<boolean>(false);
	selectedApp = signal<BridgeInstalledAppInfo | null>(null);

	initializeDialog(app: BridgeInstalledAppInfo) {
		this.isVisible.set(true);
		this.selectedApp.set(app);
	}

	uninstallApp() {
		if (this.selectedApp()) {
			this._bridgeService.requestUninstallApp(this.selectedApp()!.packageName);
			this.dismissDialog();
		}
	}

	removeAppFromFavourites() {
		if (this.selectedApp()) {
			this._persistenceService.removePinnedApp(this.selectedApp()!);
			this.dismissDialog();
		}
	}

	dismissDialog() {
		this.isVisible.set(false);
		this.selectedApp.set(null);
	}
}
