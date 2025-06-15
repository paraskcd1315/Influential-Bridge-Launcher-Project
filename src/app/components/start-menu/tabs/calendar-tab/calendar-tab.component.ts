import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, input, QueryList, signal, viewChild, ViewChildren } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ICalendar } from '../../../../utils/bridge/calendar.types';
import { StartMenuService } from '../../start-menu.service';

@Component({
	selector: 'start-menu-calendar-tab',
	imports: [CommonModule, MatIconModule, DatePipe],
	templateUrl: './calendar-tab.component.html',
	styleUrl: './calendar-tab.component.scss',
})
export class CalendarTabComponent implements AfterViewInit {
	Object = Object;
	private readonly _startMenuService = inject(StartMenuService);
	private lastScrollContainer: HTMLElement | null = null;
	private lastUpdateBlur: (() => void) | null = null;

	blurAllDay = signal(false);
	blurHours = signal(false);
	scrollAnchorContainer = input<ElementRef<HTMLDivElement>>();
	calendarHeader = viewChild<ElementRef<HTMLDivElement>>('calendarHeader');

	@ViewChildren('hourBlock') hourBlocks!: QueryList<ElementRef<HTMLElement>>;
	@ViewChildren('allDayBlock') allDayBlocks!: QueryList<ElementRef<HTMLElement>>;
	blurredHours: Record<string, boolean> = {};
	blurredAllDay: boolean[] = [];
	blurredHourBorders: Record<string, boolean> = {};
	blurredEventIds: Record<string, boolean> = {};

	selectedDate = this._startMenuService.selectedDate;
	allDayCalendarEvents = this._startMenuService.allDayEvents;
	hourlyDistributedEvents = this._startMenuService.hourlyDistributedEvents;

	get isAtStartOfMonth(): boolean {
		const date = this.selectedDate();
		return date.getDate() === 1;
	}

	get isAtEndOfMonth(): boolean {
		const date = this.selectedDate();
		const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		return date.getDate() === end.getDate();
	}

	ngAfterViewInit() {
		this.currentDay();
		this._setupCalendarBlurListeners();
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

	resetCalendar() {
		this.scrollAnchorContainer()?.nativeElement?.scrollTo({ top: 0, behavior: 'instant' });
		this.blurredHours = {};
		this.blurredAllDay = [];
	}

	_setupCalendarBlurListeners() {
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

				Object.keys(this.hourlyDistributedEvents()).forEach((hourKey) => {
					const eventList = this.hourlyDistributedEvents()[hourKey];
					eventList.forEach((event) => {
						const el = document.querySelector(`[data-event-id="${event.id}"]`) as HTMLElement;
						if (!el) return;
						const eventRect = el.getBoundingClientRect();
						this.blurredEventIds[event.id] = eventRect.top < headerRect.bottom;
					});
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
			this._setupCalendarBlurListeners();
		}, 500);
	}

	mergeEventStyles(event: ICalendar, hourKey: string): Record<string, string> {
		return {
			...this.getPositionedEventStyle(event, hourKey),
			...this.getStackedColumnStyle(event, this.hourlyDistributedEvents()[hourKey]),
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
}
