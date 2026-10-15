const money=n=>'₱'+Number(n||0).toLocaleString('en-PH', {
  minimumFractionDigits:2,maximumFractionDigits:2
});
const dateShort=d=>new Date(d).toLocaleDateString('en-PH', {
  month:'short',day:'numeric',year:'numeric'
});
const dateTime=d=>new Date(d).toLocaleString('en-PH', {
  month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'
});
const uid=prefix=>prefix+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
const defaultProducts=[
  {id:'P001',name:'Deformed Bars',category:'Steel',sku:'STL-001',price:250,stock:48,reorder:15,unit:'piece',image:'images/deformed-bars.jpg',emoji:'🏗️'},
  {id:'P002',name:'Angle Bar',category:'Steel',sku:'STL-002',price:180,stock:120,reorder:25,unit:'piece',image:'images/angle-bar.jpg',emoji:'🏗️'},
  {id:'P003',name:'Marine Plywood Local',category:'Plywood',sku:'PLY-001',price:650,stock:35,reorder:10,unit:'sheet',image:'images/marine-plywood.jpg',emoji:'🪵'},
  {id:'P004',name:'White Sand',category:'Aggregates',sku:'AGG-001',price:950,stock:25,reorder:8,unit:'cubic meter',image:'images/white-sand.jpg',emoji:'⛰️'},
  {id:'P005',name:'Gravel 3/4',category:'Aggregates',sku:'AGG-002',price:1100,stock:30,reorder:8,unit:'cubic meter',image:'images/gravel.jpg',emoji:'🪨'},
  {id:'P006',name:'Concrete Hollow Block',category:'Masonry',sku:'MAS-001',price:18,stock:320,reorder:80,unit:'piece',image:'images/concrete-hollow-block.jpg',emoji:'🧱'},
  {id:'P007',name:'Apo Galfan Corrugated Sheet',category:'Roofing',sku:'ROF-001',price:395,stock:40,reorder:10,unit:'sheet',image:'images/apo-galfan-corrugated-sheet.jpg',emoji:'🏠'}
];
const sampleOrders=[ {
  id:'ORD-1028',customer:'Maria Santos',contact:'0917 234 5678',type:'Pickup',address:'',items:[ {
    productId:'P001',name:'Deformed Bars',price:250,qty:10
  }, {
    productId:'P002',name:'Angle Bar',price:180,qty:2
  }],total:2840,status:'Pending',created:new Date(Date.now()-1000*60*35).toISOString()
}, {
  id:'ORD-1027',customer:'Ramon Dela Cruz',contact:'0928 111 0202',type:'Delivery',address:'Bagtas, Tanza, Cavite',items:[ {
    productId:'P006',name:'Concrete Hollow Block',price:18,qty:100
  }],total:1800,status:'Confirmed',created:new Date(Date.now()-1000*60*60*4).toISOString()
}, {
  id:'ORD-1026',customer:'Ana Reyes',contact:'0998 700 2221',type:'Pickup',address:'',items:[ {
    productId:'P003',name:'Marine Plywood Local',price:650,qty:8
  }, {
    productId:'P004',name:'White Sand',price:950,qty:5
  }],total:844,status:'Completed',created:new Date(Date.now()-1000*60*60*26).toISOString()
}, {
  id:'ORD-1025',customer:'BuildRight Contractors',contact:'0915 222 9800',type:'Delivery',address:'Tanza, Cavite',items:[ {
    productId:'P007',name:'Apo Galfan Corrugated Sheet',price:395,qty:12
  }],total:4740,status:'Out for delivery',created:new Date(Date.now()-1000*60*60*40).toISOString()
}, {
  id:'ORD-1024',customer:'Joel Mendoza',contact:'0906 333 8888',type:'Pickup',address:'',items:[ {
    productId:'P005',name:'Gravel 3/4',price:1100,qty:2
  }],total:370,status:'Cancelled',created:new Date(Date.now()-1000*60*60*72).toISOString()
} ];
let products=JSON.parse(JSON.stringify(defaultProducts)),orders=JSON.parse(JSON.stringify(sampleOrders)),history=[ {
  time:new Date(Date.now()-1000*60*18).toISOString(),action:'Inventory reviewed',detail:'Admin opened the inventory page',type:'Inventory'
}, {
  time:new Date(Date.now()-1000*60*55).toISOString(),action:'Order status updated',detail:'ORD-1027 marked Confirmed',type:'Order'
}, {
  time:new Date(Date.now()-1000*60*120).toISOString(),action:'Signed in',detail:'Admin entered the store workspace',type:'Account'
} ],cart= {
},activePage='dashboard',activeCategory='All',modalCallback=null;
function toast(message,type='success') {
  const el=document.createElement('div');
  el.className='toast '+type;
  el.textContent=message;
  document.getElementById('toastRegion').appendChild(el);
  setTimeout(()=>el.remove(),3400)
}
function logAction(action,detail,type='System') {
  history.unshift( {
    time:new Date().toISOString(),action,detail,type
  })
}
function statusClass(s) {
  return s==='Completed'||s==='Confirmed'||s==='Ready for pickup'?'b-green':s==='Pending'?'b-amber':s==='Cancelled'||s==='Out of Stock'?'b-red':s==='Out for delivery'?'b-blue':'b-gray'
}
function statusBadge(s) {
  return `<span class="badge ${statusClass(s)}">${esc(s)}</span>`
}
function esc(s) {
  return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}
