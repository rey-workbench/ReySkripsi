export class DOMService {
    public static getOrCreateElement(id: string, className: string, innerHTML: string = ''): HTMLElement {
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.className = className;
            if (innerHTML) el.innerHTML = innerHTML;
            document.body.appendChild(el);
        }
        return el;
    }
}
