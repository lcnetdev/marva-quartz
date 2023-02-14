export declare const enum NodeType {
    ELEMENT_NODE = 1,
    ATTRIBUTE_NODE = 2,
    TEXT_NODE = 3,
    CDATA_SECTION_NODE = 4,
    ENTITY_REFERENCE_NODE = 5,
    COMMENT_NODE = 6,
    PROCESSING_INSTRUCTION_NODE = 7,
    DOCUMENT_NODE = 9
}
export interface DragEventOptions {
    drag?: (event: Event) => void;
    start?: (event: Event) => void;
    end?: (event: Event) => void;
}
export declare type ScrollElement = Element | Window;
export declare class DOMUtils {
    static isWindow(val: unknown): val is Window;
    static addEventListener(element: HTMLElement | Document | Window | null, event: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    static removeEventListener(element: HTMLElement | Document | Window | null, event: string, handler: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    static triggerDragEvent(element: HTMLElement, options: DragEventOptions): void;
    static getBoundingClientRect(element: HTMLElement): DOMRect | null;
    static hasClass(element: HTMLElement, className: string): boolean;
    static addClass(element: HTMLElement, className: string): void;
    static removeClass(element: HTMLElement, className: string): void;
    static toggleClass(element: HTMLElement, className: string, force?: boolean): void;
    static replaceClass(element: HTMLElement, oldClassName: string, newClassName: string): void;
    static getScrollTop(el: ScrollElement): number;
    static setScrollTop(el: ScrollElement, value: number): void;
    static getRootScrollTop(): number;
    static setRootScrollTop(value: number): void;
    static getElementTop(el: ScrollElement, scroller?: HTMLElement): number;
    static getVisibleHeight(el: ScrollElement): number;
    static isHidden(el: HTMLElement): boolean;
    static triggerEvent(el: Element, type: string): void;
    static calcAngle(element: HTMLElement, event: MouseEvent): number;
    static querySelector<E extends Element = Element>(selectors: string, parentElement?: HTMLElement): E | null;
    static createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, ...classNames: string[]): HTMLElementTagNameMap[K];
    static appendChild<K extends Element>(parentElement: K, ...children: HTMLElement[]): void;
    static getWindow(node: any): any;
    static isElement(node: any): boolean;
    static isHTMLElement(node: any): boolean;
    static isShadowRoot(node: any): boolean;
    static getWindowScroll(node: Node | Window): {
        scrollLeft: number;
        scrollTop: number;
    };
}