function stockStatus(p){return p.stock<=0?'Out of Stock':p.stock<=p.reorder?'Low Stock':'In Stock'}
function navCount(){const n=orders.filter(o=>o.status==='Pending').length;const e=document.getElementById('navOrderCount');e.textContent=n;e.classList.toggle('hidden',!n)}
function navigate(page){activePage=page;document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));document.getElementById('page-'+page).classList.remove('hidden');document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));const title={dashboard:'Dashboard',products:'Products',orders:'Orders',inventory:'Inventory',reports:'Reports',history:'History'}[page];document.getElementById('topTitle').textContent=title;document.getElementById('crumb').textContent=title;document.getElementById('sidebar').classList.remove('open');renderAll();if(page==='products')renderProducts();if(page==='orders')renderOrders();if(page==='inventory')renderInventory();if(page==='history')renderHistory()}
function login(){document.getElementById('loginScreen').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('todayLabel').textContent=new Date().toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric'});navigate('dashboard')}
document.getElementById('loginForm').addEventListener('submit',e=>{e.preventDefault();logAction('Signed in','Admin entered the store workspace','Account');login();toast('Welcome to RedJr Builders. You are signed in.');});
document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
document.getElementById('mobileMenu').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('profileButton').addEventListener('click',()=>document.getElementById('profilePop').classList.toggle('hidden'));
document.getElementById('logoutButton').addEventListener('click',()=>{document.getElementById('profilePop').classList.add('hidden');document.getElementById('app').classList.add('hidden');document.getElementById('loginScreen').classList.remove('hidden');toast('You have signed out.');});
document.getElementById('profileDetails').addEventListener('click',()=>{document.getElementById('profilePop').classList.add('hidden');showModal('Account details',`<div class="receipt"><strong>Store administrator</strong><p class="muted">RedJr Builders and Construction Supply</p><div class="receipt-row"><span>Email</span><strong>admin@redjr.test</strong></div><div class="receipt-row"><span>Access</span><strong>Demo administrator</strong></div><div class="receipt-row"><span>Environment</span><strong>Browser-only prototype</strong></div></div>`,[{label:'Close',class:'primary',action:closeModal}]);});
document.getElementById('exportData').addEventListener('click',()=>{document.getElementById('profilePop').classList.add('hidden');exportCSV('orders')});
document.getElementById('orderType').addEventListener('change',e=>document.getElementById('addressField').classList.toggle('hidden',e.target.value!=='Delivery'));
document.getElementById('productSearch').addEventListener('input',renderProducts);document.getElementById('productSort').addEventListener('change',renderProducts);
document.getElementById('orderSearch').addEventListener('input',renderOrders);document.getElementById('orderStatusFilter').addEventListener('change',renderOrders);
document.getElementById('inventorySearch').addEventListener('input',renderInventory);document.getElementById('stockFilter').addEventListener('change',renderInventory);document.getElementById('historySearch').addEventListener('input',renderHistory);
document.getElementById('checkoutBtn').addEventListener('click',reviewOrder);document.getElementById('clearCartBtn').addEventListener('click',()=>{cart={};renderProducts();toast('Current order cleared.','success')});
function statCard(label,value,note,icon,tint){return `<article class="stat" style="--tint:$ {
    tint
  }
  "><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></article>`}
function renderAll(){renderDashboard();renderOrderStats();renderInventoryStats();renderReportStats();navCount()}
function renderDashboard(){const pending=orders.filter(o=>o.status==='Pending').length;const completed=orders.filter(o=>o.status==='Completed');const sales=completed.reduce((a,o)=>a+o.total,0);document.getElementById('dashboardStats').innerHTML=statCard('Completed sales',money(sales),'From completed sample orders','₱','#e8f5ed')+statCard('Total orders',orders.length,'All order statuses','▣','#e8f0fc')+statCard('Pending orders',pending,'Awaiting review','◷','#fff2dc')+statCard('Products listed',products.length,'Catalog items','▤','#f9e9e9');
const recent=orders.slice().sort((a,b)=>new Date(b.created)-new Date(a.created)).slice(0,5);document.getElementById('recentOrders').innerHTML=tableHTML(['Order ID','Customer','Date','Total','Status'],recent.map(o=>[`<strong>${esc(o.id)}</strong>`,`<div class="item-name">${esc(o.customer)}</div><div class="subline">${esc(o.type)}</div>`,dateShort(o.created),money(o.total),statusBadge(o.status)]),'No orders yet.');
const low=products.filter(p=>p.stock<=p.reorder).sort((a,b)=>a.stock-b.stock).slice(0,5);document.getElementById('inventoryWatch').innerHTML=low.length?low.map(p=>`<div class="quick-row"><div class="quick-icon">${p.emoji}</div><div class="quick-copy"><strong>${esc(p.name)}</strong><small>${p.stock} ${esc(p.unit)} remaining · Reorder at ${p.reorder}</small><div class="progress"><span style="width:$ {
    Math.min(100,p.stock/Math.max(p.reorder,1)*100)
  }
  %;
  background:$ {
    p.stock===0?'#c9343d':'#d99a32'
  }
  "></span></div></div>${statusBadge(stockStatus(p))}</div>`).join(''):'<div class="empty">All products are above their reorder levels.</div>'}
function tableHTML(headers,rows,empty='No records found.'){if(!rows.length)return `<div class="empty"><strong>${empty}</strong>Try changing your search or filters.</div>`;return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
function renderCategoryChips(){const cats=['All',...new Set(products.map(p=>p.category))];document.getElementById('categoryChips').innerHTML=cats.map(c=>`<button class="chip $ {
    activeCategory===c?'active':''
  }
  " data-cat="$ {
    esc(c)
  }
  ">${esc(c)}</button>`).join('');document.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{activeCategory=b.dataset.cat;renderProducts()}))}
