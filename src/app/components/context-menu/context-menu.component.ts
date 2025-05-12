import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ContextMenuService } from './context-menu.service';
import { IContextMenuItem } from './context-menu.types';

@Component({
	selector: 'app-context-menu',
	imports: [CommonModule],
	templateUrl: './context-menu.component.html',
	styleUrl: './context-menu.component.scss',
})
export class ContextMenuComponent {
	private readonly _contextMenuService = inject(ContextMenuService);

	contextMenuItems = this._contextMenuService.contextMenuItems;
	contextMenuPosition = this._contextMenuService.contextMenuPosition;
	contextMenuVisible = this._contextMenuService.contextMenuVisible;
	selectedApp = this._contextMenuService.selectedApp;

	getContextMenuStyle() {
		return {
			position: 'fixed',
			left: `${this.contextMenuPosition().x}px`,
			top: `${this.contextMenuPosition().y}px`,
		};
	}

	onClickContextMenuItem(item: IContextMenuItem) {
		this._contextMenuService.onSelectContextMenuItem(item);
	}

	openApp() {
		this._contextMenuService.openApp();
	}

	getAppIcon() {
		return this._contextMenuService.getAppIcon();
	}
}
