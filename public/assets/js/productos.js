import { getProductsDatabase } from './firebase-config.js';

const scalar = value => ['string', 'number', 'boolean'].includes(typeof value) ? String(value).trim() : '';
const numeric = value => {
  if (!['string', 'number'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return null;
  if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const historicalBoolean = (value, fallback) => {
  if ([true, 1, '1', 'true'].includes(value)) return true;
  if ([false, 0, '0', 'false'].includes(value)) return false;
  return fallback;
};

// Mismos defaults históricos que normalizeProduct() PHP; no modifica documentos.
export function normalizeProduct(record, documentId = '') {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const amount = numeric(record.cantidadMl);
  const order = numeric(record.opcion);
  return {
    id: scalar(record.productoId) || scalar(record._id) || scalar(documentId),
    documentId: scalar(documentId),
    nombre: scalar(record.nombre) || 'Sin datos',
    descripcion: scalar(record.descripcion),
    precio: numeric(record.precio),
    cantidadMl: amount === null ? null : Math.trunc(amount),
    opcion: order === null ? null : Math.trunc(order),
    imagen: scalar(record.imagen),
    activo: historicalBoolean(record.activo, true),
    agotado: historicalBoolean(record.agotado, false),
    esGratis: historicalBoolean(record.esGratis, false),
  };
}

export function publicProducts(documents) {
  return documents.map(doc => normalizeProduct(doc.data, doc.id)).filter(product => product?.activo)
    .sort((a, b) => {
      if (a.opcion !== b.opcion) {
        if (a.opcion === null) return 1;
        if (b.opcion === null) return -1;
        return a.opcion - b.opcion;
      }
      const left = a.documentId || a.id;
      const right = b.documentId || b.id;
      return left < right ? -1 : left > right ? 1 : 0;
    });
}

// Solo recursos locales copiados; no URLs remotas, traversal ni nombres arbitrarios.
const productImages = new Set(['1000ml.png', '750ml.png', '500ml.png', '250ml.png', '150ml.png', '45ml.png']);
const beverageImages = new Set(['garapiña.png', 'linaza.png', 'mocochinchi.png', 'cebada.png']);
export function productImage(value) {
  const path = scalar(value).replaceAll('\\', '/').replace(/^\/+/, '');
  const match = /^(?:assets\/img\/productos\/|assets\/productos\/)([^/]+)$/.exec(path);
  if (match && productImages.has(match[1])) return `assets/img/productos/${match[1]}`;
  const beverage = /^(?:assets\/img\/|assets\/)([^/]+)$/.exec(path);
  return beverage && beverageImages.has(beverage[1]) ? `assets/img/${beverage[1]}` : '';
}

export function productPrice(product) {
  if (product.esGratis) return 'Gratis'; // Igual que la vista PHP, incluso en datos históricos discordantes.
  return product.precio === null ? 'Precio no disponible' : `Bs ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(product.precio)}`;
}

export function renderProducts(container, products) {
  const doc = container.ownerDocument;
  const element = (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const fragment = doc.createDocumentFragment();
  products.forEach((product, index) => {
    const card = element('article', 'catalog-card');
    const media = element('div', 'catalog-card__image');
    media.append(element('span', '', String(index + 1).padStart(2, '0')));
    const missingImage = () => {
      media.classList.add('catalog-card__image--missing');
      const label = element('p', '', 'Imagen no disponible');
      label.setAttribute('role', 'img');
      label.setAttribute('aria-label', 'Imagen no disponible');
      media.append(label);
    };
    const imagePath = productImage(product.imagen);
    if (imagePath) {
      const image = element('img');
      image.alt = product.nombre;
      image.loading = 'lazy';
      image.addEventListener('error', () => { image.remove(); missingImage(); }, { once: true });
      image.src = imagePath;
      media.append(image);
    } else missingImage();
    const content = element('div');
    content.append(element('small', '', product.cantidadMl === null ? 'Presentación no disponible' : `${product.cantidadMl} ml`),
      element('h2', '', product.nombre), element('p', '', product.descripcion));
    const meta = element('div', 'data-card__meta');
    meta.append(element('b', '', productPrice(product)), element('span', '', product.agotado ? 'Agotado' : 'Disponible'));
    content.append(meta);
    card.append(media, content);
    fragment.append(card);
  });
  container.replaceChildren(fragment);
}

export async function loadProducts(root, read = readFirestoreProducts) {
  const status = root.querySelector('[data-products-status]');
  const grid = root.querySelector('[data-products-grid]');
  root.setAttribute('aria-busy', 'true');
  root.dataset.state = 'loading';
  status.hidden = false;
  status.textContent = 'Cargando productos…';
  grid.replaceChildren();
  try {
    const products = publicProducts(await read());
    renderProducts(grid, products);
    root.dataset.state = products.length ? 'ready' : 'empty';
    status.textContent = products.length ? `${products.length} productos disponibles en el catálogo.` : 'No hay productos activos para mostrar en este momento.';
  } catch (error) {
    root.dataset.state = 'error';
    if (error?.code === 'configuration-missing') {
      status.textContent = 'El catálogo está pendiente de conexión. Todavía no podemos mostrar productos reales.';
    } else if (error?.code === 'permission-denied') {
      status.textContent = 'El catálogo no está disponible para consulta pública en este momento. Inténtalo más tarde.';
    } else status.textContent = 'No se pudo cargar el catálogo. Comprueba tu conexión y recarga la página.';
    // Solo códigos conocidos, sin payload, configuración ni stack traces.
    const safeCodes = ['configuration-missing', 'permission-denied', 'unavailable', 'deadline-exceeded'];
    console.warn('Catálogo:', safeCodes.includes(error?.code) ? error.code : 'load-failed');
  } finally {
    root.setAttribute('aria-busy', 'false');
  }
}

async function readFirestoreProducts() {
  const { db, collection, getDocs } = await getProductsDatabase();
  const snapshot = await getDocs(collection(db, 'productos'));
  return snapshot.docs.map(document => ({ id: document.id, data: document.data() }));
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-products]');
  if (root) loadProducts(root);
}