function renderProducts(){renderCategoryChips();const q=(document.getElementById('productSearch')?.value||'').toLowerCase();const sort=document.getElementById('productSort')?.value||'name';let list=products.filter(p=>(activeCategory==='All'||p.category===activeCategory)&&(p.name+' '+p.sku+' '+p.category).toLowerCase().includes(q));list.sort((a,b)=>sort==='price-low'?a.price-b.price:sort==='price-high'?b.price-a.price:sort==='stock'?a.stock-b.stock:a.name.localeCompare(b.name));document.getElementById('productGrid').innerHTML=list.length?list.map(p=>`<article class="product-card"><div class="product-art"><img src="${p.image||''}" alt="${esc(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="product-fallback" style="display:none">${p.emoji}</span><span class="stock-tag">${statusBadge(stockStatus(p))}</span></div><div class="product-info"><h3>${esc(p.name)}</h3><div class="sku">${esc(p.sku)} · ${esc(p.category)}</div><div class="product-price">${money(p.price)}<span class="muted tiny"> / ${esc(p.unit)}</span></div><div class="product-stock">${p.stock} ${esc(p.unit)} available</div><button class="$ {
    p.stock?'primary':'secondary'
  }
  " ${p.stock?'':'disabled'} onclick="addToCart('${p.id}')">${p.stock?'＋ Add to order':'Out of stock'}</button></div></article>`).join(''):'<div class="empty" style="grid-column:1/-1"><strong>No matching products</strong>Try another search or category.</div>';renderCart()}
