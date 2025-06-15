import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, HostListener, inject, input, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IconsService } from '../../utils/icons/icons.service';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { StartMenuService } from './start-menu.service';
import { StartMenuTab } from './start-menu.types';
import { AppsTabComponent } from './tabs/apps-tab/apps-tab.component';
import { CalendarTabComponent } from './tabs/calendar-tab/calendar-tab.component';
import { SettingsTabComponent } from './tabs/settings-tab/settings-tab.component';

@Component({
	selector: 'app-start-menu',
	imports: [CommonModule, MatIconModule, CalendarTabComponent, AppsTabComponent, SettingsTabComponent],
	standalone: true,
	templateUrl: './start-menu.component.html',
	styleUrl: './start-menu.component.scss',
})
export class StartMenuComponent {
	Object = Object;
	startMenuTab = StartMenuTab;
	isoDate = new Date().toISOString();

	private readonly _iconService = inject(IconsService);
	private readonly _startMenuService = inject(StartMenuService);
	private readonly _contextMenuService = inject(ContextMenuService);
	active = input<boolean>();
	apps = this._startMenuService.apps;

	scrollAnchorContainer = viewChild<ElementRef<HTMLDivElement>>('scrollAnchorContainer');

	selectedTab = signal<StartMenuTab>(this.startMenuTab.Apps);

	activeLetter = this._startMenuService.activeLetter;

	constructor() {
		effect(() => {
			if (this.active()) {
				setTimeout(() => {
					this.scrollAnchorContainer()?.nativeElement?.scrollTo({ top: 0, behavior: 'instant' });
				}, 0);
			}
		});
	}

	selectTab(tab: StartMenuTab) {
		setTimeout(() => {
			this.selectedTab.set(tab);
		}, 0);
	}

	@HostListener('document:click', ['$event'])
	onClick(event: MouseEvent) {
		this._contextMenuService.closeContextMenu();
	}
}
