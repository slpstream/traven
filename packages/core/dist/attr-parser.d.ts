/**
 * Parse attribute key-value pairs from an MDX/HTML attribute string in linear O(N) time.
 * @param {string} attrStr
 * @returns {AttrPair[]}
 */
export function parseAttrPairs(attrStr: string): AttrPair[];
/**
 * Parse an MDX/HTML attribute string into a name→value map in linear O(N) time.
 * @param {string} attrStr
 * @returns {Record<string, string>}
 */
export function parseAttrMap(attrStr: string): Record<string, string>;
export type AttrPair = {
    /**
     * - Start position of the attribute in attrStr
     */
    index: number;
    /**
     * - End position of the attribute in attrStr
     */
    lastIndex: number;
    /**
     * - Attribute name
     */
    name: string;
    /**
     * - Start position of name in attrStr
     */
    nameStart: number;
    /**
     * - End position of name in attrStr
     */
    nameEnd: number;
    /**
     * - Attribute value
     */
    value: string;
    /**
     * - Start position of value in attrStr
     */
    valStart: number;
    /**
     * - End position of value in attrStr
     */
    valEnd: number;
};