function addToCart(id){const p=products.find(p=>p.id===id);if(!p||p.stock<=0)return toast('This item is currently out of stock.','error');if((cart[id]||0)>=p.stock)return toast('Quantity cannot exceed available stock.','error');cart[id]=(cart[id]||0)+1;renderCart();toast(p.name+' added to the current order.')}
function updateQty(id,delta){const p=products.find(p=>p.id===id);const next=(cart[id]||0)+delta;if(next<=0)delete cart[id];else if(next>p.stock)return toast('Quantity exceeds available stock.','error');else cart[id]=next;renderCart()}
function renderCart(){const entries=Object.entries(cart).filter(([id,q])=>q>0&&products.some(p=>p.id===id));const count=entries.reduce((n,[,q])=>n+q,0),subtotal=entries.reduce((n,[id,q])=>n+products.find(p=>p.id===id).price*q,0);document.getElementById('cartCount').textContent=count+' item'+(count===1?'':'s');document.getElementById('cartLines').innerHTML=entries.length?entries.map(([id,q])=>{const p=products.find(p=>p.id===id);return `<div class="cart-line"><div><strong>${esc(p.name)}</strong><small>${money(p.price)} × ${q} = ${money(p.price*q)}</small><div class="qty-controls"><button aria-label="Decrease $ {
    esc(p.name)
  }
  quantity" onclick="updateQty('${id}',-1)">−</button><span>${q}</span><button aria-label="Increase $ {
    esc(p.name)
  }
  quantity" onclick="updateQty('${id}',1)">+</button></div></div><button class="danger small" aria-label="Remove $ {
    esc(p.name)
  }
  " onclick="removeCartItem('${id}')">×</button></div>`}).join(''):'<div class="empty"><strong>Your order is empty</strong>Add products from the catalog to begin.</div>';document.getElementById('cartSummary').innerHTML=`<div class="cart-total"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="cart-total"><span>Delivery fee</span><strong>${money(0)}</strong></div><div class="cart-total final"><span>Total</span><span>${money(subtotal)}</span></div>`;document.getElementById('checkoutBtn').disabled=!entries.length;document.getElementById('checkoutBtn').style.opacity=entries.length?1:.55}
function removeCartItem(id){delete cart[id];renderCart();toast('Item removed from order.')}
function reviewOrder(){const entries=Object.entries(cart).filter(([,q])=>q>0);const customer=document.getElementById('customerName').value.trim(),type=document.getElementById('orderType').value,address=document.getElementById('deliveryAddress').value.trim();if(!entries.length)return toast('Add at least one product before placing an order.','error');if(!customer){document.getElementById('customerName').focus();return toast('Enter the customer name to continue.','error')}if(type==='Delivery'&&!address){document.getElementById('deliveryAddress').focus();return toast('Enter a delivery address to continue.','error')}for(const [id,q] of entries){const p=products.find(p=>p.id===id);if(!p||q>p.stock)return toast('Stock changed for an item. Review the quantities.','error')}
const items=entries.map(([id,q])=>{const p=products.find(p=>p.id===id);return {productId:id,name:p.name,price:p.price,qty:q}}),total=items.reduce((n,i)=>n+i.price*i.qty,0),contact=document.getElementById('customerContact').value.trim();
showModal('Review your order',`<div class="notice">Please check the details before confirming. You can cancel and edit the order if anything is incorrect.</div><div class="receipt"><div class="receipt-brand"><span class="logo">RJ</span><div><strong>RedJr Builders</strong><div class="muted tiny">Order summary</div></div></div><div class="receipt-row"><span>Customer</span><strong>${esc(customer)}</strong></div><div class="receipt-row"><span>Contact</span><strong>${esc(contact||'Not provided')}</strong></div><div class="receipt-row"><span>Fulfillment</span><strong>${esc(type)}</strong></div>${type==='Delivery'?`<div class="receipt-row"><span>Address</span><strong>${esc(address)}</strong></div>`:''}<div style="margin:15px 0 7px;
  font-weight:750">Items</div>${items.map(i=>`<div class="receipt-row"><span>${esc(i.name)} × ${i.qty}</span><strong>${money(i.price*i.qty)}</strong></div>`).join('')}<div class="receipt-row total"><span>Total</span><span>${money(total)}</span></div></div>`,[{label:'Back to edit',class:'secondary',action:closeModal},{label:'Confirm order',class:'primary',action:()=>placeOrder({customer,contact,type,address,items,total})}])}
