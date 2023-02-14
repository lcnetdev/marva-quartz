import type CoreModal from './CoreModal.vue';
type Event = 'beforeOpen' | 'beforeClose' | 'opened' | 'closed';
export declare function useEvent(emit: InstanceType<typeof CoreModal>['$emit']): {
    emitEvent: (e: Event) => void;
};
export {};
