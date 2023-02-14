import * as vue_demi from 'vue-demi';
import { MaybeComputedRef } from '@vueuse/shared';
import QRCode from 'qrcode';

/**
 * Wrapper for qrcode.
 *
 * @see https://vueuse.org/useQRCode
 * @param text
 * @param options
 */
declare function useQRCode(text: MaybeComputedRef<string>, options?: QRCode.QRCodeToDataURLOptions): vue_demi.Ref<string>;

export { useQRCode };
