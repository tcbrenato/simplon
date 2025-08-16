'use strict';

(function() {
	const APP_NAME = 'GEOTECH';
	const STORAGE_KEYS = {
		products: 'geotech_products',
		stock: 'geotech_stock',
		sales: 'geotech_sales',
		settings: 'geotech_settings',
		role: 'geotech_user_role',
		adminPin: 'geotech_admin_pin'
	};

	const DEFAULT_PRODUCTS = [
		// Bières
		{name: 'Awooyo Spéciale', category: 'Bières', crateSize: 24},
		{name: 'GUINNESS', category: 'Bières', crateSize: 24},
		{name: 'Eku Bavaria', category: 'Bières', crateSize: 24},
		{name: 'Doppel Munich', category: 'Bières', crateSize: 24},
		{name: 'Hagbè', category: 'Bières', crateSize: 24},
		{name: 'Castel Beer', category: 'Bières', crateSize: 24},
		{name: 'Flag Spéciale', category: 'Bières', crateSize: 24},
		{name: 'Beaufort Lager', category: 'Bières', crateSize: 24},
		{name: 'Pils Bénin', category: 'Bières', crateSize: 24},
		{name: 'Pils Togo', category: 'Bières', crateSize: 24},
		{name: 'La Béninoise', category: 'Bières', crateSize: 24},
		{name: 'Tequila', category: 'Bières', crateSize: 24},
		{name: 'BB lager togo', category: 'Bières', crateSize: 24},
		{name: 'Buildozer togo', category: 'Bières', crateSize: 24},
		// Boissons gazeuses
		{name: 'Youki Cocktail de fruits', category: 'Boissons gazeuses', crateSize: 24},
		{name: 'Youki Pamplemousse', category: 'Boissons gazeuses', crateSize: 24},
		{name: 'Youki Moka Café', category: 'Boissons gazeuses', crateSize: 24},
		{name: 'Youki Tonic', category: 'Boissons gazeuses', crateSize: 24},
		{name: 'World Cola', category: 'Boissons gazeuses', crateSize: 24},
		{name: 'YouZou', category: 'Boissons gazeuses', crateSize: 24},
		// Panachés
		{name: 'Chill citron', category: 'Panachés', crateSize: 24},
		// Boissons énergissantes
		{name: 'XXL Energy', category: 'Boissons énergissantes', crateSize: 24},
		{name: 'Doppel Energy Malt', category: 'Boissons énergissantes', crateSize: 24},
		// Eaux
		{name: 'Posso Citron', category: 'Eaux', crateSize: 20},
		{name: 'Aqua Belle', category: 'Eaux', crateSize: 20},
		{name: 'Possotomè gazéifiée', category: 'Eaux', crateSize: 20},
		{name: 'Possotomè minérale', category: 'Eaux', crateSize: 20},
	];

	function toDateKey(d = new Date()) {
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function readStorage(key, fallback) {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) return fallback;
			return JSON.parse(raw);
		} catch (e) {
			return fallback;
		}
	}

	function writeStorage(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
	}

	function getRole() {
		return readStorage(STORAGE_KEYS.role, 'user');
	}

	function setRole(role) {
		writeStorage(STORAGE_KEYS.role, role);
		const badge = document.getElementById('roleBadge');
		badge.textContent = role === 'admin' ? 'Admin' : 'Utilisateur';
		document.querySelectorAll('.admin-only').forEach(el => {
			el.style.display = role === 'admin' ? '' : 'none';
		});
	}

	function getSettings() {
		return readStorage(STORAGE_KEYS.settings, {
			thresholdCrates: 1,
			thresholdBottles: 4
		});
	}

	function setSettings(next) {
		writeStorage(STORAGE_KEYS.settings, next);
	}

	function getProducts() {
		const products = readStorage(STORAGE_KEYS.products, null);
		if (products && Array.isArray(products) && products.length > 0) return products;
		writeStorage(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
		return DEFAULT_PRODUCTS;
	}

	function setProducts(products) {
		writeStorage(STORAGE_KEYS.products, products);
	}

	function getStock() {
		return readStorage(STORAGE_KEYS.stock, {});
	}

	function setStock(stock) {
		writeStorage(STORAGE_KEYS.stock, stock);
	}

	function getSales() {
		return readStorage(STORAGE_KEYS.sales, {});
	}

	function setSales(sales) {
		writeStorage(STORAGE_KEYS.sales, sales);
	}

	function intDiv(numerator, denominator) {
		return Math.trunc(numerator / denominator);
	}

	function mod(numerator, denominator) {
		const r = numerator % denominator;
		return r < 0 ? r + denominator : r;
	}

	function numberOrZero(value) {
		const n = Number(value);
		return Number.isFinite(n) && n >= 0 ? n : 0;
	}

	function computeStock(cal) {
		const s = numberOrZero(cal.crateSize) || 24;
		const qtyCrates = numberOrZero(cal.qtyCrates);
		const qtyBottles = numberOrZero(cal.qtyBottles);
		const arrCrates = numberOrZero(cal.arrCrates);
		const arrBottles = numberOrZero(cal.arrBottles);
		const soldCrates = numberOrZero(cal.soldCrates);
		const soldBottles = numberOrZero(cal.soldBottles);

		const totalCrates = qtyCrates + arrCrates + intDiv(qtyBottles + arrBottles, s);
		const totalBottles = mod(qtyBottles + arrBottles, s);
		const restCrates = totalCrates - soldCrates + intDiv(totalBottles - soldBottles, s);
		let restBottles = mod(totalBottles - soldBottles, s);
		let adjustedRestCrates = restCrates;
		if (restBottles >= s) {
			adjustedRestCrates += intDiv(restBottles, s);
			restBottles = mod(restBottles, s);
		}
		if (restBottles === s) {
			adjustedRestCrates += 1;
			restBottles = 0;
		}
		return {
			totalCrates, totalBottles,
			restCrates: Math.max(0, adjustedRestCrates),
			restBottles: Math.max(0, restBottles),
		};
	}

	function computeSaleAmount({ unit, qty, unitPrice, crateSize }) {
		const s = crateSize;
		const price = Number(unitPrice) || 0;
		const q = numberOrZero(qty);
		if (unit === 'casier') {
			return q * price;
		}
		const cratePrice = price * s; // if bottle price provided
		const pricePerBottle = price; // by default interpret as per-bottle when unit is bottle
		const fullCrates = intDiv(q, s);
		const remainder = mod(q, s);
		const halfThreshold = Math.ceil(s / 2);
		let amount = fullCrates * cratePrice;
		if (remainder >= halfThreshold) {
			amount += 0.5 * cratePrice;
		} else {
			amount += remainder * pricePerBottle;
		}
		return amount;
	}

	function formatCurrency(n) {
		try {
			return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n || 0);
		} catch (_) {
			return String(Math.round(n || 0));
		}
	}

	function populateProductSelect(selectEl, products) {
		selectEl.innerHTML = '';
		products.forEach((p, idx) => {
			const option = document.createElement('option');
			option.value = String(idx);
			option.textContent = `${p.name}`;
			option.dataset.crateSize = String(p.crateSize);
			selectEl.appendChild(option);
		});
	}

	function refreshStockTable() {
		const stock = getStock();
		const products = getProducts();
		const tbody = document.querySelector('#stockTable tbody');
		tbody.innerHTML = '';
		products.forEach((p, idx) => {
			const item = stock[p.name] || { restCrates: 0, restBottles: 0, crateSize: p.crateSize };
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td>${p.name}</td>
				<td>${item.crateSize}</td>
				<td>${item.restCrates}</td>
				<td>${item.restBottles}</td>
			`;
			tbody.appendChild(tr);
		});
	}

	function refreshKPIs() {
		const products = getProducts();
		document.getElementById('kpiProducts').textContent = String(products.length);
		const stock = getStock();
		let sumCrates = 0; let sumBottles = 0;
		products.forEach(p => {
			const s = stock[p.name];
			if (s) { sumCrates += numberOrZero(s.restCrates); sumBottles += numberOrZero(s.restBottles); }
		});
		document.getElementById('kpiStock').textContent = `${sumCrates} casiers · ${sumBottles} bouteilles`;
		const sales = getSales();
		const today = toDateKey();
		const todaySales = sales[today] || [];
		const total = todaySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
		document.getElementById('kpiSales').textContent = formatCurrency(total);
	}

	function refreshLowStockList() {
		const settings = getSettings();
		const stock = getStock();
		const products = getProducts();
		const ul = document.getElementById('lowStockList');
		ul.innerHTML = '';
		products.forEach(p => {
			const s = stock[p.name] || { restCrates: 0, restBottles: 0 };
			if (s.restCrates <= settings.thresholdCrates || s.restBottles <= settings.thresholdBottles) {
				const li = document.createElement('li');
				li.textContent = `${p.name}: ${s.restCrates} casiers, ${s.restBottles} bouteilles`;
				ul.appendChild(li);
			}
		});
		if (ul.children.length === 0) {
			const li = document.createElement('li');
			li.textContent = 'Aucune alerte.';
			ul.appendChild(li);
		}
	}

	function handleStockForm() {
		const products = getProducts();
		const productSelect = document.getElementById('stockProduct');
		populateProductSelect(productSelect, products);
		const crateSizeSelect = document.getElementById('stockCrateSize');
		function updateCrateSizeFromProduct() {
			const opt = productSelect.selectedOptions[0];
			if (!opt) return;
			const size = Number(opt.dataset.crateSize) || 24;
			crateSizeSelect.value = String(size);
		}
		updateCrateSizeFromProduct();
		productSelect.addEventListener('change', updateCrateSizeFromProduct);

		const ids = ['qtyCrates','qtyBottles','arrCrates','arrBottles','soldCrates','soldBottles','stockCrateSize'];
		function recalc() {
			const values = {
				crateSize: Number(crateSizeSelect.value) || 24,
				qtyCrates: document.getElementById('qtyCrates').value,
				qtyBottles: document.getElementById('qtyBottles').value,
				arrCrates: document.getElementById('arrCrates').value,
				arrBottles: document.getElementById('arrBottles').value,
				soldCrates: document.getElementById('soldCrates').value,
				soldBottles: document.getElementById('soldBottles').value,
			};
			const r = computeStock(values);
			document.getElementById('totalCrates').value = r.totalCrates;
			document.getElementById('totalBottles').value = r.totalBottles;
			document.getElementById('restCrates').value = r.restCrates;
			document.getElementById('restBottles').value = r.restBottles;
		}
		ids.forEach(id => {
			document.getElementById(id).addEventListener('input', recalc);
		});
		recalc();

		document.getElementById('stockForm').addEventListener('submit', (e) => {
			e.preventDefault();
			const product = products[Number(productSelect.value)];
			if (!product) return;
			const crateSize = Number(crateSizeSelect.value) || product.crateSize;
			const r = computeStock({
				crateSize,
				qtyCrates: document.getElementById('qtyCrates').value,
				qtyBottles: document.getElementById('qtyBottles').value,
				arrCrates: document.getElementById('arrCrates').value,
				arrBottles: document.getElementById('arrBottles').value,
				soldCrates: document.getElementById('soldCrates').value,
				soldBottles: document.getElementById('soldBottles').value,
			});
			const stock = getStock();
			stock[product.name] = { totalCrates: r.totalCrates, totalBottles: r.totalBottles, restCrates: r.restCrates, restBottles: r.restBottles, crateSize };
			setStock(stock);
			refreshStockTable();
			refreshKPIs();
			refreshLowStockList();
			(e.target).reset();
			recalc();
		});

		document.getElementById('clearStockForm').addEventListener('click', () => {
			['qtyCrates','qtyBottles','arrCrates','arrBottles','soldCrates','soldBottles','totalCrates','totalBottles','restCrates','restBottles'].forEach(id => {
				document.getElementById(id).value = '';
			});
			recalc();
		});
	}

	function refreshSalesTable() {
		const sales = getSales();
		const today = toDateKey();
		const list = sales[today] || [];
		const tbody = document.querySelector('#salesTable tbody');
		tbody.innerHTML = '';
		let total = 0;
		list.forEach((s, index) => {
			total += Number(s.amount) || 0;
			const tr = document.createElement('tr');
			const timeStr = new Date(s.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
			tr.innerHTML = `
				<td>${timeStr}</td>
				<td>${s.product}</td>
				<td>${s.qty}</td>
				<td>${s.unit}</td>
				<td>${formatCurrency(s.unitPrice)}</td>
				<td>${formatCurrency(s.amount)}</td>
				<td><button data-index="${index}" class="secondary admin-only">Supprimer</button></td>
			`;
			tbody.appendChild(tr);
		});
		document.getElementById('salesTotal').textContent = formatCurrency(total);
		// delete handlers
		Array.from(tbody.querySelectorAll('button[data-index]')).forEach(btn => {
			btn.addEventListener('click', () => {
				const idx = Number(btn.dataset.index);
				const sales = getSales();
				const todayList = sales[today] || [];
				todayList.splice(idx, 1);
				sales[today] = todayList;
				setSales(sales);
				refreshSalesTable();
				refreshKPIs();
			});
		});
	}

	function handleSaleForm() {
		const products = getProducts();
		const productSelect = document.getElementById('saleProduct');
		populateProductSelect(productSelect, products);
		function recalc() {
			const prod = products[Number(productSelect.value)];
			if (!prod) return;
			const unit = document.getElementById('saleUnit').value;
			const qty = numberOrZero(document.getElementById('saleQty').value);
			const unitPrice = Number(document.getElementById('saleUnitPrice').value) || 0;
			const amount = computeSaleAmount({ unit, qty, unitPrice, crateSize: prod.crateSize });
			document.getElementById('saleAmount').value = Math.round(amount);
		}
		['saleProduct','saleUnit','saleQty','saleUnitPrice'].forEach(id => {
			document.getElementById(id).addEventListener('input', recalc);
		});
		recalc();

		document.getElementById('saleForm').addEventListener('submit', (e) => {
			e.preventDefault();
			const prod = products[Number(productSelect.value)];
			if (!prod) return;
			const unit = document.getElementById('saleUnit').value;
			const qty = numberOrZero(document.getElementById('saleQty').value);
			const unitPrice = Number(document.getElementById('saleUnitPrice').value) || 0;
			const amount = computeSaleAmount({ unit, qty, unitPrice, crateSize: prod.crateSize });
			const item = { timestamp: Date.now(), product: prod.name, unit, qty, unitPrice, amount: Math.round(amount) };
			const sales = getSales();
			const today = toDateKey();
			const list = sales[today] || [];
			list.push(item);
			sales[today] = list;
			setSales(sales);
			refreshSalesTable();
			refreshKPIs();
			(e.target).reset();
			recalc();
		});

		document.getElementById('clearSaleForm').addEventListener('click', () => {
			['saleQty','saleUnitPrice','saleAmount'].forEach(id => document.getElementById(id).value = '');
		});
	}

	function handleSettings() {
		const settings = getSettings();
		document.getElementById('thresholdCrates').value = settings.thresholdCrates;
		document.getElementById('thresholdBottles').value = settings.thresholdBottles;
		const saveBtn = document.getElementById('saveSettingsBtn');
		if (saveBtn) {
			saveBtn.addEventListener('click', () => {
				const next = {
					thresholdCrates: numberOrZero(document.getElementById('thresholdCrates').value) || 0,
					thresholdBottles: numberOrZero(document.getElementById('thresholdBottles').value) || 0,
				};
				setSettings(next);
				refreshLowStockList();
			});
		}

		const addBtn = document.getElementById('addProductBtn');
		if (addBtn) {
			addBtn.addEventListener('click', () => {
				const name = (document.getElementById('productName').value || '').trim();
				const category = document.getElementById('productCategory').value;
				const crateSize = Number(document.getElementById('productCrateSize').value) || 24;
				if (!name) return;
				const list = getProducts();
				list.push({ name, category, crateSize });
				setProducts(list);
				renderProductsTable();
				populateProductSelect(document.getElementById('stockProduct'), list);
				populateProductSelect(document.getElementById('saleProduct'), list);
				document.getElementById('productName').value = '';
			});
		}

		const resetProductsBtn = document.getElementById('resetProductsBtn');
		if (resetProductsBtn) {
			resetProductsBtn.addEventListener('click', () => {
				if (!confirm('Réinitialiser la liste des produits aux valeurs par défaut ?')) return;
				setProducts(DEFAULT_PRODUCTS);
				renderProductsTable();
				populateProductSelect(document.getElementById('stockProduct'), getProducts());
				populateProductSelect(document.getElementById('saleProduct'), getProducts());
			});
		}

		document.getElementById('toggleAdminBtn').addEventListener('click', () => {
			const current = getRole();
			if (current === 'admin') {
				setRole('user');
				return;
			}
			const pin = (document.getElementById('adminPin').value || '').trim();
			const savedPin = readStorage(STORAGE_KEYS.adminPin, '');
			if (savedPin) {
				if (pin !== savedPin) { alert('PIN incorrect.'); return; }
				setRole('admin');
				return;
			}
			if (!pin) { alert('Définissez un PIN admin puis réessayez.'); return; }
			writeStorage(STORAGE_KEYS.adminPin, pin);
			setRole('admin');
		});

		const saveSettingsBtn = document.getElementById('saveSettingsBtn');
		if (saveSettingsBtn) {
			saveSettingsBtn.addEventListener('click', () => {
				const pin = (document.getElementById('adminPin').value || '').trim();
				if (pin) writeStorage(STORAGE_KEYS.adminPin, pin);
			});
		}

		const resetStockBtn = document.getElementById('resetStockBtn');
		if (resetStockBtn) {
			resetStockBtn.addEventListener('click', () => {
				if (!confirm('Effacer toutes les données de stock ?')) return;
				setStock({});
				refreshStockTable();
				refreshKPIs();
				refreshLowStockList();
			});
		}

		const resetSalesBtn = document.getElementById('resetSalesBtn');
		if (resetSalesBtn) {
			resetSalesBtn.addEventListener('click', () => {
				if (!confirm('Effacer toutes les données de caisse ?')) return;
				setSales({});
				refreshSalesTable();
				refreshKPIs();
			});
		}
	}

	function renderProductsTable() {
		const tbody = document.querySelector('#productsTable tbody');
		const products = getProducts();
		tbody.innerHTML = '';
		products.forEach((p, idx) => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td>${p.name}</td>
				<td>${p.category}</td>
				<td>${p.crateSize}</td>
				<td class="admin-only"><button data-index="${idx}" class="secondary">Supprimer</button></td>
			`;
			tbody.appendChild(tr);
		});
		Array.from(tbody.querySelectorAll('button[data-index]')).forEach(btn => {
			btn.addEventListener('click', () => {
				const idx = Number(btn.dataset.index);
				const list = getProducts();
				list.splice(idx, 1);
				setProducts(list);
				renderProductsTable();
				populateProductSelect(document.getElementById('stockProduct'), list);
				populateProductSelect(document.getElementById('saleProduct'), list);
			});
		});
	}

	function handleReports() {
		const dateInput = document.getElementById('reportDate');
		dateInput.value = toDateKey();
		document.getElementById('generatePdfBtn').addEventListener('click', (e) => {
			e.preventDefault();
			generateDailyPdf(new Date(dateInput.value));
		});
	}

	function generateDailyPdf(date) {
		const dateKey = toDateKey(date);
		const products = getProducts();
		const stock = getStock();
		const sales = getSales();
		const daySales = sales[dateKey] || [];

		const { jsPDF } = window.jspdf || {};
		if (!jsPDF) { alert('Librairie PDF introuvable.'); return; }
		const doc = new jsPDF({ unit: 'pt', format: 'a4' });
		const margin = 36;
		let y = margin;
		doc.setFontSize(16);
		doc.text(`${APP_NAME} — Rapport du ${dateKey}`, margin, y);
		y += 8;
		doc.setFontSize(10);
		doc.setTextColor(120);
		doc.text('par Rénato TCHOBO', margin, y);
		y += 18;
		doc.setTextColor(0);

		const stockRows = products.map(p => {
			const s = stock[p.name] || { totalCrates: 0, totalBottles: 0, restCrates: 0, restBottles: 0, crateSize: p.crateSize };
			return [p.name, String(s.crateSize), String(s.totalCrates || 0), String(s.totalBottles || 0), String(s.restCrates), String(s.restBottles)];
		});
		doc.autoTable({
			startY: y,
			head: [['Produit', 'Type', 'Total casiers', 'Total bouteilles', 'Reste casiers', 'Reste bouteilles']],
			body: stockRows,
			styles: { fontSize: 9 },
			margin: { left: margin, right: margin },
			headStyles: { fillColor: [25, 88, 133] }
		});
		y = doc.lastAutoTable.finalY + 16;

		const salesRows = daySales.map(s => {
			const timeStr = new Date(s.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
			return [timeStr, s.product, String(s.qty), s.unit, formatCurrency(s.unitPrice), formatCurrency(s.amount)];
		});
		doc.autoTable({
			startY: y,
			head: [['Heure', 'Produit', 'Qté', 'Unité', 'Prix unitaire', 'Montant']],
			body: salesRows,
			styles: { fontSize: 9 },
			margin: { left: margin, right: margin },
			headStyles: { fillColor: [25, 88, 133] }
		});
		y = doc.lastAutoTable.finalY + 8;

		const total = daySales.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
		doc.setFontSize(12);
		doc.text(`Total général des ventes: ${formatCurrency(total)}`, margin, y + 12);

		doc.save(`GEOTECH_Rapport_${dateKey}.pdf`);
	}

	function handleNavigation() {
		const tabs = Array.from(document.querySelectorAll('.tab'));
		tabs.forEach(btn => {
			btn.addEventListener('click', () => {
				const target = btn.dataset.target;
				document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
				document.getElementById(target).classList.add('active');
			});
		});
		Array.from(document.querySelectorAll('[data-goto]')).forEach(btn => {
			btn.addEventListener('click', () => {
				const target = btn.dataset.goto;
				document.querySelector(`.tab[data-target="${target}"]`).click();
			});
		});
	}

	function initTheme() {
		document.getElementById('toggleThemeBtn').addEventListener('click', () => {
			const isDark = document.body.dataset.theme === 'dark';
			document.body.dataset.theme = isDark ? '' : 'dark';
		});
		const style = document.createElement('style');
		style.textContent = `
			body[data-theme="dark"] { --color-bg: #0b111a; --color-surface: #0f1723; --color-text: #e6edf6; --color-muted: #9fb0c3; }
			body[data-theme="dark"] .secondary { background: #0c2540; color: #cce3ff; }
			body[data-theme="dark"] thead th { background: #0c2540; }
			body[data-theme="dark"] tr:nth-child(even) td { background: #0c1a2b; }
			body[data-theme="dark"] .list li { background: #261d00; color: #ffecb3; border-color: #5c4a00; }
		`;
		document.head.appendChild(style);
	}

	document.addEventListener('DOMContentLoaded', () => {
		document.getElementById('year').textContent = String(new Date().getFullYear());
		setRole(getRole());
		initTheme();
		refreshKPIs();
		refreshLowStockList();
		refreshStockTable();
		renderProductsTable();
		handleNavigation();
		handleStockForm();
		handleSaleForm();
		handleSettings();
		handleReports();
	});
})();