export namespace Shortcode {
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
