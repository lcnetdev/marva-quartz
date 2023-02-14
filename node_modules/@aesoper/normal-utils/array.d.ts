export declare class ArrayUtils {
    static deduplicate<T>(arr: T[]): T[];
    static flat<T>(arr: T[]): T[];
    static find<T = any>(arr: Array<T>, pred: (args: T) => boolean): any;
    static findIndex<T = any>(arr: Array<T>, pred: (args: T) => boolean): number;
}
