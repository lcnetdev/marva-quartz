import VueFinalModal from './components/VueFinalModal/VueFinalModal.vue';
import type CoreModal from './components/CoreModal/CoreModal.vue';
import type { ComponentProps, Constructor, InternalVfm, RawProps, UseModalOptions, UseModalReturnType, Vfm } from './Modal';
/**
 * Returns the vfm instance. Equivalent to using `$vfm` inside
 * templates.
 */
export declare function useVfm(): Vfm;
/**
 * Returns the internalVfm instance.
 */
export declare function useInternalVfm(): InternalVfm;
/**
 * Create a dynamic modal.
 */
export declare function useModal<P = InstanceType<typeof VueFinalModal>['$props']>(_options: UseModalOptions<P>): UseModalReturnType<P>;
export declare function useModalSlot<P>(options: {
    component: Constructor<P>;
    attrs?: (RawProps & P) | ({} extends P ? null : never);
}): {
    component: Constructor<P>;
    attrs?: (import("vue").VNodeProps & {
        __v_isVNode?: undefined;
        [Symbol.iterator]?: undefined;
    } & Record<string, any> & P) | ({} extends P ? null : never) | undefined;
};
export declare function pickModalProps(props: any, modalProps: any): Record<string, any>;
export declare function byPassAllModalEvents(emit?: InstanceType<typeof CoreModal>['$emit']): {
    'onUpdate:modelValue'?: undefined;
    onBeforeClose?: undefined;
    onClosed?: undefined;
    onBeforeOpen?: undefined;
    onOpened?: undefined;
    /** onClickOutside will only be emitted when clickToClose equal to `false` */
    onClickOutside?: undefined;
} | {
    'onUpdate:modelValue': (val: boolean) => void;
    onBeforeClose: () => void;
    onClosed: () => void;
    onBeforeOpen: () => void;
    onOpened: () => void;
    /** onClickOutside will only be emitted when clickToClose equal to `false` */
    onClickOutside: () => void;
};
export declare function useVfmAttrs(options: {
    props: ComponentProps;
    modalProps: ComponentProps;
    emit?: any;
}): import("vue").ComputedRef<{
    'onUpdate:modelValue'?: undefined;
    onBeforeClose?: undefined;
    onClosed?: undefined;
    onBeforeOpen?: undefined;
    onOpened?: undefined;
    /** onClickOutside will only be emitted when clickToClose equal to `false` */
    onClickOutside?: undefined;
} | {
    'onUpdate:modelValue': (val: boolean) => void;
    onBeforeClose: () => void;
    onClosed: () => void;
    onBeforeOpen: () => void;
    onOpened: () => void;
    /** onClickOutside will only be emitted when clickToClose equal to `false` */
    onClickOutside: () => void;
}>;
