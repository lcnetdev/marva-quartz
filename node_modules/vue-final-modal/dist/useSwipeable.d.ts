import type { Ref } from 'vue';
export type SwiperDirection = 'up' | 'right' | 'down' | 'left' | 'none';
export declare function useSwipeable(el: Ref<undefined | HTMLElement>, { threshold, onSwipeStart, onSwipe, onSwipeEnd, passive, }: {
    threshold?: number;
    onSwipeStart?: (e?: MouseEvent | TouchEvent) => void;
    onSwipe?: (e?: MouseEvent | TouchEvent) => void;
    onSwipeEnd?: (e?: MouseEvent | TouchEvent, direction?: SwiperDirection) => void;
    passive?: boolean;
}): {
    isSwiping: Ref<boolean>;
    direction: import("vue").ComputedRef<SwiperDirection>;
    coordsStart: {
        x: number;
        y: number;
    };
    coordsEnd: {
        x: number;
        y: number;
    };
    lengthX: import("vue").ComputedRef<number>;
    lengthY: import("vue").ComputedRef<number>;
    stop: () => void;
};
