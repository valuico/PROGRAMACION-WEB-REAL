'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

const ESTADOS_ORDEN = ['pendiente', 'pagada', 'confirmada', 'enviada', 'entregada', 'cancelada'];

const ESTADO_COLORS = {
  pendiente:  { bg: '#fef3c7', color: '#92400e' },
  pagada:     { bg: '#d1fae5', color: '#065f46' },
  confirmada: { bg: '#dbeafe', color: '#1e40af' },
  enviada:    { bg: '#ede9fe', color: '#5b21b6' },
  entregada:  { bg: '#d1fae5', color: '#065f46' },
  cancelada:  { bg: '#fee2e2', color: '#991b1b' },
  simulada:   { bg: '#f3f4f6', color: '#6b7280' },
  admin:      { bg: '#2d2438', color: '#fff' },
  cliente:    { bg: '#ede9fe', color: '#5b21b6' },
};

const EMPTY_NUEVA_ORDEN = {
  nombre_cliente: '', email_cliente: '', estado: 'confirmada',
  usuario_id: '', items: [],
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  // Pedidos - expandir detalle
  const [expandedOrder, setExpandedOrder] = useState(null);
  // Pedidos - editar
  const [editingOrder, setEditingOrder] = useState(null); // { id, nombre_cliente, email_cliente, estado, items[] }
  // Nueva orden
  const [nuevaOrden, setNuevaOrden] = useState(EMPTY_NUEVA_ORDEN);
  const [showNuevaOrden, setShowNuevaOrden] = useState(false);
  // Agregar producto a orden (edición o nueva)
  const [addingProductTo, setAddingProductTo] = useState(null); // 'nueva' | orderId
  const [productoPicker, setProductoPicker] = useState({ producto_id: '', cantidad: 1, tono: '' });

  // Productos
  const [newProduct, setNewProduct] = useState({
    nombre: '', descripcion: '', descripcion_corta: '',
    precio: '', stock: '', categoria: 'cara', tipo: 'makeup', imagen_url: '',
  });

  // ── Auth check ──
  useEffect(() => {
    async function checkAuth() {
      if (!supabase) { router.push('/'); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: roleData } = await supabase.rpc('get_my_role');
      const isAdmin = roleData === 'admin' || session.user.email?.endsWith('@hazebeauty.com');
      if (!isAdmin) { router.push('/'); return; }
      setUser(session.user);
      setLoading(false);
      loadData();
    }
    checkAuth();
  }, []);

  async function loadData() {
    const [p, o, c] = await Promise.all([
      supabase.rpc('get_all_products'),
      supabase.rpc('get_all_orders'),
      supabase.rpc('get_all_clients'),
    ]);
    if (p.data) setProducts(p.data);
    if (o.data) setOrders(Array.isArray(o.data) ? o.data : []);
    if (c.data) setClients(c.data);
  }

  function notify(msg) {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  }

  // ── Productos ──
  async function saveProduct(product) {
    const { error } = await supabase.from('productos').update({
      nombre: product.nombre, precio: Number(product.precio),
      stock: Number(product.stock), categoria: product.categoria,
      tipo: product.tipo, imagen_url: product.imagen_url,
      descripcion_corta: product.descripcion_corta,
    }).eq('id', product.id);
    if (error) { notify('Error al guardar'); return; }
    notify('Producto guardado ✓');
  }

  async function toggleProductoActivo(product) {
    const nuevoEstado = product.activo === false ? true : false;
    const { error } = await supabase.from('productos').update({ activo: nuevoEstado }).eq('id', product.id);
    if (error) { notify('Error al cambiar estado'); return; }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, activo: nuevoEstado } : p));
    notify(nuevoEstado ? 'Producto activado ✓' : 'Producto desactivado');
  }

  async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) { notify('Error al eliminar'); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    notify('Producto eliminado');
  }

  async function createProduct() {
    const { nombre, precio, stock } = newProduct;
    if (!nombre || !precio || !stock) { setError('Completá nombre, precio y stock.'); return; }
    const { error } = await supabase.from('productos').insert([{
      ...newProduct, precio: Number(precio), stock: Number(stock),
    }]);
    if (error) { setError('Error al crear producto.'); return; }
    setError('');
    setNewProduct({ nombre: '', descripcion: '', descripcion_corta: '', precio: '', stock: '', categoria: 'cara', tipo: 'makeup', imagen_url: '' });
    notify('Producto creado ✓');
    const { data } = await supabase.rpc('get_all_products');
    if (data) setProducts(data);
  }

  // ── Pedidos - cambiar estado rápido ──
  async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase.from('ordenes').update({ estado: newStatus }).eq('id', orderId);
    if (error) { notify('Error al actualizar estado'); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado: newStatus } : o));
    notify('Estado actualizado ✓');
  }

  // ── Pedidos - abrir edición ──
  function openEditOrder(o) {
    setEditingOrder({
      id: o.id,
      nombre_cliente: o.nombre_cliente || '',
      email_cliente: o.email_cliente || '',
      estado: o.estado || 'pendiente',
      items: (o.orden_items || []).map(i => ({
        producto_id: i.producto_id,
        nombre_producto: i.nombre_producto,
        precio_unitario: Number(i.precio_unitario),
        cantidad: i.cantidad,
        tono_seleccionado: i.tono_seleccionado || '',
      })),
    });
    setSection('editar-orden');
  }

  // ── Pedidos - guardar edición ──
  async function saveEditOrder() {
    if (!editingOrder.items.length) { notify('Agregá al menos un producto'); return; }
    const { data, error } = await supabase.rpc('admin_actualizar_orden', {
      p_orden_id: editingOrder.id,
      p_nombre_cliente: editingOrder.nombre_cliente,
      p_email_cliente: editingOrder.email_cliente,
      p_estado: editingOrder.estado,
      p_items: editingOrder.items,
    });
    if (error || !data?.[0]?.success) {
      notify(data?.[0]?.error_msg || 'Error al guardar la orden');
      return;
    }
    notify('Orden actualizada ✓');
    const { data: refreshed } = await supabase.rpc('get_all_orders');
    if (refreshed) setOrders(Array.isArray(refreshed) ? refreshed : []);
    setSection('pedidos');
    setEditingOrder(null);
  }

  // ── Nueva orden - crear ──
  async function crearNuevaOrden() {
    if (!nuevaOrden.items.length) { notify('Agregá al menos un producto'); return; }
    if (!nuevaOrden.nombre_cliente && !nuevaOrden.email_cliente) {
      notify('Ingresá nombre o email del cliente'); return;
    }
    const { data, error } = await supabase.rpc('admin_crear_orden', {
      p_items: nuevaOrden.items,
      p_nombre_cliente: nuevaOrden.nombre_cliente,
      p_email_cliente: nuevaOrden.email_cliente,
      p_usuario_id: nuevaOrden.usuario_id || null,
      p_estado: nuevaOrden.estado,
    });
    if (error || !data?.[0]?.success) {
      notify(data?.[0]?.error_msg || 'Error al crear la orden');
      return;
    }
    notify('Orden creada ✓');
    setNuevaOrden(EMPTY_NUEVA_ORDEN);
    setShowNuevaOrden(false);
    const { data: refreshed } = await supabase.rpc('get_all_orders');
    if (refreshed) setOrders(Array.isArray(refreshed) ? refreshed : []);
    const { data: refreshedProducts } = await supabase.rpc('get_all_products');
    if (refreshedProducts) setProducts(refreshedProducts);
  }

  // ── Helpers para items ──
  function addItemToEdit() {
    const prod = products.find(p => p.id === Number(productoPicker.producto_id));
    if (!prod) { notify('Seleccioná un producto'); return; }
    const item = {
      producto_id: prod.id,
      nombre_producto: prod.nombre,
      precio_unitario: Number(prod.precio),
      cantidad: Number(productoPicker.cantidad) || 1,
      tono_seleccionado: productoPicker.tono || '',
    };
    if (addingProductTo === 'nueva') {
      setNuevaOrden(prev => ({ ...prev, items: [...prev.items, item] }));
    } else {
      setEditingOrder(prev => ({ ...prev, items: [...prev.items, item] }));
    }
    setProductoPicker({ producto_id: '', cantidad: 1, tono: '' });
    setAddingProductTo(null);
  }

  function removeItem(source, idx) {
    if (source === 'nueva') {
      setNuevaOrden(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    } else {
      setEditingOrder(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    }
  }

  function calcTotal(items) {
    return items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
  }

  // ── Clientes ──
  async function toggleRole(client) {
    const newRole = client.role === 'admin' ? 'cliente' : 'admin';
    const { error } = await supabase.from('usuarios').update({ role: newRole }).eq('id', client.id);
    if (error) { notify('Error al cambiar rol'); return; }
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, role: newRole } : c));
    notify(`Rol cambiado a ${newRole} ✓`);
  }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f9fafb' }}>
        <p style={{ color:'#6b7280' }}>Verificando acceso…</p>
      </div>
    );
  }

  const totalVentas = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const selectedProduct = products.find(p => p.id === Number(productoPicker.producto_id));
  const tonesAvailable = selectedProduct?.tonos || [];

  return (
    <div style={s.shell}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <span style={s.brandName}>HAZE</span>
          <span style={s.brandSub}>Admin</span>
        </div>
        <nav style={s.nav}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '◈' },
            { id: 'productos', label: 'Productos',  icon: '◇' },
            { id: 'pedidos',   label: 'Pedidos',    icon: '◻' },
            { id: 'clientes',  label: 'Clientes',   icon: '○' },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => { setSection(id); setEditingOrder(null); setShowNuevaOrden(false); }}
              style={{ ...s.navItem, ...(['dashboard','productos','pedidos','clientes'].includes(section) && section === id ? s.navActive : section === 'editar-orden' && id === 'pedidos' ? s.navActive : {}) }}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <span style={s.userEmail}>{user?.email}</span>
          <button onClick={() => router.push('/')} style={s.backBtn}>← Volver a la tienda</button>
        </div>
      </aside>

      {/* Contenido */}
      <main style={s.content}>

        {/* DASHBOARD */}
        {section === 'dashboard' && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.pageTitle}>Dashboard</h2>
              <p style={s.pageSub}>Resumen general del negocio</p>
            </div>
            <div style={s.kpiGrid}>
              {[
                { label: 'VENTAS TOTALES', value: `$${totalVentas.toLocaleString('es-AR')}` },
                { label: 'PEDIDOS',        value: orders.length },
                { label: 'PRODUCTOS',      value: products.length },
                { label: 'CLIENTES',       value: clients.length },
              ].map(({ label, value }) => (
                <div key={label} style={s.kpi}>
                  <span style={s.kpiLabel}>{label}</span>
                  <span style={s.kpiValue}>{value}</span>
                </div>
              ))}
            </div>
            <p style={s.sectionTitle}>PEDIDOS RECIENTES</p>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{['#','Cliente','Total','Estado','Fecha'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {orders.slice(0,8).map(o=>(
                    <tr key={o.id}>
                      <td style={s.tdMuted}>#{o.id}</td>
                      <td style={s.td}>{o.email_cliente||'—'}</td>
                      <td style={s.td}>${Number(o.total).toLocaleString('es-AR')}</td>
                      <td style={s.td}><Badge estado={o.estado}/></td>
                      <td style={s.tdMuted}>{o.creado_en?new Date(o.creado_en).toLocaleDateString('es-AR'):'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTOS */}
        {section === 'productos' && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.pageTitle}>Productos</h2>
              <p style={s.pageSub}>Editá precios, stock y creá nuevos productos</p>
            </div>
            {error && <p style={s.errorMsg}>{error}</p>}
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{['Estado','Nombre','Precio','Stock','Categoría','Tipo','Acciones'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {products.map(p=>(
                    <tr key={p.id} style={p.activo===false?{opacity:0.5}:{}}>
                      <td style={s.td}>
                        <button
                          onClick={()=>toggleProductoActivo(p)}
                          style={{
                            ...p.activo!==false ? s.btnSave : s.btnDelete,
                            fontSize:'0.75rem', padding:'4px 10px'
                          }}
                        >
                          {p.activo!==false ? '✓ Activo' : '✗ Inactivo'}
                        </button>
                      </td>
                      <td style={s.td}><input style={s.input} value={p.nombre||''} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,nombre:e.target.value}:x))}/></td>
                      <td style={s.td}><input style={{...s.input,width:'80px'}} type="number" value={p.precio??''} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,precio:e.target.value}:x))}/></td>
                      <td style={s.td}><input style={{...s.input,width:'60px'}} type="number" value={p.stock??''} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,stock:e.target.value}:x))}/></td>
                      <td style={s.td}><input style={{...s.input,width:'90px'}} value={p.categoria||''} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,categoria:e.target.value}:x))}/></td>
                      <td style={s.td}><input style={{...s.input,width:'80px'}} value={p.tipo||''} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,tipo:e.target.value}:x))}/></td>
                      <td style={s.td}>
                        <button onClick={()=>saveProduct(p)} style={s.btnSave}>Guardar</button>
                        <button onClick={()=>deleteProduct(p.id)} style={s.btnDelete}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={s.formSection}>
              <p style={s.sectionTitle}>AGREGAR PRODUCTO</p>
              <div style={s.formGrid}>
                {[
                  {label:'Nombre *',field:'nombre',type:'text'},
                  {label:'Precio *',field:'precio',type:'number'},
                  {label:'Stock *',field:'stock',type:'number'},
                  {label:'Categoría',field:'categoria',type:'text'},
                  {label:'Tipo',field:'tipo',type:'text'},
                  {label:'URL imagen',field:'imagen_url',type:'text'},
                  {label:'Descripción corta',field:'descripcion_corta',type:'text'},
                ].map(({label,field,type})=>(
                  <label key={field} style={s.formLabel}>
                    {label}
                    <input style={s.input} type={type} value={newProduct[field]}
                      onChange={e=>setNewProduct(prev=>({...prev,[field]:e.target.value}))}/>
                  </label>
                ))}
              </div>
              <button onClick={createProduct} style={s.btnPrimary}>Crear producto</button>
            </div>
          </div>
        )}

        {/* PEDIDOS */}
        {section === 'pedidos' && (
          <div>
            <div style={{...s.pageHeader, display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <h2 style={s.pageTitle}>Pedidos</h2>
                <p style={s.pageSub}>{orders.length} pedidos en total</p>
              </div>
              <button onClick={()=>setShowNuevaOrden(v=>!v)} style={s.btnPrimary}>
                {showNuevaOrden ? '✕ Cancelar' : '+ Nueva orden'}
              </button>
            </div>

            {/* FORMULARIO NUEVA ORDEN */}
            {showNuevaOrden && (
              <div style={s.editPanel}>
                <h3 style={s.editTitle}>Nueva orden</h3>

                {/* Selector de cliente existente */}
                <div style={s.formGrid}>
                  <label style={s.formLabel}>
                    Cliente registrado (opcional)
                    <select style={s.select} value={nuevaOrden.usuario_id}
                      onChange={e => {
                        const c = clients.find(x => x.id === e.target.value);
                        setNuevaOrden(prev => ({
                          ...prev,
                          usuario_id: e.target.value,
                          nombre_cliente: c?.nombre || prev.nombre_cliente,
                          email_cliente: c?.email || prev.email_cliente,
                        }));
                      }}>
                      <option value="">— Ingresar manualmente —</option>
                      {clients.map(c=>(
                        <option key={c.id} value={c.id}>{c.email} {c.nombre ? `(${c.nombre})` : ''}</option>
                      ))}
                    </select>
                  </label>
                  <label style={s.formLabel}>
                    Nombre cliente
                    <input style={s.input} value={nuevaOrden.nombre_cliente}
                      onChange={e=>setNuevaOrden(prev=>({...prev,nombre_cliente:e.target.value}))}/>
                  </label>
                  <label style={s.formLabel}>
                    Email cliente
                    <input style={s.input} value={nuevaOrden.email_cliente}
                      onChange={e=>setNuevaOrden(prev=>({...prev,email_cliente:e.target.value}))}/>
                  </label>
                  <label style={s.formLabel}>
                    Estado inicial
                    <select style={s.select} value={nuevaOrden.estado}
                      onChange={e=>setNuevaOrden(prev=>({...prev,estado:e.target.value}))}>
                      {ESTADOS_ORDEN.map(est=><option key={est} value={est}>{est}</option>)}
                    </select>
                  </label>
                </div>

                {/* Items */}
                <p style={{...s.sectionTitle, marginTop:'1rem'}}>PRODUCTOS DE LA ORDEN</p>
                {nuevaOrden.items.map((item,idx)=>(
                  <div key={idx} style={s.itemEditRow}>
                    <span style={{flex:1,fontWeight:'500'}}>{item.nombre_producto}</span>
                    {item.tono_seleccionado && <span style={s.itemTonoBadge}>{item.tono_seleccionado}</span>}
                    <span style={s.itemCantBadge}>x{item.cantidad}</span>
                    <span style={s.itemPrecioBadge}>${(item.precio_unitario*item.cantidad).toLocaleString('es-AR')}</span>
                    <button onClick={()=>removeItem('nueva',idx)} style={s.btnRemoveItem}>✕</button>
                  </div>
                ))}
                {nuevaOrden.items.length > 0 && (
                  <div style={s.totalRow}>
                    <span>Total</span>
                    <strong>${calcTotal(nuevaOrden.items).toLocaleString('es-AR')}</strong>
                  </div>
                )}

                <ProductPicker
                  products={products}
                  productoPicker={productoPicker}
                  setProductoPicker={setProductoPicker}
                  tonesAvailable={tonesAvailable}
                  onAdd={()=>{ setAddingProductTo('nueva'); addItemToEdit(); }}
                  styles={s}
                />

                <div style={{display:'flex',gap:'0.75rem',marginTop:'1rem'}}>
                  <button onClick={crearNuevaOrden} style={s.btnPrimary}>Crear orden</button>
                  <button onClick={()=>setShowNuevaOrden(false)} style={s.btnSecondary}>Cancelar</button>
                </div>
              </div>
            )}

            {/* TABLA DE PEDIDOS */}
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{['#','Cliente','Total','Items','Estado','Fecha','Acciones'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {orders.map(o=>(
                    <OrderRow
                      key={o.id}
                      o={o}
                      expanded={expandedOrder===o.id}
                      onToggle={()=>setExpandedOrder(expandedOrder===o.id?null:o.id)}
                      onStatusChange={updateOrderStatus}
                      onEdit={()=>openEditOrder(o)}
                      styles={s}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EDITAR ORDEN */}
        {section === 'editar-orden' && editingOrder && (
          <div>
            <div style={s.pageHeader}>
              <button onClick={()=>{setSection('pedidos');setEditingOrder(null);}} style={{...s.backBtn,color:'#6b7280',marginBottom:'0.5rem',display:'block'}}>← Volver a pedidos</button>
              <h2 style={s.pageTitle}>Editar orden #{editingOrder.id}</h2>
            </div>

            <div style={s.editPanel}>
              <h3 style={s.editTitle}>Datos del cliente</h3>
              <div style={s.formGrid}>
                <label style={s.formLabel}>
                  Nombre
                  <input style={s.input} value={editingOrder.nombre_cliente}
                    onChange={e=>setEditingOrder(prev=>({...prev,nombre_cliente:e.target.value}))}/>
                </label>
                <label style={s.formLabel}>
                  Email
                  <input style={s.input} value={editingOrder.email_cliente}
                    onChange={e=>setEditingOrder(prev=>({...prev,email_cliente:e.target.value}))}/>
                </label>
                <label style={s.formLabel}>
                  Estado
                  <select style={s.select} value={editingOrder.estado}
                    onChange={e=>setEditingOrder(prev=>({...prev,estado:e.target.value}))}>
                    {ESTADOS_ORDEN.map(est=><option key={est} value={est}>{est}</option>)}
                  </select>
                </label>
              </div>

              <h3 style={{...s.editTitle, marginTop:'1.5rem'}}>Productos</h3>
              {editingOrder.items.map((item,idx)=>(
                <div key={idx} style={s.itemEditRow}>
                  <span style={{flex:1,fontWeight:'500'}}>{item.nombre_producto}</span>
                  {item.tono_seleccionado && <span style={s.itemTonoBadge}>{item.tono_seleccionado}</span>}
                  <input type="number" min="1" value={item.cantidad}
                    onChange={e=>setEditingOrder(prev=>({...prev,items:prev.items.map((x,i)=>i===idx?{...x,cantidad:Number(e.target.value)}:x)}))}
                    style={{...s.input,width:'60px'}}/>
                  <span style={s.itemPrecioBadge}>${(item.precio_unitario*item.cantidad).toLocaleString('es-AR')}</span>
                  <button onClick={()=>removeItem('edit',idx)} style={s.btnRemoveItem}>✕</button>
                </div>
              ))}
              {editingOrder.items.length > 0 && (
                <div style={s.totalRow}>
                  <span>Total estimado</span>
                  <strong>${calcTotal(editingOrder.items).toLocaleString('es-AR')}</strong>
                </div>
              )}

              <ProductPicker
                products={products}
                productoPicker={productoPicker}
                setProductoPicker={setProductoPicker}
                tonesAvailable={tonesAvailable}
                onAdd={()=>{ setAddingProductTo(editingOrder.id); addItemToEdit(); }}
                styles={s}
              />

              <div style={{display:'flex',gap:'0.75rem',marginTop:'1.5rem'}}>
                <button onClick={saveEditOrder} style={s.btnPrimary}>Guardar cambios</button>
                <button onClick={()=>{setSection('pedidos');setEditingOrder(null);}} style={s.btnSecondary}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* CLIENTES */}
        {section === 'clientes' && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.pageTitle}>Clientes</h2>
              <p style={s.pageSub}>{clients.length} usuarios registrados</p>
            </div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{['Email','Nombre','Rol','Registro','Acción'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {clients.map(c=>(
                    <tr key={c.id}>
                      <td style={s.td}>{c.email||'—'}</td>
                      <td style={s.td}>{c.nombre||'—'}</td>
                      <td style={s.td}><Badge estado={c.role==='admin'?'admin':'cliente'}/></td>
                      <td style={s.tdMuted}>{c.creado_en?new Date(c.creado_en).toLocaleDateString('es-AR'):'—'}</td>
                      <td style={s.td}>
                        {c.email!==user?.email&&(
                          <button onClick={()=>toggleRole(c)} style={c.role==='admin'?s.btnDelete:s.btnSave}>
                            {c.role==='admin'?'Quitar admin':'Hacer admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {clients.length===0&&(
                    <tr><td colSpan={5} style={{...s.tdMuted,textAlign:'center',padding:'2rem'}}>No hay clientes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Toasts */}
      <div style={s.toasts}>
        {notifications.map(n=>(
          <div key={n.id} style={s.toast}>{n.msg}</div>
        ))}
      </div>
    </div>
  );
}

// ── Componente selector de producto ──
function ProductPicker({ products, productoPicker, setProductoPicker, tonesAvailable, onAdd, styles: s }) {
  return (
    <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'1rem', marginTop:'0.75rem' }}>
      <p style={{ margin:'0 0 0.75rem', fontSize:'0.8rem', fontWeight:'600', color:'#374151' }}>AGREGAR PRODUCTO</p>
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'flex-end' }}>
        <label style={s.formLabel}>
          Producto
          <select style={s.select} value={productoPicker.producto_id}
            onChange={e=>setProductoPicker(prev=>({...prev,producto_id:e.target.value,tono:''}))}>
            <option value="">— Seleccionar —</option>
            {products.map(p=>(
              <option key={p.id} value={p.id}>{p.nombre} (${Number(p.precio).toLocaleString('es-AR')}) — Stock: {p.stock}</option>
            ))}
          </select>
        </label>
        <label style={s.formLabel}>
          Cantidad
          <input style={{...s.input,width:'60px'}} type="number" min="1" value={productoPicker.cantidad}
            onChange={e=>setProductoPicker(prev=>({...prev,cantidad:Number(e.target.value)}))}/>
        </label>
        {tonesAvailable.length > 0 && (
          <label style={s.formLabel}>
            Tono
            <select style={s.select} value={productoPicker.tono}
              onChange={e=>setProductoPicker(prev=>({...prev,tono:e.target.value}))}>
              <option value="">— Sin tono —</option>
              {tonesAvailable.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        )}
        <button onClick={onAdd} style={s.btnSave}>+ Agregar</button>
      </div>
    </div>
  );
}

// ── Componente fila de orden ──
function OrderRow({ o, expanded, onToggle, onStatusChange, onEdit, styles: s }) {
  return (
    <>
      <tr>
        <td style={s.tdMuted}>#{o.id}</td>
        <td style={s.td}>{o.email_cliente||'—'}</td>
        <td style={s.td}>${Number(o.total).toLocaleString('es-AR')}</td>
        <td style={s.tdMuted}>{o.orden_items?.length??0} items</td>
        <td style={s.td}>
          <select value={o.estado||'pendiente'} onChange={e=>onStatusChange(o.id,e.target.value)} style={s.select}>
            {ESTADOS_ORDEN.map(est=>(
              <option key={est} value={est}>{est.charAt(0).toUpperCase()+est.slice(1)}</option>
            ))}
          </select>
        </td>
        <td style={s.tdMuted}>{o.creado_en?new Date(o.creado_en).toLocaleDateString('es-AR'):'—'}</td>
        <td style={s.td}>
          <button onClick={onToggle} style={s.btnDetail}>{expanded?'▲ Ocultar':'▼ Items'}</button>
          <button onClick={onEdit} style={{...s.btnSave,marginLeft:'6px'}}>✏️ Editar</button>
        </td>
      </tr>
      {expanded && o.orden_items?.length>0 && (
        <tr>
          <td colSpan={7} style={{padding:0}}>
            <div style={s.itemsBox}>
              {o.orden_items.map(item=>(
                <div key={item.id} style={s.itemRow}>
                  <span style={{flex:1,fontWeight:'500'}}>{item.nombre_producto}</span>
                  {item.tono_seleccionado&&<span style={{color:'#9ca3af',fontSize:'0.8rem'}}>Tono: {item.tono_seleccionado}</span>}
                  <span style={{color:'#6b7280',minWidth:'30px'}}>x{item.cantidad}</span>
                  <span style={{fontWeight:'600',minWidth:'90px',textAlign:'right'}}>${Number(item.precio_unitario).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Badge({ estado }) {
  const c = ESTADO_COLORS[estado] || { bg:'#f3f4f6', color:'#374151' };
  return (
    <span style={{ background:c.bg, color:c.color, padding:'3px 10px', borderRadius:'999px', fontSize:'0.72rem', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>
      {estado}
    </span>
  );
}

const s = {
  shell:          { display:'flex', minHeight:'100vh', fontFamily:'system-ui,sans-serif', background:'#f9fafb' },
  sidebar:        { width:'200px', background:'#2d2438', display:'flex', flexDirection:'column', padding:'1.5rem 0', flexShrink:0, position:'sticky', top:0, height:'100vh' },
  brand:          { padding:'0 1.5rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:'0.5rem' },
  brandName:      { display:'block', color:'#fff', fontWeight:'700', fontSize:'1.1rem', letterSpacing:'0.15em' },
  brandSub:       { display:'block', color:'#a78bfa', fontSize:'0.7rem', letterSpacing:'0.2em', textTransform:'uppercase', marginTop:'2px' },
  nav:            { flex:1, display:'flex', flexDirection:'column', gap:'2px', padding:'0.5rem 0' },
  navItem:        { display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.65rem 1.5rem', background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:'0.875rem', textAlign:'left' },
  navActive:      { background:'rgba(167,139,250,0.15)', color:'#fff' },
  sidebarFooter:  { padding:'1rem 1.5rem', borderTop:'1px solid rgba(255,255,255,0.1)' },
  userEmail:      { display:'block', color:'rgba(255,255,255,0.45)', fontSize:'0.7rem', marginBottom:'0.5rem', wordBreak:'break-all' },
  backBtn:        { background:'none', border:'none', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:'0.75rem', padding:0 },
  content:        { flex:1, padding:'2rem', overflowY:'auto' },
  pageHeader:     { marginBottom:'1.5rem' },
  pageTitle:      { fontSize:'1.75rem', fontWeight:'700', color:'#111827', margin:0 },
  pageSub:        { color:'#6b7280', margin:'0.25rem 0 0', fontSize:'0.9rem' },
  kpiGrid:        { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'2rem' },
  kpi:            { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'1.25rem 1.5rem' },
  kpiLabel:       { display:'block', fontSize:'0.68rem', letterSpacing:'0.1em', color:'#9ca3af', fontWeight:'600' },
  kpiValue:       { display:'block', fontSize:'1.6rem', fontWeight:'700', color:'#111827', marginTop:'0.4rem' },
  sectionTitle:   { fontSize:'0.72rem', letterSpacing:'0.1em', color:'#9ca3af', fontWeight:'600', marginBottom:'0.75rem', textTransform:'uppercase' },
  tableWrap:      { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', overflow:'auto', marginBottom:'2rem' },
  table:          { width:'100%', borderCollapse:'collapse' },
  th:             { padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.68rem', letterSpacing:'0.1em', color:'#9ca3af', fontWeight:'600', borderBottom:'1px solid #f3f4f6', whiteSpace:'nowrap' },
  td:             { padding:'0.75rem 1rem', fontSize:'0.875rem', color:'#374151', borderBottom:'1px solid #f9fafb' },
  tdMuted:        { padding:'0.75rem 1rem', fontSize:'0.875rem', color:'#9ca3af', borderBottom:'1px solid #f9fafb' },
  input:          { border:'1px solid #e5e7eb', borderRadius:'4px', padding:'4px 8px', fontSize:'0.85rem', width:'100%', outline:'none', boxSizing:'border-box' },
  select:         { border:'1px solid #e5e7eb', borderRadius:'4px', padding:'4px 8px', fontSize:'0.85rem', background:'#fff', cursor:'pointer' },
  btnSave:        { background:'#2d2438', color:'#fff', border:'none', borderRadius:'4px', padding:'5px 12px', fontSize:'0.8rem', cursor:'pointer', marginRight:'6px' },
  btnDelete:      { background:'#fee2e2', color:'#991b1b', border:'none', borderRadius:'4px', padding:'5px 12px', fontSize:'0.8rem', cursor:'pointer' },
  btnDetail:      { background:'#f3f4f6', color:'#374151', border:'none', borderRadius:'4px', padding:'4px 10px', fontSize:'0.8rem', cursor:'pointer', whiteSpace:'nowrap' },
  btnPrimary:     { background:'#2d2438', color:'#fff', border:'none', borderRadius:'6px', padding:'0.6rem 1.5rem', fontSize:'0.9rem', cursor:'pointer' },
  btnSecondary:   { background:'#f3f4f6', color:'#374151', border:'none', borderRadius:'6px', padding:'0.6rem 1.5rem', fontSize:'0.9rem', cursor:'pointer' },
  btnRemoveItem:  { background:'#fee2e2', color:'#991b1b', border:'none', borderRadius:'4px', padding:'4px 8px', fontSize:'0.8rem', cursor:'pointer' },
  formSection:    { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'1.5rem' },
  formGrid:       { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1rem' },
  formLabel:      { display:'flex', flexDirection:'column', gap:'4px', fontSize:'0.8rem', color:'#374151', fontWeight:'500' },
  errorMsg:       { color:'#dc2626', fontSize:'0.875rem', marginBottom:'1rem' },
  editPanel:      { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem' },
  editTitle:      { fontSize:'1rem', fontWeight:'600', color:'#111827', margin:'0 0 1rem' },
  itemEditRow:    { display:'flex', alignItems:'center', gap:'1rem', padding:'0.5rem 0', borderBottom:'1px solid #f3f4f6', fontSize:'0.875rem' },
  itemTonoBadge:  { background:'#f3f4f6', color:'#6b7280', padding:'2px 8px', borderRadius:'4px', fontSize:'0.75rem' },
  itemCantBadge:  { color:'#6b7280', minWidth:'30px' },
  itemPrecioBadge:{ fontWeight:'600', minWidth:'90px', textAlign:'right' },
  totalRow:       { display:'flex', justifyContent:'space-between', padding:'0.75rem 0', borderTop:'2px solid #f3f4f6', marginTop:'0.5rem', fontWeight:'600' },
  itemsBox:       { background:'#fafafa', borderTop:'1px solid #f3f4f6', padding:'0.75rem 1.5rem' },
  itemRow:        { display:'flex', alignItems:'center', gap:'1.5rem', padding:'0.4rem 0', borderBottom:'1px solid #f3f4f6', fontSize:'0.875rem', color:'#374151' },
  toasts:         { position:'fixed', bottom:'1.5rem', right:'1.5rem', display:'flex', flexDirection:'column', gap:'0.5rem', zIndex:9999 },
  toast:          { background:'#2d2438', color:'#fff', padding:'0.6rem 1.2rem', borderRadius:'8px', fontSize:'0.875rem', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' },
};
