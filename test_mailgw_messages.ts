async function run() {
  try {
    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3NzU1OTM2MDMsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJ1c2VybmFtZSI6InRlc3R1c2VyXzRnYWUxcnF2QG9ha29uLmNvbSIsImlkIjoiNjlkNTY4ODIyZDI5M2MyOGIwNzE0ZTNhIiwibWVyY3VyZSI6eyJzdWJzY3JpYmUiOlsiL2FjY291bnRzLzY5ZDU2ODgyMmQyOTNjMjhiMDcxNGUzYSJdfX0.q95kHM348yzy5Sx_Ne_0aDvxY4gg_dAt3hhJmjXruEgBTH1A_FpicmdR1MzjNCbKPlsu27sUzDXnwwC8upkE9w';
    
    const res = await fetch('https://api.mail.gw/messages?page=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Messages:', data);
  } catch (e) { console.log('error', e); }
}
run();
