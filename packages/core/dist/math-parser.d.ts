export function configureKatex(options: any): void;
export function ensureKatex(): any;
export namespace MathExtension {
    let defineNodes: ({
        name: string;
        style?: undefined;
    } | {
        name: string;
        style: import("@lezer/highlight").Tag;
    })[];
    let parseInline: {
        name: string;
        before: string;
        parse(cx: any, next: any, pos: any): number;
    }[];
}
