import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { IContextMenuItem, IContextMenuPosition } from './context-menu.types';

@Component({
	selector: 'app-context-menu',
	imports: [CommonModule],
	templateUrl: './context-menu.component.html',
	styleUrl: './context-menu.component.scss',
})
export class ContextMenuComponent {
	contextMenuItems = input<IContextMenuItem[]>([]);
	contextMenuPosition = input<IContextMenuPosition>({ x: 0, y: 0 });
	contextMenuVisible = input<boolean>(false);
	contextMenuItemSelected = output<IContextMenuItem>();
	selectedApp = input<BridgeInstalledAppInfo | null>(null);

	getContextMenuStyle() {
		return {
			position: 'fixed',
			left: `${this.contextMenuPosition().x}px`,
			top: `${this.contextMenuPosition().y}px`,
		};
	}

	onClickContextMenuItem(item: IContextMenuItem) {
		this.contextMenuItemSelected.emit(item);
	}
}
