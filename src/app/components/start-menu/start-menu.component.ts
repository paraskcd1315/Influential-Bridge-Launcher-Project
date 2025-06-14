import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, effect, ElementRef, HostListener, inject, input, QueryList, signal, viewChild, ViewChildren } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { ICalendar } from '../../utils/bridge/calendar.types';
import { IconsService } from '../../utils/icons/icons.service';
import { ContextMenuService } from '../context-menu/context-menu.service';
import { StartMenuService } from './start-menu.service';
import { StartMenuTab } from './start-menu.types';

@Component({
	selector: 'app-start-menu',
	imports: [CommonModule, MatIconModule, DatePipe],
	standalone: true,
	templateUrl: './start-menu.component.html',
	styleUrl: './start-menu.component.scss',
})
export class StartMenuComponent implements AfterViewInit {
	Object = Object;
	startMenuTab = StartMenuTab;
	isoDate = new Date().toISOString();

	private readonly _iconService = inject(IconsService);
	private readonly _startMenuService = inject(StartMenuService);
	private readonly _contextMenuService = inject(ContextMenuService);
	active = input<boolean>();
	apps = this._startMenuService.apps;
	distributedApps = this._startMenuService.filteredApps;
	activeLetter = signal<string | undefined>(undefined);
	searchQuery = signal<string | undefined>(undefined);
	searchInput = viewChild<any>('search');
	letterSidebar = viewChild<any>('letterSidebar');
	scrollAnchorContainer = viewChild<ElementRef<HTMLDivElement>>('scrollAnchorContainer');
	calendarHeader = viewChild<ElementRef<HTMLDivElement>>('calendarHeader');
	appHeader = viewChild<ElementRef<HTMLDivElement>>('appHeader');
	@ViewChildren('hourBlock') hourBlocks!: QueryList<ElementRef<HTMLElement>>;
	@ViewChildren('allDayBlock') allDayBlocks!: QueryList<ElementRef<HTMLElement>>;
	@ViewChildren('appButton') appButtons!: QueryList<ElementRef<HTMLElement>>;
	@ViewChildren('letterHeader') letterHeaders!: QueryList<ElementRef<HTMLElement>>;
	blurredLetters: Record<string, boolean> = {};
	blurredHours: Record<string, boolean> = {};
	blurredAllDay: boolean[] = [];
	blurredApps: Record<string, boolean> = {};
	blurredHourBorders: Record<string, boolean> = {};
	isDragging = false;
	forceRerender = signal(true);
	selectedTab = signal<StartMenuTab>(this.startMenuTab.Apps);
	allDayCalendarEvents = this._startMenuService.allDayEvents;
	hourlyDistributedEvents = this._startMenuService.hourlyDistributedEvents;
	selectedDate = this._startMenuService.selectedDate;

