import {getProductsDatabase} from './firebase-config.js';
import {publicProducts,productPrice} from './productos.js';
const select=document.querySelector('[data-dispenser-product]'),summary=document.querySelector('[data-dispenser-summary]');
try{
  const {db,collection,getDocs}=await getProductsDatabase();
  const snapshot=await getDocs(collection(db,'productos'));
  const products=publicProducts(snapshot.docs.map(doc=>({id:doc.id,data:doc.data()}))).filter(product=>!product.agotado);
  select.replaceChildren(new Option('Selecciona una presentación',''),...products.map(product=>new Option(product.nombre,product.documentId)));
  select.disabled=!products.length;
  summary.textContent=products.length?'Selecciona para consultar precio y cantidad.':'No hay presentaciones disponibles.';
  select.addEventListener('change',()=>{const product=products.find(item=>item.documentId===select.value);summary.textContent=product?`${product.nombre} · ${product.cantidadMl??'Sin datos'} ml · ${productPrice(product)}. Disponibilidad de la máquina no confirmada.`:'';});
}catch{summary.textContent='No se pudo consultar el catálogo. Recarga para reintentar.';select.replaceChildren(new Option('Catálogo no disponible',''));}
