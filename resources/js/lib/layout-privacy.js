export function privatePageUrl(value, paths = {}) {
    let pathname;
    try {
        const parsed = new URL(value, location.href);
        pathname = parsed.pathname;
        if (parsed.origin === 'https://replay.invalid' && Object.values(paths).includes(decodeURIComponent(pathname.slice(1)))) return `https://replay.invalid${pathname}`;
    } catch { return 'https://replay.invalid/page'; }
    for (const [pattern, label] of Object.entries(paths)) {
        const expression = pattern.split('*').map((part) => [...part].map((character) => /[a-z\d/_-]/i.test(character) ? character : String.fromCharCode(92) + character).join('')).join('.*');
        if (new RegExp(`^${expression}$`).test(pathname)) return `https://replay.invalid/${encodeURIComponent(label)}`;
    }
    return 'https://replay.invalid/page';
}

// Layout capture keeps opaque selectors and presentation, without page content or resource addresses.
export function layoutPrivacy({ layoutFidelity = false, readableText = false, maskTextSelector, publicText = [], pagePaths = {} } = {}, nodeOf = () => null) {
    const publicWords = new Set(publicText);
    const privateText = ['script', 'style', 'noscript', 'template', 'input', 'textarea', 'select', '[contenteditable]', '[data-replay-mask]', maskTextSelector].filter(Boolean).join(',');
    const maskedText = (value, id) => {
        const parent = nodeOf(id)?.parentElement;
        if (readableText && parent && !parent.closest(privateText)) return value;
        return publicWords.has(value.trim()) ? value : value.replace(/\S/g, '*');
    };
    const publicAttributes = new Map([['data-state', ['open', 'closed', 'active', 'inactive', 'checked', 'unchecked', 'on', 'off']], ['aria-expanded', ['true', 'false']], ['aria-selected', ['true', 'false']], ['aria-checked', ['true', 'false', 'mixed']], ['data-theme', ['light', 'dark']]]);
    const names = new Map();
    const opaque = (value) => {
        if (!names.has(value)) names.set(value, `sr${names.size + 1}`);
        return names.get(value);
    };
    const decode = (value) => value.replace(/\\([a-f0-9]{1,6}\s?|.)/gi, (_, code) => /^[a-f0-9]/i.test(code) ? String.fromCodePoint(parseInt(code.trim(), 16)) : code);
    const identifiers = /([.#])((?:\\[a-f0-9]{1,6}\s?|\\.|[-\w\u0080-\uFFFF])+)/gi;
    const pseudo = new Set('root scope empty first-child last-child only-child first-of-type last-of-type only-of-type nth-child nth-last-child nth-of-type nth-last-of-type not is where has hover focus focus-visible focus-within active visited link checked disabled enabled required optional read-only read-write placeholder-shown before after first-letter first-line selection backdrop marker file-selector-button placeholder n odd even of'.split(' '));
    const selector = (value) => {
        let safe = value;
        if (layoutFidelity) safe = safe.replace(/\[([\w-]+)(?:([~|^$*]?=)["']?([\w-]+)["']?)?\]/g, (whole, name, operator, text) => publicAttributes.has(name) && (!text || publicAttributes.get(name).includes(text)) ? `:sr-attribute-${[...publicAttributes.keys()].indexOf(name)}${text ? '-' + text : ''}` : whole);
        if (safe.includes('[') || /["']|:lang\(|:dir\(|:state\(/i.test(safe)) return '';
        const selected = safe.replace(identifiers, (_, prefix, name) => prefix + opaque(decode(name)));
        const words = selected.replace(/[.#]sr\d+/g, '').match(/[a-z_][\w-]*/gi) || [];
        return words.every((word) => tags.has(word) || pseudo.has(word) || word.startsWith('sr-attribute-')) ? selected.replace(/:sr-attribute-(\d+)(?:-([\w-]+))?/g, (_, index, text) => `[${[...publicAttributes.keys()][Number(index)]}${text ? '="' + text + '"' : ''}]`) : '';
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
            if (!layoutFidelity && property.startsWith('--') && !/^[\d\s.,%#()+*/-]+(?:px|rem|em|vh|vw|deg|ms|s)?$|^#[a-f\d]{3,8}$|^(?:rgb|hsl)a?\([\d\s.,%/+-]+\)$/i.test(value.trim())) continue;
            result.push(`${property.startsWith('--') ? variables(property) : property}:${variables(value)}${declaration.getPropertyPriority(property) ? '!important' : ''}`);
        }
        return result.join(';');
    }

    function stylesheet(text) {
        if (layoutFidelity) return '';
        try {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(text);
            const rules = (list) => [...list].map((rule) => {
                if (rule.type === 1) {
                    const selected = selector(rule.selectorText);
                    return selected ? `${selected}{${declarations(rule.style.cssText)};${layoutFidelity && rule.cssRules ? rules(rule.cssRules) : ''}}` : '';
                }
                // Other rules can contain URLs, arbitrary strings, font data or application identifiers.
                if (rule.type === 4) {
                    const query = rule.conditionText;
                    const allowed = new Set('all screen print not only and or min-width max-width min-height max-height width height orientation portrait landscape prefers-color-scheme dark light prefers-reduced-motion reduce no-preference hover any-hover pointer any-pointer fine coarse none resolution min-resolution max-resolution dppx dpi px em rem'.split(' '));
                    const words = query.match(/[a-z-]+/gi) || [];
                    return layoutFidelity && words.every((word) => allowed.has(word)) ? `@media ${query}{${rules(rule.cssRules)}}` : `@media all{${rules(rule.cssRules)}}`;
                }
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

    const presentationProperties = 'display position top right bottom left z-index width height min-width min-height max-width max-height box-sizing margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left border-top-width border-right-width border-bottom-width border-left-width border-top-style border-right-style border-bottom-style border-left-style border-top-color border-right-color border-bottom-color border-left-color border-top-left-radius border-top-right-radius border-bottom-left-radius border-bottom-right-radius background-color color opacity visibility overflow-x overflow-y flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-content align-self justify-content justify-items justify-self row-gap column-gap grid-template-columns grid-template-rows grid-auto-columns grid-auto-rows grid-auto-flow grid-column-start grid-column-end grid-row-start grid-row-end order translate transform transform-origin font-size font-weight font-style line-height letter-spacing white-space text-align text-transform text-decoration-line text-decoration-color text-decoration-style vertical-align word-break overflow-wrap text-overflow box-shadow outline-color outline-width outline-style outline-offset pointer-events fill stroke stroke-width'.split(' ');
    const listMarkerTypes = new Set('none disc circle square decimal decimal-leading-zero lower-alpha upper-alpha lower-latin upper-latin lower-roman upper-roman'.split(' '));
    function presentation(id) {
        const element = nodeOf(id);
        if (!element || element.nodeType !== 1) return '';
        const computed = element.ownerDocument.defaultView.getComputedStyle(element);
        const values = [];
        for (const property of presentationProperties) {
            const value = computed.getPropertyValue(property);
            if (!value || !safeValue(value) || /[\[\]]/.test(value)) continue;
            const words = value.replace(/#[a-f\d]+/gi, '').replace(/(?:\d*\.)?\d+(?:e[+-]?\d+)?(?:px|rem|em|vh|vw|deg|rad|turn|ms|s|fr|%)?/gi, '').match(/[a-z_][\w-]*/gi) || [];
            if (words.some((word) => !keywords.has(word.toLowerCase()))) continue;
            values.push(`${property}:${value}`);
        }
        // List styles can also contain literal text or application counter names.
        if ((computed.display === 'list-item' || element.matches('ul, ol, menu')) && listMarkerTypes.has(computed.listStyleType)) {
            values.push(`list-style-type:${computed.listStyleType}`);
        }
        return values.join(';') + ';font-family:system-ui,sans-serif';
    }

    const numeric = new Set(['width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'viewbox', 'points', 'colspan', 'rowspan', 'span', 'start', 'rr_width', 'rr_height', 'rr_scrollleft', 'rr_scrolltop']);
    const states = new Set(['checked', 'selected', 'disabled', 'multiple', 'hidden', 'open', 'readonly', 'required']);
    const types = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'text', 'password', 'email', 'number', 'search', 'range', 'date', 'hidden', 'file', 'tel', 'url', 'time', 'color']);
    const allowedAttributes = new Set([...numeric, ...states, '_csstext', 'class', 'id', 'style', 'd', 'transform', 'type', 'fill', 'stroke', 'color', 'value']);
    function attributes(values) {
        for (const name of Object.keys(values || {})) {
            const value = values[name];
            const lower = name.toLowerCase();
            if (layoutFidelity && publicAttributes.get(lower)?.includes(value)) continue;
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
        if (root.type === 3) root.textContent = parentTag === 'style' ? stylesheet(root.textContent) : maskedText(root.textContent, root.id);
        if (root.type === 2) {
            if (!tags.has(root.tagName)) root.tagName = 'div';
            delete root.isCustom;
            attributes(root.attributes);
            if (layoutFidelity) root.attributes.style = presentation(root.id);
            if (root.tagName === 'iframe') root.childNodes = [];
        }
        if ([4, 5].includes(root.type)) root.textContent = '';
        for (const child of root.childNodes || []) node(child, root.tagName);
    }

    return (event) => {
        if (event.type === 4) event.data.href = privatePageUrl(event.data.href, pagePaths);
        if (event.type === 2) node(event.data.node);
        if (event.type === 3) {
            const data = event.data;
            if (![0, 1, 2, 3, 4, 5, 6, 12].includes(data.source)) return false;
            if (data.source === 0) {
                for (const add of data.adds || []) node(add.node);
                for (const change of data.attributes || []) {
                    attributes(change.attributes);
                    if (layoutFidelity) change.attributes.style = presentation(change.id);
                }
                // A text mutation can target a stylesheet; its contents cannot be inferred from an rrweb id here.
                for (const change of data.texts || []) change.value = layoutFidelity ? maskedText(change.value, change.id) : '';
            }
            if (data.source === 5 && typeof data.text === 'string') data.text = '***';
        }
        if ([5, 6].includes(event.type)) return false;
        return true;
    };
}