function placeOrder(data){data.items.forEach(i=>{const p=products.find(p=>p.id===i.productId);if(p)p.stock-=i.qty});const order={...data,id:uid('ORD'),status:'Pending',created:new Date().toISOString()};orders.unshift(order);logAction('Order created',`${order.id} for ${order.customer} · ${money(order.total)}`,'Order');cart={};document.getElementById('customerName').value='';document.getElementById('customerContact').value='';document.getElementById('deliveryAddress').value='';document.getElementById('orderType').value='Pickup';document.getElementById('addressField').classList.add('hidden');closeModal();renderAll();navigate('orders');showModal('Order placed successfully',`<div style="text-align:center;
  padding:8px 0 18px"><div style="font-size:42px">✓</div><h2 style="margin:8px 0">Order received</h2><p class="muted">The order has been saved in this prototype and its stock quantities have been updated.</p><div class="receipt"><div class="receipt-row"><span>Order number</span><strong>${esc(order.id)}</strong></div><div class="receipt-row"><span>Customer</span><strong>${esc(order.customer)}</strong></div><div class="receipt-row total"><span>Total</span><span>${money(order.total)}</span></div><div style="margin-top:12px">${statusBadge(order.status)}</div></div></div>`,[{label:'Done',class:'secondary',action:closeModal},{label:'View order',class:'primary',action:()=>{closeModal();navigate('orders');}}]);toast('Order '+order.id+' created successfully.')}
