import { CommonModule } from '@angular/common';
import { Component, effect, HostListener, inject, input, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { IconsService } from '../../utils/icons/icons.service';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { StartMenuService } from './start-menu.service';

@Component({
	selector: 'app-start-menu',
	imports: [CommonModule, MatIconModule],
	standalone: true,
	templateUrl: './start-menu.component.html',
	styleUrl: './start-menu.component.scss',
})
export class StartMenuComponent {
	private readonly _iconService = inject(IconsService);
	private readonly _startMenuService = inject(StartMenuService);
	private readonly _contextMenuService = inject(ContextMenuService);
	active = input();
	apps = this._startMenuService.apps;
	distributedApps = this._startMenuService.filteredApps;
	activeLetter = signal<string | undefined>(undefined);
	searchQuery = signal<string | undefined>(undefined);
	searchInput = viewChild<any>('search');
	letterSidebar = viewChild<any>('letterSidebar');
	isDragging = false;
	forceRerender = signal(true);

	private debounceTimeout: any;
	private dragDebounceTimeout: any;
	private lastDraggedLetter?: string;

	Object = Object;

	constructor() {
		effect(() => {
			clearTimeout(this.debounceTimeout);
			const currentValue = this.searchQuery();
			this.debounceTimeout = setTimeout(() => {
				this._startMenuService.filter.set(currentValue);
				this.forceRerender.set(false);
				setTimeout(() => {
					this.forceRerender.set(true);
					if (currentValue && this.distributedApps()) {
						this.searchInput()?.nativeElement?.blur();
					}
				}, 0);
			}, 300);
		});
	}

	getAppIcon(packageName: string, label: string) {
		// Attempt to match any icon filename containing the iconName
		const matchedIcon = this._iconService.getAppIcon(packageName);
		if (matchedIcon) {
			return `assets/icons/icon-pack/${matchedIcon}`;
		}
		return this._startMenuService.getAppIcon(packageName);
	}

	openApp(packageName: string) {
		if (this._contextMenuService.contextMenuVisible()) {
			this._contextMenuService.closeContextMenu();
			return;
		}
		return this._startMenuService.openApp(packageName);
	}

	scrollToLetter(letter: string) {
		const element = document.getElementById(letter);
		const scrollContainer = document.querySelector('.scroll-anchor-container');
		if (element && scrollContainer) {
			const offsetTop = element.offsetTop;
			(scrollContainer as HTMLElement).scrollTo({
				top: offsetTop,
				behavior: 'smooth',
			});
		}
	}

	startDrag(event: MouseEvent | TouchEvent) {
		if (this._contextMenuService.contextMenuVisible()) {
			this._contextMenuService.closeContextMenu();
		}
		this.isDragging = true;
		this.onDrag(event); // scroll inmediato al iniciar
	}

	onDrag(event: MouseEvent | TouchEvent) {
		if (!this.isDragging || !this.letterSidebar()) return;
		if (this.dragDebounceTimeout) return;

		this.dragDebounceTimeout = setTimeout(() => {
			this.dragDebounceTimeout = null;
		}, 80);

		const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
		const rect = this.letterSidebar()?.nativeElement.getBoundingClientRect();
		const offsetY = clientY - rect.top;

		const children = Array.from(this.letterSidebar()?.nativeElement.children) as HTMLElement[];
		const childHeight = rect.height / children.length;
		const index = Math.floor(offsetY / childHeight);
		const letterElement = children[index];
		const letter = letterElement?.getAttribute('data-letter');

		if (letter && letter !== this.lastDraggedLetter) {
			this.lastDraggedLetter = letter;
			this.activeLetter.set(letter);
			this.scrollToLetter(letter);
		}
	}

	endDrag() {
		this.activeLetter.set(undefined);
		this.isDragging = false;
		this.lastDraggedLetter = undefined;
	}

	clearSearch() {
		this.searchQuery.set(undefined);
		const inputEl = this.searchInput().nativeElement;
		inputEl.value = '';
		inputEl.blur();
		inputEl.classList.add('clearing');

		setTimeout(() => {
			inputEl.classList.remove('clearing');
		}, 300);
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

	@HostListener('document:click', ['$event'])
	onClick(event: MouseEvent) {
		this._contextMenuService.closeContextMenu();
	}
}
