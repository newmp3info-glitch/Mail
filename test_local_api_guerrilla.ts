async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/mailbox/create?domain=guerrillamail.com');
    const data = await res.json();
    console.log('Create Guerrilla:', data);
    
    if (data.token) {
      const listRes = await fetch(`http://localhost:3000/api/mailbox/list?token=${data.token}`);
      const listData = await listRes.json();
      console.log('List:', listData);
    }
  } catch (e) { console.log('error', e); }
}
run();