function renderOrderStats(){const pending=orders.filter(o=>o.status==='Pending').length,active=orders.filter(o=>['Confirmed','Ready for pickup','Out for delivery'].includes(o.status)).length,completed=orders.filter(o=>o.status==='Completed').length;document.getElementById('orderStats').innerHTML=statCard('All orders',orders.length,'Across all statuses','▣','#e8f0fc')+statCard('Pending',pending,'Needs review','◷','#fff2dc')+statCard('In progress',active,'Confirmed or being fulfilled','↗','#e8f0fc')+statCard('Completed',completed,'Successfully fulfilled','✓','#e8f5ed')}
function renderOrders(){if(!document.getElementById('ordersTable'))return;const q=(document.getElementById('orderSearch')?.value||'').toLowerCase(),status=document.getElementById('orderStatusFilter')?.value||'All';const list=orders.filter(o=>(status==='All'||o.status===status)&&(o.id+' '+o.customer).toLowerCase().includes(q)).sort((a,b)=>new Date(b.created)-new Date(a.created));document.getElementById('ordersTable').innerHTML=tableHTML(['Order ID','Customer','Fulfillment','Date','Total','Status','Actions'],list.map(o=>[`<strong>${esc(o.id)}</strong>`,`<div class="item-name">${esc(o.customer)}</div><div class="subline">${esc(o.contact||'No contact')}</div>`,esc(o.type),dateShort(o.created),money(o.total),statusBadge(o.status),`<button class="outline small" onclick="viewOrder('${o.id}')">View</button> <button class="outline small" onclick="changeStatus('${o.id}')">Update</button>`]),'No orders match this filter.');renderOrderStats()}
function viewOrder(id){const o=orders.find(o=>o.id===id);if(!o)return;showModal('Order details',`<div class="receipt"><div class="receipt-row"><span>Order ID</span><strong>${esc(o.id)}</strong></div><div class="receipt-row"><span>Created</span><strong>${dateTime(o.created)}</strong></div><div class="receipt-row"><span>Customer</span><strong>${esc(o.customer)}</strong></div><div class="receipt-row"><span>Contact</span><strong>${esc(o.contact||'Not provided')}</strong></div><div class="receipt-row"><span>Fulfillment</span><strong>${esc(o.type)}</strong></div>${o.address?`<div class="receipt-row"><span>Address</span><strong>${esc(o.address)}</strong></div>`:''}<div class="receipt-row"><span>Status</span>${statusBadge(o.status)}</div><h4>Order items</h4>${o.items.map(i=>`<div class="receipt-row"><span>${esc(i.name)} × ${i.qty}</span><strong>${money(i.price*i.qty)}</strong></div>`).join('')}<div class="receipt-row total"><span>Total</span><span>${money(o.total)}</span></div></div>`,[{label:'Close',class:'secondary',action:closeModal},{label:'Update status',class:'primary',action:()=>{closeModal();changeStatus(id)}}])}
function changeStatus(id){const o=orders.find(o=>o.id===id);if(!o)return;const statuses=['Pending','Confirmed','Ready for pickup','Out for delivery','Completed','Cancelled'];showModal('Update order status',`<p class="muted">Choose the current fulfillment status for <strong>${esc(o.id)}</strong>.</p><label for="newStatus">Order status</label><select id="newStatus">${statuses.map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select><div class="notice" style="margin-top:14px">Changing a status updates the order record in this prototype. For cancelled orders, stock is not automatically returned.</div>`,[{label:'Cancel',class:'secondary',action:closeModal},{label:'Save status',class:'primary',action:()=>{const s=document.getElementById('newStatus').value;const old=o.status;o.status=s;logAction('Order status updated',`${o.id}: ${old} → ${s}`,'Order');closeModal();renderAll();renderOrders();toast('Order status updated to '+s+'.')}}])}
function renderInventoryStats(){const low=products.filter(p=>p.stock>0&&p.stock<=p.reorder).length,out=products.filter(p=>p.stock===0).length,units=products.reduce((n,p)=>n+p.stock,0),value=products.reduce((n,p)=>n+p.stock*p.price,0);document.getElementById('inventoryStats').innerHTML=statCard('Product types',products.length,'Items in catalog','▤','#e8f0fc')+statCard('Total units',units,'Across all listed products','▦','#e8f5ed')+statCard('Low stock',low,'At or below reorder level','◷','#fff2dc')+statCard('Out of stock',out,'Items unavailable','!','#f9e9e9')}
function renderInventory(){if(!document.getElementById('inventoryTable'))return;const q=(document.getElementById('inventorySearch')?.value||'').toLowerCase(),filter=document.getElementById('stockFilter')?.value||'All';const list=products.filter(p=>(p.name+' '+p.sku+' '+p.category).toLowerCase().includes(q)&&(filter==='All'||stockStatus(p)===filter)).sort((a,b)=>a.stock-b.stock);document.getElementById('inventoryTable').innerHTML=tableHTML(['Product / SKU','Category','Available stock','Reorder level','Status','Actions'],list.map(p=>[`<div class="item-name">${esc(p.name)}</div><div class="subline">${esc(p.sku)}</div>`,esc(p.category),`${p.stock} ${esc(p.unit)}`,p.reorder,statusBadge(stockStatus(p)),`<button class="outline small" onclick="adjustStock('${p.id}')">Update stock</button>`]),'No inventory items match this filter.');renderInventoryStats()}
function adjustStock(id){const p=products.find(p=>p.id===id);showModal('Update inventory',`<p class="muted">Update the available quantity for <strong>${esc(p.name)}</strong>.</p><div class="notice">Current stock: ${p.stock} ${esc(p.unit)}. Use a whole number zero or greater.</div><label for="stockInput">New available quantity (${esc(p.unit)})</label><input id="stockInput" type="number" min="0" step="1" value="$ {
    p.stock
  }
  " required><label for="stockReason">Reason for adjustment</label><select id="stockReason"><option>Stock count correction</option><option>New stock received</option><option>Damaged or missing items</option><option>Other</option></select>`,[{label:'Cancel',class:'secondary',action:closeModal},{label:'Save quantity',class:'primary',action:()=>{const v=Number(document.getElementById('stockInput').value);if(!Number.isInteger(v)||v<0)return toast('Enter a whole number of zero or greater.','error');const old=p.stock;p.stock=v;logAction('Inventory updated',`${p.name}: ${old} → ${v} (${document.getElementById('stockReason').value})`,'Inventory');closeModal();renderAll();renderInventory();toast('Stock quantity updated.')}}])}
