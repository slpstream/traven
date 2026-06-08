/**
 * TravenEditorElement - Web Component wrapper for TravenEditor.
 */
export class TravenEditorElement extends HTMLElement {
    static formAssociated: boolean;
    static get observedAttributes(): string[];
    _internals: ElementInternals;
    _editor: TravenEditor;
    _hiddenTextarea: HTMLTextAreaElement;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: any, oldValue: any, newValue: any): void;
    set value(v: string);
    get value(): string;
    get form(): HTMLFormElement;
    set name(n: string);
    get name(): string;
    get type(): string;
    get editor(): TravenEditor;
    set codeLanguages(langs: any);
    get codeLanguages(): any;
    _codeLanguages: any;
}
import { TravenEditor } from "./TravenEditor.js";
