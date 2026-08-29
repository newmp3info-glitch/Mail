import axios from 'axios';

async function run() {
  try {
    const res = await axios.get('https://www.1secmail.com/api/v1/?action=getDomainList', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    console.log(res.data);
  } catch (e: any) {
    console.log('error', e.response?.status, e.response?.data);
  }
}
run();
