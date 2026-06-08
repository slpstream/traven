export namespace Highlight {
    let defineNodes: ({
        name: string;
        style: {
            "Highlight/...": import("@lezer/highlight").Tag;
        };
    } | {
        name: string;
        style: import("@lezer/highlight").Tag;
    })[];
    let parseInline: {
        name: string;
        parse(cx: any, next: any, pos: any): any;
        after: string;
    }[];
}
