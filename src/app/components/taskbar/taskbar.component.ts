import { Component, ElementRef, HostListener, inject, output, viewChild } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { PersistenceService } from '../../utils/persistence/persistence.service';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { ClockComponent } from './components/clock/clock.component';
import { StartButtonComponent } from './components/start-button/start-button.component';

@Component({
	selector: 'app-taskbar',
	imports: [StartButtonComponent, ClockComponent],
	standalone: true,
	templateUrl: './taskbar.component.html',
	styleUrl: './taskbar.component.scss',
})
export class TaskbarComponent {
	private readonly _bridgeService = inject(BridgeService);
	private readonly _persistenceService = inject(PersistenceService);
	private readonly _contextMenuService = inject(ContextMenuService);
	pinnedApps = this._persistenceService.pinnedDockAppsStore;
	openStartMenuEventEmitter = output({ alias: 'openStartMenu' });
	taskbarRef = viewChild<ElementRef>('taskbarRef');

	getAppIcon(packageName: string) {
		return this._bridgeService.getAppIcon(packageName);
	}

	openApp(packageName: string) {
		this._bridgeService.requestLaunchApp(packageName);
	}

	onContextMenu(event: MouseEvent, app: BridgeInstalledAppInfo) {
		event.preventDefault();

		const { clientX, clientY } = event;
		const maxX = window.innerWidth;
		const maxY = window.innerHeight;
		const taskbarHeight = this.taskbarRef()?.nativeElement?.offsetHeight ?? 0;

		const contextMenuHeight = 290;
		let safeY = clientY;

		if (clientY + contextMenuHeight > maxY - taskbarHeight) {
			safeY = maxY - taskbarHeight - contextMenuHeight - 8;
		}

		const contextMenuWidth = 200;
		let safeX = clientX;

		if (clientX + contextMenuWidth > maxX) {
			safeX = maxX - contextMenuWidth - 8;
		}

		this._contextMenuService.initializeAppContextMenu(app, safeX, safeY);
	}

	@HostListener('document:click', ['$event'])
	onClick(event: MouseEvent) {
		this._contextMenuService.closeContextMenu();
	}
}
