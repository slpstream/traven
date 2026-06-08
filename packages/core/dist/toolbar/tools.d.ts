export const TOOL_REGISTRY: {
    undo: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any) => any;
    };
    redo: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any) => any;
    };
    bold: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any) => any;
    };
    italic: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any) => any;
    };
    strikethrough: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any) => any;
    };
    highlight: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any) => any;
    };
    code: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    codeblock: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    blockquote: {
        key: string;
        title: string;
        type: string;
        icon: string;
        children: {
            title: string;
            icon: string;
            action: (editor: any, buttonEl: any) => void;
        }[];
    };
    bulletlist: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    numberedlist: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    tasklist: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any) => any;
    };
    hr: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    table: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any, buttonEl: any) => void;
    };
    datetime: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    search: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    fullscreen: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    clear: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any, buttonEl: any) => void;
    };
    uppercase: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    lowercase: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    capitalize: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    removeformatting: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any) => any;
    };
    gotoline: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any) => void;
    };
    heading: {
        key: string;
        title: string;
        type: string;
        icon: string;
        children: {
            level: number;
            title: string;
            icon: string;
            action: (editor: any) => any;
        }[];
    };
    image: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any, buttonEl: any) => void;
    };
    video: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any, buttonEl: any) => void;
    };
    audio: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any, buttonEl: any) => void;
    };
    figure: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any, buttonEl: any) => void;
    };
    link: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any, buttonEl: any) => void;
    };
    help: {
        key: string;
        title: string;
        shortcut: string;
        keybinding: string;
        icon: string;
        action: (editor: any, buttonEl: any) => void;
    };
    component: {
        key: string;
        title: string;
        icon: string;
        action: (editor: any, buttonEl: any) => void;
    };
    "bubble-insert": {
        key: string;
        title: string;
        icon: string;
        action: () => void;
    };
};