function openAddProduct(){showModal('Add a product',`<form id="addProductForm"><div class="form-grid"><div class="full"><label for="newName">Product name *</label><input id="newName" required placeholder="e.g. Masonry trowel"></div><div><label for="newSku">SKU *</label><input id="newSku" required placeholder="e.g. TLS-004"></div><div><label for="newCategory">Category *</label><select id="newCategory"><option>Steel</option><option>Plywood</option><option>Aggregates</option><option>Hardware</option><option>Cement</option><option>Masonry</option><option>Tools</option><option>Plumbing</option><option>Electrical</option><option>Painting</option><option>Roofing</option><option>Other</option></select></div><div><label for="newPrice">Unit price (₱) *</label><input id="newPrice" type="number" min="0.01" step="0.01" required placeholder="0.00"></div><div><label for="newStock">Initial stock *</label><input id="newStock" type="number" min="0" step="1" required value="0"></div><div><label for="newReorder">Reorder level *</label><input id="newReorder" type="number" min="0" step="1" required value="10"></div><div><label for="newUnit">Unit</label><select id="newUnit"><option>piece</option><option>bag</option><option>kg</option><option>box</option><option>length</option><option>roll</option><option>sheet</option><option>liter</option></select></div></div><div class="field-help">Required fields are marked with an asterisk. SKU should be unique.</div></form>`,[{label:'Cancel',class:'secondary',action:closeModal},{label:'Add product',class:'primary',action:()=>{const name=document.getElementById('newName').value.trim(),sku=document.getElementById('newSku').value.trim(),category=document.getElementById('newCategory').value,price=Number(document.getElementById('newPrice').value),stock=Number(document.getElementById('newStock').value),reorder=Number(document.getElementById('newReorder').value),unit=document.getElementById('newUnit').value;if(!name||!sku||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0||!Number.isInteger(reorder)||reorder<0)return toast('Complete all fields with valid values.','error');if(products.some(p=>p.sku.toLowerCase()===sku.toLowerCase()))return toast('That SKU already exists. Enter a unique SKU.','error');const p={id:uid('P'),name,sku,category,price,stock,reorder,unit,emoji:category==='Cement'?'🧱':category==='Tools'?'🛠️':category==='Plumbing'?'🪠':'📦'};products.push(p);logAction('Product added',`${p.name} (${p.sku}) added to catalog`,'Inventory');closeModal();renderAll();renderProducts();renderInventory();toast('Product added to catalog.')}}])}
function renderReportStats(){const completed=orders.filter(o=>o.status==='Completed'),sales=completed.reduce((n,o)=>n+o.total,0),avg=completed.length?sales/completed.length:0;document.getElementById('reportStats').innerHTML=statCard('Completed sales',money(sales),'Completed orders only','₱','#e8f5ed')+statCard('Orders',orders.length,'All recorded orders','▣','#e8f0fc')+statCard('Average completed order',money(avg),'Sales divided by completed orders','↗','#fff2dc')+statCard('Inventory value',money(products.reduce((n,p)=>n+p.stock*p.price,0)),'Stock × listed unit price','▤','#f9e9e9');
const statuses=['Pending','Confirmed','Ready for pickup','Out for delivery','Completed','Cancelled'];document.getElementById('statusBars').innerHTML=statuses.map(s=>{const n=orders.filter(o=>o.status===s).length;return `<div style="margin-bottom:16px"><div style="display:flex;
  justify-content:space-between;
  font-size:12px;
  margin-bottom:6px"><span>${s}</span><strong>${n}</strong></div><div class="progress"><span style="width:$ {
    orders.length?n/orders.length*100:0
  }
  %;
  background:$ {
    s==='Cancelled'?'#c9343d':s==='Completed'?'#24865b':'#3578c8'
  }
  "></span></div></div>`}).join('');
const counts={};orders.filter(o=>o.status!=='Cancelled').forEach(o=>o.items.forEach(i=>counts[i.name]=(counts[i.name]||0)+i.qty));const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);document.getElementById('topProducts').innerHTML=top.length?top.map(([name,n],i)=>`<div class="quick-row" style="margin-bottom:14px"><div class="quick-icon">${i+1}</div><div class="quick-copy"><strong>${esc(name)}</strong><small>${n} units across orders</small><div class="progress"><span style="width:$ {
    n/top[0][1]*100
  }
  %"></span></div></div></div>`).join(''):'<div class="empty">No order items to report.</div>'}
