export declare const calcAngle: (element: HTMLElement, event: MouseEvent) => number;
export interface DragEventOption {
    drag?: (event: Event) => void;
    start?: (event: Event) => void;
    end?: (event: Event) => void;
}
export declare const triggerDragEvent: (element: HTMLElement, options: DragEventOption) => void;
