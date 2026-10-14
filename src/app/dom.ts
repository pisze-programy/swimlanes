/** DOM helpers with generics instead of type assertions. */

export function requireElement<E extends Element>(selector: string): E {
  const element = document.querySelector<E>(selector);
  if (element === null) {
    throw new Error("Missing element: " + selector);
  }
  return element;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className.length > 0) {
    element.className = className;
  }
  return element;
}
