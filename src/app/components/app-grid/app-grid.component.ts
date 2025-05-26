import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { AppGridService } from '../../utils/app-grid/app-grid.service';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { IconsService } from '../../utils/icons/icons.service';
import { PersistenceService } from '../../utils/persistence/persistence.service';
import { StatusbarService } from '../../utils/statusbar/statusbar.service';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { DialogComponent } from './dialog/dialog.component';
import { DialogService } from './dialog/dialog.service';

@Component({
	selector: 'app-app-grid',
	imports: [CommonModule, DialogComponent],
	templateUrl: './app-grid.component.html',
	styleUrl: './app-grid.component.scss',
})
export class AppGridComponent {
	private readonly _dialogService = inject(DialogService);
	private readonly _appGridService = inject(AppGridService);
	private readonly _statusbarService = inject(StatusbarService);
	private readonly _contextMenuService = inject(ContextMenuService);
	private readonly _bridgeService = inject(BridgeService);
	private readonly _iconService = inject(IconsService);
	private readonly _persistenceService = inject(PersistenceService);

	draggedApp = signal<BridgeInstalledAppInfo | null>(null);
	draggedIndex = signal<number | null>(null);
	dragOverApp = signal<BridgeInstalledAppInfo | null>(null);
	currentPointer = signal<{ x: number; y: number } | null>(null);

	scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

	apps = this._persistenceService.pinnedAppsStore as any;

	Object = Object;

	private touchStartX = 0;
	private touchStartY = 0;
	private readonly touchThreshold = 10;
	private pendingDragApp: BridgeInstalledAppInfo | null = null;
	private pendingDragIndex: number | null = null;

	dropTargetIndex: number | null = null;

	notifications = this._statusbarService.notificationCounts;

	editMode = this._appGridService.isEditMode;

	private _tempExtendedPageAdded = false;

	// Map to store global app index to app instance for drag logic
	private readonly appIndexMap: Map<number, BridgeInstalledAppInfo> = new Map();

	paginatedApps = computed(() => {
		const allApps = this.apps();
		const pageSize = 20;
		const pages: Record<number, (BridgeInstalledAppInfo | null)[]> = {};
		this.appIndexMap.clear();

		let page = 1;
		for (let i = 0; i < allApps.length; i += pageSize) {
			const chunk = allApps.slice(i, i + pageSize);
			const pageData = [...chunk];
			while (pageData.length < pageSize) {
				pageData.push(null);
			}
			// Only add the page if at least one entry is not null
			if (pageData.some((app) => app !== null) || (this._tempExtendedPageAdded && i + pageSize >= allApps.length - 20)) {
				pages[page] = pageData;
				for (let j = 0; j < pageData.length; j++) {
					this.appIndexMap.set(i + j, pageData[j] ?? null);
				}
			}
			page++;
		}

		return pages;
	});

	getAppIcon(packageName?: string) {
		if (!packageName) {
			return '';
		}
		// Attempt to match any icon filename containing the iconName
		const matchedIcon = this._iconService.getAppIcon(packageName);
		if (matchedIcon) {
			return `assets/icons/icon-pack/${matchedIcon}`;
		}
		// Fallback to bridge service
		return this._bridgeService.getAppIcon(packageName);
	}

	openApp(event: MouseEvent, app: BridgeInstalledAppInfo) {
		if (this._contextMenuService.contextMenuVisible()) {
			this._contextMenuService.closeContextMenu();
			return;
		}
		if (this._appGridService.isEditMode()) {
			return;
		}
		return this._bridgeService.requestLaunchApp(app.packageName);
	}

	openDeleteDialog(event: MouseEvent | TouchEvent, app: BridgeInstalledAppInfo) {
		event.stopPropagation();
		this._dialogService.initializeDialog(app);
	}

	onContextMenu(event: MouseEvent, app: BridgeInstalledAppInfo) {
		event.preventDefault();
		if (this.editMode()) {
			return; // don't open context menu again
		}
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
		this._contextMenuService.initializeAppContextMenu(app, safeX, safeY, true);
	}

	shouldTriggerTapTouch(event: TouchEvent): boolean {
		const touch = event.changedTouches[0];
		const dx = Math.abs(touch.clientX - this.touchStartX);
		const dy = Math.abs(touch.clientY - this.touchStartY);
		return dx < this.touchThreshold && dy < this.touchThreshold;
	}

	onTouchStart(event: TouchEvent, app: BridgeInstalledAppInfo, index: number) {
		this.touchStartX = event.touches[0].clientX;
		this.touchStartY = event.touches[0].clientY;
		this.pendingDragApp = app;
		this.pendingDragIndex = index;

		document.addEventListener('touchmove', this.onTouchMove);
		document.addEventListener('touchend', this.onTouchEnd);

		if (!this.editMode()) return;

		event.preventDefault();

		this.currentPointer.set({ x: this.touchStartX, y: this.touchStartY });
		document.body.classList.add('dragging');

		this.onTouchMove(event); // trigger position update
	}

