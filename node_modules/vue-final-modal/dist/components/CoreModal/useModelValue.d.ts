import type { Ref } from 'vue';
import type CoreModal from './CoreModal.vue';
export declare function useModelValue(props: InstanceType<typeof CoreModal>['$props'], emit: InstanceType<typeof CoreModal>['$emit']): {
    modelValueLocal: Ref<boolean>;
};
