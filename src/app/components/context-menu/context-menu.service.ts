import { computed, inject, Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { PersistenceService } from '../../utils/persistence/persistence.service';
import { IContextMenuItem, IContextMenuPosition } from './context-menu.types';

@Injectable({
	providedIn: 'root',
})
export class ContextMenuService {
	private readonly _bridgeService = inject(BridgeService);
	private readonly _persistenceService = inject(PersistenceService);

	contextMenuPosition = signal<IContextMenuPosition>({ x: 0, y: 0 });
	contextMenuVisible = signal<boolean>(false);
	selectedApp = signal<BridgeInstalledAppInfo | null>(null);

	contextMenuItems = computed(() => {
		const alreadyExistsTaskbar = this._persistenceService.checkIfDockAppIsPinned(this.selectedApp()?.packageName);
		const alreadyExistsFavourites = this._persistenceService.checkIfAppIsPinned(this.selectedApp()?.packageName);
		return [
			{
				menuText: alreadyExistsTaskbar ? 'Unpin from Taskbar' : 'Pin to Taskbar',
				menuEvent: alreadyExistsTaskbar ? 'unpinFromTaskbar' : 'pinToTaskbar',
			},
			{
				menuText: alreadyExistsFavourites ? 'Unpin from Favourites' : 'Pin to Favourites',
				menuEvent: alreadyExistsFavourites ? 'unpinFromFavourites' : 'pinToFavourites',
			},
			{
				menuText: 'Uninstall',
				menuEvent: 'uninstall',
			},
			{
				menuText: 'Properties',
				menuEvent: 'properties',
			},
		];
	});

	initializeAppContextMenu(app: BridgeInstalledAppInfo, x: number, y: number) {
		this.contextMenuPosition.set({ x: x, y: y });
		this.contextMenuVisible.set(true);
		this.selectedApp.set(app);
	}

	toggleContextMenu() {
		this.contextMenuVisible.update((state) => !state);
	}

	closeContextMenu() {
		this.contextMenuVisible.set(false);
		this.selectedApp.set(null);
	}

	openApp() {
		if (this.selectedApp()) {
			this._bridgeService.requestLaunchApp(this.selectedApp()!.packageName);
		}
	}

	getAppIcon() {
		if (this.selectedApp()) {
			return this._bridgeService.getAppIcon(this.selectedApp()!.packageName);
		}
	}

	onSelectContextMenuItem(item: IContextMenuItem) {
		if (!this.selectedApp()) {
			return;
		}

		switch (item.menuEvent) {
			case 'unpinFromTaskbar':
				this._persistenceService.removePinnedDockApp(this.selectedApp()!);
				break;
			case 'unpinFromFavourites':
				this._persistenceService.removePinnedApp(this.selectedApp()!);
				break;
			case 'pinToTaskbar':
				this._persistenceService.addPinnedDockApp(this.selectedApp()!);
				break;
			case 'pinToFavourites':
				this._persistenceService.addPinnedApp(this.selectedApp()!);
				break;
			case 'uninstall':
				this._bridgeService.requestUninstallApp(this.selectedApp()!.packageName);
				break;
			case 'properties':
				this._bridgeService.requestShowAppProperties(this.selectedApp()!.packageName);
				break;
		}
	}
}
