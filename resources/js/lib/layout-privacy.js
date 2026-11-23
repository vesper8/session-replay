// Layout capture keeps opaque selectors and presentation, without page content or resource addresses.
export function layoutPrivacy() {
    const names = new Map();
    const opaque = (value) => {
        if (!names.has(value)) names.set(value, `sr${names.size + 1}`);
        return names.get(value);
    };
    const decode = (value) => value.replace(/\\([a-f0-9]{1,6}\s?|.)/gi, (_, code) => /^[a-f0-9]/i.test(code) ? String.fromCodePoint(parseInt(code.trim(), 16)) : code);
    const identifiers = /([.#])((?:\\[a-f0-9]{1,6}\s?|\\.|[-\w\u0080-\uFFFF])+)/gi;
    const pseudo = new Set('root scope empty first-child last-child only-child first-of-type last-of-type only-of-type nth-child nth-last-child nth-of-type nth-last-of-type not is where has hover focus focus-visible focus-within active visited link checked disabled enabled required optional read-only read-write placeholder-shown before after first-letter first-line selection backdrop marker file-selector-button placeholder n odd even of'.split(' '));
    const selector = (value) => {
        if (value.includes('[') || /["']|:lang\(|:dir\(|:state\(/i.test(value)) return '';
        const selected = value.replace(identifiers, (_, prefix, name) => prefix + opaque(decode(name)));
        const words = selected.replace(/[.#]sr\d+/g, '').match(/[a-z_][\w-]*/gi) || [];
        return words.every((word) => tags.has(word) || pseudo.has(word)) ? selected : '';
    };
    const declaration = document.createElement('span').style;
    const safeValue = (value) => !/["'\\@<>]|url\s*\(|attr\s*\(|image\s*\(|image-set\s*\(|\/\*/i.test(value);
    const keywords = new Set(('auto none normal inherit initial unset revert revert-layer important true false block inline inline-block inline-flex inline-grid flex grid table table-row table-cell contents flow-root list-item hidden visible clip scroll overlay collapse static relative absolute fixed sticky border-box content-box solid dotted dashed double groove ridge inset outset transparent currentcolor repeat no-repeat repeat-x repeat-y cover contain center left right top bottom both horizontal vertical start end stretch baseline space-between space-around space-evenly row column row-reverse column-reverse wrap nowrap wrap-reverse bold bolder lighter italic oblique uppercase lowercase capitalize small-caps underline overline line-through solid border-box padding-box content-box fill stroke round square butt bevel miter evenodd nonzero antialiased subpixel-antialiased break-word break-all keep-all anywhere pre pre-wrap pre-line break-spaces ease ease-in ease-out ease-in-out linear infinite running paused pointer default crosshair move text wait help grab grabbing not-allowed progress zoom-in zoom-out resize vertical-rl horizontal-tb ltr rtl isolate isolate-override plaintext left-to-right touch manipulation pan-x pan-y mandatory proximity read-only read-write rgb rgba hsl hsla hwb lab lch oklab oklch color color-mix srgb srgb-linear oklab calc min max clamp var translate translatex translatey translatez translate3d scale scalex scaley scalez scale3d rotate rotatex rotatey rotatez rotate3d skew skewx skewy matrix matrix3d perspective fit-content max-content min-content repeat minmax subgrid serif sans-serif monospace system-ui').split(' '));
    const variables = (value) => value.replace(/--[\w-]+/g, (name) => `--${opaque(name)}`);

    function declarations(text) {
        declaration.cssText = text;
        const result = [];
        for (let index = 0; index < declaration.length; index++) {
            const property = declaration[index];
            const value = declaration.getPropertyValue(property);
            if (property === 'content' || property === 'font-family' || property.startsWith('animation') || !safeValue(value)) continue;
            const words = variables(value).replace(/var\(\s*--sr\d+/g, 'var(').replace(/#[a-f\d]+/gi, '').replace(/(?:\d*\.)?\d+(?:e[+-]?\d+)?(?:px|rem|em|ex|ch|vh|vw|vmin|vmax|dvh|dvw|deg|rad|turn|ms|s|fr|%|pt|pc|cm|mm|in)?/gi, '').match(/[a-z_][\w-]*/gi) || [];
            if (words.some((word) => !keywords.has(word.toLowerCase()))) continue;
            // Custom properties can carry arbitrary application strings, so only numeric/colour values survive.
            if (property.startsWith('--') && !/^[\d\s.,%#()+*/-]+(?:px|rem|em|vh|vw|deg|ms|s)?$|^#[a-f\d]{3,8}$|^(?:rgb|hsl)a?\([\d\s.,%/+-]+\)$/i.test(value.trim())) continue;
            result.push(`${property.startsWith('--') ? variables(property) : property}:${variables(value)}${declaration.getPropertyPriority(property) ? '!important' : ''}`);
        }
        return result.join(';');
    }

    function stylesheet(text) {
        try {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(text);
            const rules = (list) => [...list].map((rule) => {
                if (rule.type === 1) {
                    const selected = selector(rule.selectorText);
                    return selected ? `${selected}{${declarations(rule.style.cssText)}}` : '';
                }
                // Other rules can contain URLs, arbitrary strings, font data or application identifiers.
                if (rule.type === 4) return `@media all{${rules(rule.cssRules)}}`;
                if (rule.type === 12) return rules(rule.cssRules);
                if (rule.constructor.name === 'CSSLayerBlockRule') return `@layer{${rules(rule.cssRules)}}`;
                return '';
            }).join('');
            return rules(sheet.cssRules);
        } catch {
            return '';
        }
    }

    function styles(value) {
        if (typeof value === 'string') return declarations(value);
        const result = {};
        for (const [property, change] of Object.entries(value || {})) {
            if (change === false) {
                if (property.startsWith('--')) result[variables(property)] = false;
                else if (CSS.supports(property, 'initial')) result[property] = false;
                continue;
            }
            const [text, priority] = Array.isArray(change) ? change : [change, ''];
            declaration.cssText = '';
            declaration.setProperty(property, text, priority);
            const safe = declarations(declaration.cssText);
            declaration.cssText = safe;
            for (let index = 0; index < declaration.length; index++) {
                const name = declaration[index];
                result[name] = [declaration.getPropertyValue(name), declaration.getPropertyPriority(name)];
            }
        }
        return result;
    }

    const numeric = new Set(['width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'viewbox', 'points', 'colspan', 'rowspan', 'span', 'start', 'rr_width', 'rr_height', 'rr_scrollleft', 'rr_scrolltop']);
    const states = new Set(['checked', 'selected', 'disabled', 'multiple', 'hidden', 'open', 'readonly', 'required']);
    const types = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'text', 'password', 'email', 'number', 'search', 'range', 'date', 'hidden', 'file', 'tel', 'url', 'time', 'color']);
    const allowedAttributes = new Set([...numeric, ...states, '_csstext', 'class', 'id', 'style', 'd', 'transform', 'type', 'fill', 'stroke', 'color', 'value']);
    function attributes(values) {
        for (const name of Object.keys(values || {})) {
            const value = values[name];
            const lower = name.toLowerCase();
            if (!allowedAttributes.has(lower)) {
                delete values[name];
                continue;
            }
            if (value === null) continue;
            if (lower === '_csstext') values[name] = stylesheet(String(value));
            else if (lower === 'class') values[name] = String(value).split(/\s+/).filter(Boolean).map(opaque).join(' ');
            else if (lower === 'id') values[name] = opaque(String(value));
            else if (lower === 'style') values[name] = styles(value);
            else if (numeric.has(lower) && /^[\d\s.,%eE+-]*$/.test(String(value))) continue;
            else if (lower === 'd' && /^[\d\s.,eEMmZzLlHhVvCcSsQqTtAa+-]*$/.test(String(value))) continue;
            else if (lower === 'transform' && /^(?:(?:matrix|translate|scale|rotate|skewX|skewY)\([\d\s.,eE+-]+\)\s*)+$/.test(String(value))) continue;
            else if (states.has(lower)) values[name] = '';
            else if (lower === 'type' && types.has(value)) continue;
            else if (['fill', 'stroke', 'color'].includes(lower) && /^(?:#[a-f\d]{3,8}|none|currentColor|transparent)$/i.test(value)) continue;
            else if (lower === 'value') values[name] = '***';
            else delete values[name];
        }
    }
    const tags = new Set(('html head body title meta link style div span p a button input textarea select option optgroup label form fieldset legend main section article aside header footer nav h1 h2 h3 h4 h5 h6 ul ol li dl dt dd table thead tbody tfoot tr td th col colgroup caption pre code br hr strong em b i u s small sub sup details summary dialog figure figcaption picture source img video audio canvas iframe object embed svg g path circle ellipse rect line polyline polygon defs symbol use marker mask clipPath pattern linearGradient radialGradient stop text tspan textPath foreignObject').split(' '));
    function node(root, parentTag = '') {
        if (root.type === 1) { root.name = 'html'; root.publicId = ''; root.systemId = ''; }
        if (root.type === 3) root.textContent = parentTag === 'style' ? stylesheet(root.textContent) : root.textContent.replace(/\S/g, '*');
        if (root.type === 2) {
            if (!tags.has(root.tagName)) root.tagName = 'div';
            attributes(root.attributes);
            if (root.tagName === 'iframe') root.childNodes = [];
        }
        if ([4, 5].includes(root.type)) root.textContent = '';
        for (const child of root.childNodes || []) node(child, root.tagName);
    }

    return (event) => {
        if (event.type === 4) event.data.href = 'https://replay.invalid/page';
        if (event.type === 2) node(event.data.node);
        if (event.type === 3) {
            const data = event.data;
            if (![0, 1, 2, 3, 4, 5, 6, 12].includes(data.source)) return false;
            if (data.source === 0) {
                for (const add of data.adds || []) node(add.node);
                for (const change of data.attributes || []) attributes(change.attributes);
                // A text mutation can target a stylesheet; its contents cannot be inferred from an rrweb id here.
                for (const change of data.texts || []) change.value = '';
            }
            if (data.source === 5 && typeof data.text === 'string') data.text = '***';
        }
        if ([5, 6].includes(event.type)) return false;
        return true;
    };
}
