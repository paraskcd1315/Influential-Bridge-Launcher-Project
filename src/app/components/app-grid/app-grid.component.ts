import { Component, computed, inject } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { IconsService } from '../../utils/icons/icons.service';
import { PersistenceService } from '../../utils/persistence/persistence.service';
import { ContextMenuService } from '../context-menu/context-menu.service';

@Component({
	selector: 'app-app-grid',
	imports: [],
	templateUrl: './app-grid.component.html',
	styleUrl: './app-grid.component.scss',
})
export class AppGridComponent {
	private readonly _contextMenuService = inject(ContextMenuService);
	private readonly _bridgeService = inject(BridgeService);
	private readonly _iconService = inject(IconsService);
	private readonly _persistenceService = inject(PersistenceService);
	apps = this._persistenceService.pinnedAppsStore;
	Object = Object;

	private touchStartX = 0;
	private touchStartY = 0;
	private readonly touchThreshold = 10;

	paginatedApps = computed(() => {
		const allApps = this.apps();
		const pageSize = 20;
		const pages: Record<number, typeof allApps> = {};

		let page = 1;
		for (let i = 0; i < allApps.length; i += pageSize) {
			pages[page] = allApps.slice(i, i + pageSize);
			page++;
		}

		return pages;
	});

	getAppIcon(packageName: string, label: string) {
		// Attempt to match any icon filename containing the iconName
		const matchedIcon = this._iconService.getAppIcon(packageName);
		if (matchedIcon) {
			return `assets/icons/icon-pack/${matchedIcon}`;
		}
		// Fallback to bridge service
		return this._bridgeService.getAppIcon(packageName);
	}

	openApp(packageName: string) {
		if (this._contextMenuService.contextMenuVisible()) {
			this._contextMenuService.closeContextMenu();
			return;
		}
		return this._bridgeService.requestLaunchApp(packageName);
	}

	onContextMenu(event: MouseEvent, app: BridgeInstalledAppInfo) {
		event.preventDefault();
		const { clientX, clientY } = event;
		const maxX = window.innerWidth;
		const maxY = window.innerHeight;

		const contextMenuHeight = 290;
		let safeY = clientY;

		if (clientY + contextMenuHeight > maxY) {
			safeY = maxY - contextMenuHeight - 8;
		}

		const contextMenuWidth = 200;
		let safeX = clientX;

		if (clientX + contextMenuWidth > maxX) {
			safeX = maxX - contextMenuWidth - 8;
		}
		this._contextMenuService.initializeAppContextMenu(app, safeX, safeY);
	}

	onTouchStart(event: TouchEvent) {
		const touch = event.touches[0];
		this.touchStartX = touch.clientX;
		this.touchStartY = touch.clientY;
	}

	shouldTriggerTapTouch(event: TouchEvent): boolean {
		const touch = event.changedTouches[0];
		const dx = Math.abs(touch.clientX - this.touchStartX);
		const dy = Math.abs(touch.clientY - this.touchStartY);
		return dx < this.touchThreshold && dy < this.touchThreshold;
	}
}
