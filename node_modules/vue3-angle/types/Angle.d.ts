declare const _default: import("vue").DefineComponent<{
    angle: {
        type: NumberConstructor;
        default: number;
    };
    size: {
        type: NumberConstructor;
        default: number;
        validator: (value: number) => boolean;
    };
    borderWidth: {
        type: NumberConstructor;
        default: number;
        validator: (value: number) => boolean;
    };
    borderColor: {
        type: StringConstructor;
        default: string;
    };
}, () => JSX.Element, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("change" | "update:angle")[], "change" | "update:angle", import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<{
    angle?: unknown;
    size?: unknown;
    borderWidth?: unknown;
    borderColor?: unknown;
} & {
    size: number;
    angle: number;
    borderWidth: number;
    borderColor: string;
} & {}> & {
    onChange?: ((...args: any[]) => any) | undefined;
    "onUpdate:angle"?: ((...args: any[]) => any) | undefined;
}, {
    size: number;
    angle: number;
    borderWidth: number;
    borderColor: string;
}>;
export default _default;