function renderHistory(){if(!document.getElementById('historyTable'))return;const q=(document.getElementById('historySearch')?.value||'').toLowerCase();const list=history.filter(h=>(h.action+' '+h.detail+' '+h.type).toLowerCase().includes(q));document.getElementById('historyTable').innerHTML=tableHTML(['Date & time','Activity','Details','Type'],list.map(h=>[dateTime(h.time),`<strong>${esc(h.action)}</strong>`,esc(h.detail),statusBadge(h.type)]),'No matching activity.')}
function clearHistory(){showModal('Clear activity history?',`<p>This removes the visible activity entries from this prototype. It will not change products or orders.</p>`,[{label:'Keep history',class:'secondary',action:closeModal},{label:'Clear history',class:'danger',action:()=>{history=[];closeModal();renderHistory();toast('Activity history cleared.')}}])}
function exportCSV(kind){let rows=[],filename=kind; if(kind==='inventory'){rows=[['SKU','Product','Category','Price','Stock','Unit','Reorder level','Status'],...products.map(p=>[p.sku,p.name,p.category,p.price,p.stock,p.unit,p.reorder,stockStatus(p)])]}else if(kind==='history'){rows=[['Time','Action','Details','Type'],...history.map(h=>[h.time,h.action,h.detail,h.type])]}else{rows=[['Order ID','Customer','Contact','Fulfillment','Address','Date','Status','Total','Items'],...orders.map(o=>[o.id,o.customer,o.contact,o.type,o.address,o.created,o.status,o.total,o.items.map(i=>`${i.name} x${i.qty}`).join('; ')])]};const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='redjr-'+filename+'-'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(url);toast('CSV export prepared.')}
function showModal(title,body,buttons=[]){const root=document.getElementById('modalRoot');root.innerHTML=`<div class="modal-backdrop" role="presentation" onclick="if(event.target===this)closeModal()"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><h3 id="modalTitle">${title}</h3><button class="close-btn" aria-label="Close dialog" onclick="closeModal()">✕</button></div><div class="modal-body">${body}</div><div class="modal-foot" id="modalFoot"></div></section></div>`;const foot=document.getElementById('modalFoot');buttons.forEach(b=>{const btn=document.createElement('button');btn.className=b.class||'secondary';btn.textContent=b.label;btn.addEventListener('click',b.action);foot.appendChild(btn)});const first=root.querySelector('input,select,button');if(first)first.focus()}
function closeModal(){document.getElementById('modalRoot').innerHTML=''}
window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();document.getElementById('profilePop').classList.add('hidden');document.getElementById('sidebar').classList.remove('open')}})
renderAll();
