import { AfterViewInit, Component, effect, ElementRef, HostListener, inject, QueryList, signal, viewChild, ViewChildren } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { IconsService } from '../../../../utils/icons/icons.service';
import { ContextMenuService } from '../../../context-menu/context-menu.service';
import { StartMenuService } from '../../start-menu.service';

@Component({
	selector: 'start-menu-apps-tab',
	imports: [MatIconModule],
	templateUrl: './apps-tab.component.html',
	styleUrl: './apps-tab.component.scss',
})
export class AppsTabComponent implements AfterViewInit {
	Object = Object;
	searchQuery = signal<string | undefined>(undefined);
	letterSidebar = viewChild<ElementRef<HTMLElement>>('letterSidebar');
	searchInput = viewChild<ElementRef<HTMLInputElement>>('search');
	appHeader = viewChild<ElementRef<HTMLDivElement>>('appHeader');

	@ViewChildren('appButton') appButtons!: QueryList<ElementRef<HTMLElement>>;
	@ViewChildren('letterHeader') letterHeaders!: QueryList<ElementRef<HTMLElement>>;
	blurredLetters: Record<string, boolean> = {};
	blurredApps: Record<string, boolean> = {};

	private readonly _iconService = inject(IconsService);
	private readonly _contextMenuService = inject(ContextMenuService);
	private readonly _startMenuService = inject(StartMenuService);

	private debounceTimeout: any;
	private isDragging = false;
	private dragDebounceTimeout: any;
	private lastDraggedLetter?: string;
	private lastScrollContainer: HTMLElement | null = null;
	private lastUpdateBlur: (() => void) | null = null;

	distributedApps = this._startMenuService.filteredApps;
	activeLetter = this._startMenuService.activeLetter;

	constructor() {
		effect(() => {
			clearTimeout(this.debounceTimeout);
			const currentValue = this.searchQuery();
			this.debounceTimeout = setTimeout(() => {
				this._startMenuService.filter.set(currentValue);
				setTimeout(() => {
					if (currentValue && this.distributedApps()) {
						this.searchInput()?.nativeElement?.blur();
					}
				}, 0);
			}, 500);
		});
	}

	ngAfterViewInit(): void {
		this._setupAppsBlurListeners();
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
		const header = this.appHeader()?.nativeElement;
		if (element && scrollContainer) {
			const offsetTop = element.offsetTop;
			const headerHeight = header ? header.offsetHeight : 0;
			(scrollContainer as HTMLElement).scrollTo({
				top: offsetTop - headerHeight - 4, // el -4 es para dejar un margen, ajusta si quieres más gap visual
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
		const rect = (this.letterSidebar()?.nativeElement as HTMLElement).getBoundingClientRect();
		const offsetY = clientY - rect.top;

		const children = Array.from((this.letterSidebar()?.nativeElement as HTMLElement).children) as HTMLElement[];
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
		const inputEl = this.searchInput()?.nativeElement as HTMLInputElement;
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

	private _setupAppsBlurListeners() {
		const header = this.appHeader()?.nativeElement as HTMLElement;

		const recursiveFlag = !header || !this.appButtons || this.appButtons.length === 0;

		if (!recursiveFlag) {
			// Limpia listener anterior si lo pones varias veces (ver solución de memory leak)
			if (this.lastScrollContainer && this.lastUpdateBlur) {
				this.lastScrollContainer.removeEventListener('scroll', this.lastUpdateBlur);
			}

			const updateAppsBlur = () => {
				const headerRect = header.getBoundingClientRect();
				this.letterHeaders.forEach((headerEl, i) => {
					const headerRectEl = headerEl.nativeElement.getBoundingClientRect();
					const letter = Object.keys(this.distributedApps())[i];
					this.blurredLetters[letter] = headerRectEl.top < headerRect.bottom;
				});
				this.appButtons.forEach((button) => {
					const btnRect = button.nativeElement.getBoundingClientRect();
					const pkg = button.nativeElement.id;
					// O busca el packageName por dataset, depende de cómo pasas el dato
					this.blurredApps[pkg] = btnRect.top < headerRect.bottom;
				});
			};

			const scrollContainer = header.closest('.scroll-anchor-container');
			if (scrollContainer) {
				scrollContainer.addEventListener('scroll', updateAppsBlur);
				updateAppsBlur();

				// Guarda referencias para limpiar después
				this.lastScrollContainer = scrollContainer as HTMLElement;
				this.lastUpdateBlur = updateAppsBlur;
			}

			return;
		}

		setTimeout(() => {
			this._setupAppsBlurListeners();
		}, 500);
	}
}