	private debounceTimeout: any;
	private dragDebounceTimeout: any;
	private lastDraggedLetter?: string;
	private lastScrollContainer: HTMLElement | null = null;
	private lastUpdateBlur: (() => void) | null = null;

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
			}, 500);
		});

		effect(() => {
			if (this.active()) {
				setTimeout(() => {
					this.scrollAnchorContainer()?.nativeElement?.scrollTo({ top: 0, behavior: 'instant' });
				}, 0);
			}
		});
	}

	blurAllDay = signal(false);
	blurHours = signal(false);

	ngAfterViewInit() {
		this.currentDay();
		this.setupAppsBlurListeners();
		this.setupCalendarBlurListeners();
	}

	selectTab(tab: StartMenuTab) {
		this.forceRerender.set(false);
		setTimeout(() => {
			this.forceRerender.set(true);
			this.selectedTab.set(tab);

			// Si es Calendar, espera al render y vuelve a montar el blur
			if (tab === this.startMenuTab.Calendar) {
				this.currentDay();
				setTimeout(() => this.setupCalendarBlurListeners(), 0);
			} else {
				setTimeout(() => this.setupAppsBlurListeners(), 0);
			}
		}, 0);
	}

	getEventStyle(event: ICalendar): Record<string, string> {
		const start = new Date(event.startTime);
		const end = new Date(event.endTime);
		const durationMinutes = (end.getTime() - start.getTime()) / 1000 / 60;

		const pixelsPerMinute = 1; // 60min → 60px
		const height = Math.max(durationMinutes * pixelsPerMinute, 48); // mínimo de altura

		return {
			height: `${height}px`,
		};
	}

	getPositionedEventStyle(event: ICalendar, hourKey: string): Record<string, string> {
		const hour = parseInt(hourKey.split(':')[0], 10);
		const start = new Date(event.startTime);
		const end = new Date(event.endTime);

		const startMinutes = start.getHours() === hour ? start.getMinutes() : 0;
		const endMinutes = end.getHours() === hour ? end.getMinutes() : end.getHours() > hour ? 60 : startMinutes;

		const spacing = 4; // 4% spacing from the top of the hour
		const top = (startMinutes / 60) * 100 + spacing;
		const height = Math.max(((endMinutes - startMinutes) / 60) * 100, 10);

		return {
			top: `${top}%`,
			height: `${height}%`,
			position: 'absolute',
		};
	}

	getStackedColumnStyle(event: ICalendar, events: ICalendar[]): Record<string, string> {
		const start = new Date(event.startTime).getTime();
		const end = new Date(event.endTime).getTime();

		// Identify all overlapping events in the same hour block
		const overlapping = events.filter((e) => {
			if (e === event) return false;
			const estart = new Date(e.startTime).getTime();
			const eend = new Date(e.endTime).getTime();
			return !(eend <= start || estart >= end);
		});

		// Assign a column index based on order in overlapping group
		const columnIndex = overlapping.filter((e) => new Date(e.startTime).getTime() < start).length;
		const totalColumns = overlapping.length + 1;

		const columnSpacing = 4; // in percent
		const width = (100 - columnSpacing * (totalColumns - 1)) / totalColumns;
		const left = columnIndex * (width + columnSpacing);

		return {
			width: `${width}%`,
			left: `${left}%`,
		};
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

	resetCalendar() {
		this.scrollAnchorContainer()?.nativeElement?.scrollTo({ top: 0, behavior: 'instant' });
		this.blurredHours = {};
		this.blurredAllDay = [];
	}

	previousDay() {
		this.resetCalendar();
		const date = new Date(this.selectedDate());
		date.setDate(date.getDate() - 1);
		this.selectedDate.set(date);
	}

	nextDay() {
		this.resetCalendar();
		this.scrollAnchorContainer()?.nativeElement?.scrollTo({ top: 0, behavior: 'instant' });
		const date = new Date(this.selectedDate());
		date.setDate(date.getDate() + 1);
		this.selectedDate.set(date);
	}

	currentDay() {
		this.resetCalendar();
		this.scrollAnchorContainer()?.nativeElement?.scrollTo({ top: 0, behavior: 'instant' });
		const date = new Date();
		this.selectedDate.set(date);
	}

	get isAtStartOfMonth(): boolean {
		const date = this.selectedDate();
		return date.getDate() === 1;
	}

	get isAtEndOfMonth(): boolean {
		const date = this.selectedDate();
		const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		return date.getDate() === end.getDate();
	}
	mergeEventStyles(event: ICalendar, hourKey: string): Record<string, string> {
		return {
			...this.getPositionedEventStyle(event, hourKey),
			...this.getStackedColumnStyle(event, this.hourlyDistributedEvents()[hourKey]),
		};
	}

	setupCalendarBlurListeners() {
		let recursiveFlag = false;
		const header = this.calendarHeader()?.nativeElement as HTMLElement;

		recursiveFlag = !header || !this.allDayBlocks || this.allDayBlocks.length == 0 || !this.hourBlocks || this.hourBlocks.length == 0;

		if (!recursiveFlag) {
			// Elimina el listener anterior si existe
			if (this.lastScrollContainer && this.lastUpdateBlur) {
				this.lastScrollContainer.removeEventListener('scroll', this.lastUpdateBlur);
			}

			const updateBlur = () => {
				const headerRect = header.getBoundingClientRect();
				this.allDayBlocks.forEach((block, i) => {
					const blockRect = block.nativeElement.getBoundingClientRect();
					this.blurredAllDay[i] = blockRect.top < headerRect.bottom;
				});
				this.hourBlocks.forEach((block, i) => {
					const blockRect = block.nativeElement.getBoundingClientRect();
					const hourKey = Object.keys(this.hourlyDistributedEvents())[i];

					const isAboveHeader = blockRect.top < headerRect.bottom;

					let hasOverlap = false;
					const eventList = this.hourlyDistributedEvents()[hourKey];

					eventList.forEach((event) => {
						const el = document.querySelector(`[data-event-id="${event.id}"]`) as HTMLElement;
						if (!el) return;

						const eventRect = el.getBoundingClientRect();

						if (eventRect.top < blockRect.bottom && eventRect.bottom > blockRect.top) {
							hasOverlap = true;
						}
					});

					// Aplica blur si cumple alguna condición
					this.blurredHours[hourKey] = isAboveHeader || hasOverlap;
				});
				this.hourBlocks.forEach((block, i) => {
					const blockEl = block.nativeElement;
					const blockRect = blockEl.getBoundingClientRect();
					const hourKey = Object.keys(this.hourlyDistributedEvents())[i];

					const isAboveHeader = blockRect.top < headerRect.bottom;
					this.blurredHourBorders[hourKey] = isAboveHeader;

					// Evaluar eventos del bloque anterior (i - 1) para afectar a este borde
					if (i > 0) {
						const prevHourKey = Object.keys(this.hourlyDistributedEvents())[i - 1];
						const prevEvents = this.hourlyDistributedEvents()[prevHourKey];

						let touchesFromPrevious = false;

						prevEvents.forEach((event) => {
							const eventEl = document.querySelector(`[data-event-id="${event.id}"]`) as HTMLElement;
							if (!eventEl) return;
							const eventRect = eventEl.getBoundingClientRect();

							if (eventRect.bottom >= blockRect.top - 2 && eventRect.bottom <= blockRect.top + 6) {
								touchesFromPrevious = true;
							}
						});

						if (touchesFromPrevious) {
							this.blurredHourBorders[hourKey] = true;
						}
					}
				});
			};
			const scrollContainer = header.closest('.scroll-anchor-container');
			if (scrollContainer) {
				scrollContainer.addEventListener('scroll', updateBlur);
				updateBlur();

				// Guarda las referencias para poder limpiar la próxima vez
				this.lastScrollContainer = scrollContainer as HTMLElement;
				this.lastUpdateBlur = updateBlur;
			}

			return;
		}

		setTimeout(() => {
			this.setupCalendarBlurListeners();
		}, 500);
	}

	setupAppsBlurListeners() {
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
			this.setupAppsBlurListeners();
		}, 500);
	}
}