	onTouchMove = (event: TouchEvent) => {
		if (!this.editMode()) return;
		const touch = event.touches[0];
		const dx = Math.abs(touch.clientX - this.touchStartX);
		const dy = Math.abs(touch.clientY - this.touchStartY);

		if (!this.draggedApp() && (dx > 5 || dy > 5) && this.pendingDragApp && this.pendingDragIndex !== null) {
			this.draggedApp.set(this.pendingDragApp);
			this.draggedIndex.set(this.pendingDragIndex);
			document.body.classList.add('dragging');
		}
		this.currentPointer.set({ x: touch.clientX, y: touch.clientY });

		const elements = Array.from(document.querySelectorAll('[data-app-index]')) as HTMLElement[];
		this._autoScrollIfNearEdge(touch.clientX);
		for (const el of elements) {
			const rect = el.getBoundingClientRect();
			if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
				const targetIndex = Number(el.dataset['appIndex']);
				this.dragOverApp.set(this.appIndexMap.get(targetIndex) ?? null);
				this.dropTargetIndex = targetIndex;
				return;
			}
		}

		this.dragOverApp.set(null);
		this.dropTargetIndex = null;
	};

	onTouchEnd = (event: TouchEvent) => {
		const apps = [...(this._persistenceService.pinnedAppsStore() as (BridgeInstalledAppInfo | null)[])];
		const dragged = this.draggedApp();

		const fromIndex = dragged ? apps.findIndex((a) => a?.packageName === dragged.packageName) : -1;
		const toIndex = this.dropTargetIndex ?? -1;

		if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
			while (apps.length <= Math.max(fromIndex, toIndex)) {
				apps.push(null);
			}

			// Swap dragged app with the target app (can be another app or null)
			const temp = apps[toIndex];
			apps[toIndex] = dragged;
			apps[fromIndex] = temp;

			this._persistenceService.updateIndex(apps);
		}

		this.draggedApp.set(null);
		this.draggedIndex.set(null);
		this.currentPointer.set(null);
		this.dragOverApp.set(null);
		this.dropTargetIndex = null;
		document.body.classList.remove('dragging');

		if (this._tempExtendedPageAdded) {
			const apps = [...this._persistenceService.pinnedAppsStore()];
			const hasNonNullInLastPage = apps.slice(-20).some((app) => app !== null);
			if (!hasNonNullInLastPage) {
				this._persistenceService.updateIndex(apps.slice(0, -20));
			}
			this._tempExtendedPageAdded = false;
		}

		document.removeEventListener('touchmove', this.onTouchMove);
		document.removeEventListener('touchend', this.onTouchEnd);
	};

	getDragStyle() {
		const pointer = this.currentPointer();
		if (!pointer) return {};
		return {
			position: 'fixed',
			left: pointer.x + 'px',
			top: pointer.y + 'px',
			transform: 'translate(-50%, -50%)',
			pointerEvents: 'none',
			transition: 'none',
		};
	}

	private lastAutoScroll = 0;
	private readonly edgeThreshold = 50;
	private readonly autoScrollCooldown = 200;

	private _autoScrollIfNearEdge(x: number) {
		if (!this.editMode()) return;

		const now = Date.now();
		if (now - this.lastAutoScroll < this.autoScrollCooldown) return;

		const container = this.scrollContainer()?.nativeElement;
		if (!container) return;
		const bounds = container.getBoundingClientRect();
		const scrollAmount = container.offsetWidth;

		if (x - bounds.left < this.edgeThreshold) {
			container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
			this.lastAutoScroll = now;
			this._refreshDragOverAppAfterDelay(x, this.currentPointer()?.y ?? 0);
		} else if (bounds.right - x < this.edgeThreshold) {
			container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
			this.lastAutoScroll = now;

			const apps = [...this._persistenceService.pinnedAppsStore()];
			const totalSlots = apps.length;
			const lastPageSlots = totalSlots % 20;

			if (!this._tempExtendedPageAdded) {
				// Add a new page of empty slots
				for (let i = 0; i < 20; i++) apps.push(null);
				this._persistenceService.updateIndex(apps);
				this._tempExtendedPageAdded = true;
			}

			this._refreshDragOverAppAfterDelay(x, this.currentPointer()?.y ?? 0);
		}
	}

	private _refreshDragOverAppAfterDelay(x: number, y: number) {
		setTimeout(() => {
			const elements = Array.from(document.querySelectorAll('[data-app-index]')) as HTMLElement[];
			for (const el of elements) {
				const rect = el.getBoundingClientRect();
				if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
					const targetIndex = Number(el.dataset['appIndex']);
					this.dragOverApp.set(this.appIndexMap.get(targetIndex) ?? null);
					this.dropTargetIndex = targetIndex;
					return;
				}
			}
			this.dragOverApp.set(null);
			this.dropTargetIndex = null;
		}, 300);
	}
}
