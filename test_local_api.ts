async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/mailbox/create');
    const data = await res.json();
    console.log('Create:', data);
    
    if (data.token) {
      const listRes = await fetch(`http://localhost:3000/api/mailbox/list?token=${data.token}`);
      const listData = await listRes.json();
      console.log('List:', listData);
    }
  } catch (e) { console.log('error', e); }
}
run();
