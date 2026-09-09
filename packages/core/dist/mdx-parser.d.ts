export namespace MdxComponents {
    let defineNodes: ({
        name: string;
        block?: undefined;
        style?: undefined;
    } | {
        name: string;
        block: boolean;
        style?: undefined;
    } | {
        name: string;
        style: import("@lezer/highlight").Tag;
        block?: undefined;
    })[];
    let parseBlock: {
        name: string;
        before: string;
        endLeaf(_cx: any, line: any): boolean;
        parse(cx: any, line: any): boolean;
    }[];
    let parseInline: {
        name: string;
        before: string;
        parse(cx: any, next: any, pos: any): any;
    }[];
}
