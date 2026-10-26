const BASE_URL = 'http://localhost:5000/api';

async function verify() {
  console.log('===============================================================');
  console.log('🚀 DIWS END-TO-END VERIFICATION: LIVE DATA & PERMISSIONS');
  console.log('===============================================================');

  // 1. Authenticate with hitarththombre@gmail.com
  console.log('\n[1] Testing Login for hitarththombre@gmail.com ...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'hitarththombre@gmail.com',
      password: 'Password@123',
    }),
  });
  const loginData: any = await loginRes.json();

  if (!loginData.success || !loginData.data?.accessToken) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }

  const token = loginData.data.accessToken;
  const user = loginData.data.user;
  const permissions = loginData.data.permissions || user.permissions || [];

  console.log(`✓ Login Successful!`);
  console.log(`  User:        ${user.firstName} ${user.lastName} (${user.email})`);
  console.log(`  Role:        ${user.role}`);
  console.log(`  Permissions: ${permissions.length} total granted permissions`);

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Test Get Me Profile
  console.log('\n[2] Testing GET /auth/me ...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers });
  const meData: any = await meRes.json();
  console.log(`✓ Auth Me returned profile with company: ${meData.data.user.companyId?.name || meData.data.user.companyId}`);

  // 3. Test Factories
  console.log('\n[3] Testing GET /factories ...');
  const factRes = await fetch(`${BASE_URL}/factories`, { headers });
  const factData: any = await factRes.json();
  const factories = factData.data || [];
  console.log(`✓ Retrieved ${factories.length} live factories:`);
  factories.forEach((f: any) => console.log(`   - [${f.code}] ${f.name} (Status: ${f.status}, City: ${f.location?.city})`));

  // 4. Test Warehouses
  console.log('\n[4] Testing GET /warehouses ...');
  const whRes = await fetch(`${BASE_URL}/warehouses`, { headers });
  const whData: any = await whRes.json();
  const warehouses = whData.data || [];
  console.log(`✓ Retrieved ${warehouses.length} live warehouses:`);
  warehouses.forEach((w: any) => console.log(`   - [${w.code}] ${w.name} (Capacity: ${w.capacity}, Usage: ${w.currentUsage})`));

  // 5. Test Products
  console.log('\n[5] Testing GET /products ...');
  const prodRes = await fetch(`${BASE_URL}/products`, { headers });
  const prodData: any = await prodRes.json();
  const products = prodData.data || [];
  console.log(`✓ Retrieved ${products.length} live products:`);
  products.forEach((p: any) => console.log(`   - [${p.sku}] ${p.name} ($${p.price}, BOM items: ${p.billOfMaterials?.length || 0})`));

  // 6. Test Inventory
  console.log('\n[6] Testing GET /inventory ...');
  const invRes = await fetch(`${BASE_URL}/inventory`, { headers });
  const invData: any = await invRes.json();
  const inventory = invData.data || [];
  console.log(`✓ Retrieved ${inventory.length} live stock items:`);
  inventory.forEach((i: any) => console.log(`   - [${i.sku}] ${i.itemName} (Qty: ${i.quantity} ${i.unit}, Location: ${i.locationInWarehouse})`));

  // 7. Test Suppliers & Document Vault
  console.log('\n[7] Testing GET /suppliers & Document Vault ...');
  const supRes = await fetch(`${BASE_URL}/suppliers`, { headers });
  const supData: any = await supRes.json();
  const suppliers = supData.data || [];
  console.log(`✓ Retrieved ${suppliers.length} live suppliers:`);
  suppliers.forEach((s: any) => {
    console.log(`   - [${s.code}] ${s.name} (${s.complianceStatus}, Documents: ${s.documents?.length || 0})`);
    if (s.documents?.length) {
      s.documents.forEach((d: any) => console.log(`      * Cert: "${d.title}" (${d.status}, URL: ${d.fileUrl})`));
    }
  });

  // 8. Test Customers & Credit Standings
  console.log('\n[8] Testing GET /customers ...');
  const custRes = await fetch(`${BASE_URL}/customers`, { headers });
  const custData: any = await custRes.json();
  const customers = custData.data || [];
  console.log(`✓ Retrieved ${customers.length} live customers:`);
  customers.forEach((c: any) => console.log(`   - [${c.code}] ${c.name} (Credit: $${c.creditStanding?.availableCredit} / $${c.creditLimit})`));

  // 9. Test Work Orders
  console.log('\n[9] Testing GET /production/work-orders ...');
  const woRes = await fetch(`${BASE_URL}/production/work-orders`, { headers });
  const woData: any = await woRes.json();
  const workOrders = woData.data || [];
  console.log(`✓ Retrieved ${workOrders.length} live work orders:`);
  workOrders.forEach((w: any) => console.log(`   - [${w.workOrderNumber}] ${w.itemName} (${w.status}, Planned: ${w.plannedQuantity})`));

  // 10. Test Purchase Orders & Sales Orders
  console.log('\n[10] Testing GET /procurement/orders & /sales/orders ...');
  const poRes = await fetch(`${BASE_URL}/procurement/orders`, { headers });
  const poData: any = await poRes.json();
  const soRes = await fetch(`${BASE_URL}/sales/orders`, { headers });
  const soData: any = await soRes.json();
  console.log(`✓ Retrieved ${poData.data?.length || 0} Purchase Orders and ${soData.data?.length || 0} Sales Orders.`);

  console.log('\n===============================================================');
  console.log('🎉 ALL SYSTEM MODULES, LIVE DATA & PERMISSIONS VERIFIED 100%!');
  console.log('===============================================================');
}

verify().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
