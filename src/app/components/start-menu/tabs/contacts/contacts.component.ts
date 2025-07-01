import { animate, state, style, transition, trigger } from '@angular/animations';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, computed, effect, ElementRef, inject, QueryList, signal, viewChild, ViewChildren } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BridgeService } from '../../../../utils/bridge/bridge.service';
import { IContact } from '../../../../utils/bridge/contact.types';
import { ContactActions, contactActions, IContactActions } from '../../../../utils/constants';
import { IconsService } from '../../../../utils/icons/icons.service';
import { StartMenuService } from '../../start-menu.service';

@Component({
	selector: 'start-menu-contacts',
	imports: [MatIconModule, ScrollingModule],
	templateUrl: './contacts.component.html',
	styleUrl: './contacts.component.scss',
	animations: [
		trigger('expandCollapse', [
			state(
				'collapsed',
				style({
					height: '0px',
					opacity: 0,
					overflow: 'hidden',
				})
			),
			state(
				'expanded',
				style({
					height: '*',
					opacity: 1,
					overflow: 'hidden',
				})
			),
			transition('collapsed <=> expanded', [animate('280ms cubic-bezier(0.4,0.0,0.2,1)')]),
		]),
	],
})
export class ContactsComponent implements AfterViewInit {
	private readonly _startMenuService = inject(StartMenuService);
	private readonly _iconService = inject(IconsService);
	private readonly _bridgeService = inject(BridgeService);

	private debounceTimeout: any;
	private isDragging = false;
	private dragDebounceTimeout: any;
	private lastDraggedLetter?: string;

	searchQuery = signal<string | undefined>(undefined);

	searchInput = viewChild<ElementRef<HTMLInputElement>>('search');
	letterSidebar = viewChild<ElementRef<HTMLElement>>('letterSidebar');
	appHeader = viewChild<ElementRef<HTMLDivElement>>('appHeader');

	distributedContacts = this._startMenuService.filteredContacts;

	openedContactIds = signal<string[]>([]);

	contactActions = contactActions;

	@ViewChildren('letterHeader') letterHeaders!: QueryList<ElementRef<HTMLElement>>;
	@ViewChildren('contactButton') contactButtons!: QueryList<ElementRef<HTMLElement>>;
	@ViewChildren('contactCollapsible') contactCollapsibles!: QueryList<ElementRef<HTMLElement>>;
	blurredLetters: Record<string, boolean> = {};
	blurredContacts: Record<string, boolean> = {};
	blurredCollapsibles: Record<string, boolean> = {};

	readonly sortedDistributedGroups = computed(() => {
		const keys = Object.keys(this.distributedContacts());
		return keys.sort((a, b) => (a === 'favourites' ? -1 : b === 'favourites' ? 1 : a.localeCompare(b)));
	});

	visibleContacts = computed(() => {
		const query = this.searchQuery();
		const groups = this.distributedContacts();
		if (!query) {
			// Si NO hay búsqueda, mostrar solo favoritos (si existen)
			const onlyFavs: Record<string, IContact[]> = {};
			if (groups['favourites'] && groups['favourites'].length > 0) {
				onlyFavs['favourites'] = groups['favourites'];
			}
			return onlyFavs;
		}
		// Si hay búsqueda, muestra todos los resultados agrupados normalmente
		return groups;
	});

	readonly sortedVisibleGroups = computed(() => {
		const keys = Object.keys(this.visibleContacts());
		return keys.sort((a, b) => (a === 'favourites' ? -1 : b === 'favourites' ? 1 : a.localeCompare(b)));
	});

	activeLetter = this._startMenuService.activeLetter;

	Object = Object;

	constructor() {
		effect(() => {
			clearTimeout(this.debounceTimeout);
			const currentValue = this.searchQuery();
			this.debounceTimeout = setTimeout(() => {
				this._startMenuService.filter.set(currentValue);
				setTimeout(() => {
					if (currentValue && this.distributedContacts()) {
						this.searchInput()?.nativeElement?.blur();
					}
				}, 0);
			}, 500);
		});
	}

	ngAfterViewInit(): void {
		this._setupContactsBlurListeners();
	}

	invokeAction(action: IContactActions, phoneNumber: string) {
		if (action.action === ContactActions.CALL) {
			this._bridgeService.requestContactCall(phoneNumber);
		} else if (action.messagingApp) {
			this._bridgeService.requestMessagingContact(phoneNumber, action.messagingApp.toString());
		}
	}

	hasMatchedIcon(packageName?: string): boolean {
		if (!packageName) {
			return false;
		}
		const matchedIcon = this._iconService.getAppIcon(packageName);
		if (matchedIcon) {
			return true;
		}

		return false;
	}

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

	openContact(id: string) {
		this.openedContactIds.update((state) => {
			if (state.includes(id)) {
				return state.filter((item) => item != id);
			}

			const arrayOfIds = state;
			arrayOfIds.push(id);
			return arrayOfIds;
		});
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

	private _setupContactsBlurListeners() {
		const header = this.appHeader()?.nativeElement as HTMLElement;

		const recursiveFlag = !header || !this.contactButtons || this.contactButtons.length === 0;

		if (!recursiveFlag) {
			const updateContactsBlur = () => {
				const headerRect = header.getBoundingClientRect();

				this.letterHeaders.forEach((headerEl, i) => {
					const headerRectEl = headerEl.nativeElement.getBoundingClientRect();
					const letter = this.sortedVisibleGroups()[i];
					this.blurredLetters[letter] = headerRectEl.top < headerRect.bottom;
				});

				this.contactButtons.forEach((button) => {
					const btnRect = button.nativeElement.getBoundingClientRect();
					const contactId = button.nativeElement.id;
					this.blurredContacts[contactId] = btnRect.top < headerRect.bottom;
				});

				this.contactCollapsibles.forEach((collapsible) => {
					const collapsibleRect = collapsible.nativeElement.getBoundingClientRect();
					const id = collapsible.nativeElement.id;
					this.blurredCollapsibles[id] = collapsibleRect.top < headerRect.bottom;
				});
			};

			const scrollContainer = header.closest('.scroll-anchor-container');
			if (scrollContainer) {
				scrollContainer.addEventListener('scroll', updateContactsBlur);
				updateContactsBlur();
			}

			return;
		}

		// Si el DOM aún no está listo, reintenta
		setTimeout(() => {
			this._setupContactsBlurListeners();
		}, 500);
	}
}
