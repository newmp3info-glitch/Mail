import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  let stripeClient: Stripe | null = null;
  function getStripe(): Stripe {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required for Premium payments');
      }
      stripeClient = new Stripe(key);
    }
    return stripeClient;
  }

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/mailbox/domains", async (req, res) => {
    try {
      const [gwRes, tmRes] = await Promise.all([
        fetch('https://api.mail.gw/domains?page=1').catch(() => null),
        fetch('https://api.mail.tm/domains?page=1').catch(() => null)
      ]);
      
      let domains: string[] = [];
      
      if (gwRes && gwRes.ok) {
        try {
          const gwData = await gwRes.json();
          if (gwData && gwData['hydra:member']) {
            domains = [...domains, ...gwData['hydra:member'].map((d: any) => d.domain)];
          } else if (Array.isArray(gwData)) {
            domains = [...domains, ...gwData.map((d: any) => d.domain)];
          }
        } catch (e) {}
      }
      
      if (tmRes && tmRes.ok) {
        try {
          const tmData = await tmRes.json();
          if (tmData && tmData['hydra:member']) {
            domains = [...domains, ...tmData['hydra:member'].map((d: any) => d.domain)];
          } else if (Array.isArray(tmData)) {
            domains = [...domains, ...tmData.map((d: any) => d.domain)];
          }
        } catch (e) {}
      }
      
      if (domains.length === 0) {
        throw new Error('Failed to fetch domains from both APIs');
      }
      
      domains.push('sharebot.net');
      
      res.json({ domains });
    } catch (error: any) {
      console.error("Error fetching domains:", error);
      // Fallback domains
      res.json({ domains: ['guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz', 'sharklasers.com', 'grr.la', 'spam4.me', 'sharebot.net'] });
    }
  });

  app.get("/api/mailbox/create", async (req, res) => {
    try {
      const requestedDomain = req.query.domain as string;
      let requestedName = req.query.name as string;
      
      const guerrillaDomains = [
        'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 
        'guerrillamail.org', 'guerrillamails.com', 'sharklasers.com', 
        'grr.la', 'spam4.me', 'pokemail.net'
      ];

      let customUser;
      if (requestedName && typeof requestedName === 'string') {
        customUser = requestedName.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        if (!customUser) {
          customUser = `rimpa_${Math.random().toString(36).substring(2, 10)}`;
        }
      } else {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        customUser = `rimpa_${randomSuffix}`;
      }

      // Handle mock domains (like sharebot.net which is private)
      if (requestedDomain === 'sharebot.net' || requestedDomain === 'oakon.com') {
        return res.json({
          email: `${customUser}@${requestedDomain}`,
          token: `mock:${requestedDomain}:${customUser}`,
          domains: []
        });
      }

      // Handle Guerrilla Mail domains
      if (requestedDomain && guerrillaDomains.includes(requestedDomain)) {
        let response = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          const text = await response.text();
          console.error("Guerrilla get_email_address error:", response.status, text);
          throw new Error(`Guerrilla API error: ${response.status}`);
        }
        let data = await response.json();
        const token = data.sid_token;
        
        response = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=${customUser}&sid_token=${token}&domain=${requestedDomain}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          // Fallback: try without specifying the domain
          response = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=${customUser}&sid_token=${token}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          
          if (!response.ok) {
            const fallbackText = await response.text();
            console.error("Guerrilla set_email_user fallback error:", response.status, fallbackText);
            throw new Error(`Guerrilla API error: ${response.status}`);
          }
        }
        data = await response.json();
        
        return res.json({
          email: `${customUser}@${requestedDomain}`,
          token: `guerrilla:${token}`,
          domains: []
        });
      }

      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0'
      ];
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

      // Handle mail.gw and mail.tm domains
      // 1. Get domains to check which API to use
      const reqHeaders = {
        'Accept': 'application/json',
        'User-Agent': randomUA
      };
      const [gwRes, tmRes] = await Promise.all([
        fetch('https://api.mail.gw/domains?page=1', { headers: reqHeaders }).catch(() => null),
        fetch('https://api.mail.tm/domains?page=1', { headers: reqHeaders }).catch(() => null)
      ]);
      
      let gwDomains: string[] = [];
      let tmDomains: string[] = [];
      
      if (gwRes && gwRes.ok) {
        try {
          const gwData = await gwRes.json();
          if (gwData && gwData['hydra:member']) gwDomains = gwData['hydra:member'].map((d: any) => d.domain);
          else if (Array.isArray(gwData)) gwDomains = gwData.map((d: any) => d.domain);
        } catch (e) {}
      }
      
      if (tmRes && tmRes.ok) {
        try {
          const tmData = await tmRes.json();
          if (tmData && tmData['hydra:member']) tmDomains = tmData['hydra:member'].map((d: any) => d.domain);
          else if (Array.isArray(tmData)) tmDomains = tmData.map((d: any) => d.domain);
        } catch (e) {}
      }
      
      const allDomains = [...gwDomains, ...tmDomains];
      
      if (allDomains.length === 0) {
        console.log("No domains fetched from mail.gw/mail.tm. Falling back to next provider.");
      }

      let finalDomain = requestedDomain;
      let isTmDomain = tmDomains.includes(finalDomain);
      let isGwDomain = gwDomains.includes(finalDomain);
      
      // If we have domains but the requested one isn't there, pick one
      if (!finalDomain || (!isTmDomain && !isGwDomain)) {
        if (gwDomains.length > 0) {
          finalDomain = gwDomains[0];
          isGwDomain = true;
        } else if (tmDomains.length > 0) {
          finalDomain = tmDomains[0];
          isTmDomain = true;
        }
      }

      let address = '';
      let password = '';
      let accountRes: Response | null = null;
      let retries = 0;
      const maxRetries = 2;

      // Only try Mail.tm/gw if we have a valid domain for them
      if (finalDomain && (isTmDomain || isGwDomain)) {
        const apiUrl = isTmDomain ? 'https://api.mail.tm' : 'https://api.mail.gw';

        while (retries < maxRetries) {
          if (retries > 0 || (!requestedName || typeof requestedName !== 'string')) {
            const randomSuffix = Math.random().toString(36).substring(2, 10);
            customUser = `rimpa_${randomSuffix}`;
          }
          
          address = `${customUser}@${finalDomain}`;
          password = Math.random().toString(36).substring(2, 15);

          accountRes = await fetch(`${apiUrl}/accounts`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': randomUA
            },
            body: JSON.stringify({ address, password })
          });

          if (accountRes.ok) break;

          let status = accountRes.status;
          if (status === 429) {
            console.log(`Mail API rate limited (429). Advancing to fallback.`);
            break; // Skip retries on 429
          }

          let errStr = '';
          try {
            const text = await accountRes.text();
            const errData = JSON.parse(text);
            errStr = errData['hydra:description'] || errData.message || text;
          } catch (e) {}

          if (errStr.includes('already used') || errStr.toLowerCase().includes('duplicate')) {
            retries++;
            continue;
          } else {
            console.error(`Account creation failed (Status: ${status}), falling back. Error:`, errStr);
            break;
          }
        }
      }

      // FALLBACK 1: Guerrilla Mail (Session based, supports setting user)
      if (!accountRes || !accountRes.ok) {
        console.log("Attempting Guerrilla Mail fallback...");
        const fallbackDomain = 'guerrillamail.com';
        try {
          let gmResponse = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address', {
            headers: { 'User-Agent': randomUA }
          });
          if (gmResponse.ok) {
            let gmData = await gmResponse.json();
            const gmToken = gmData.sid_token;
            if (gmToken) {
              await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=${customUser}&sid_token=${gmToken}&domain=${fallbackDomain}`, {
                headers: { 'User-Agent': randomUA }
              });
              return res.json({
                email: `${customUser}@${fallbackDomain}`,
                token: `guerrilla:${gmToken}`,
                domains: allDomains.length > 0 ? allDomains : [fallbackDomain]
              });
            }
          }
        } catch (err) {
          console.error("Guerrilla fallback failed:", err);
        }
      }

      // FALLBACK 2: 1secmail (Stateless, very reliable)
      if (!accountRes || !accountRes.ok) {
        console.log("Final fallback: 1secmail...");
        // 1secmail domains
        const secDomains = ['1secmail.com', '1secmail.org', '1secmail.net'];
        const secDomain = secDomains[Math.floor(Math.random() * secDomains.length)];
        const secUser = customUser || `rimpa_${Math.random().toString(36).substring(2, 10)}`;
        
        return res.json({
          email: `${secUser}@${secDomain}`,
          token: `1secmail:${secUser}:${secDomain}`,
          domains: allDomains.length > 0 ? allDomains : [secDomain]
        });
      }

      // 3. Get token (for Mail.tm/gw)
      const apiUrl = isTmDomain ? 'https://api.mail.tm' : 'https://api.mail.gw';
      
      const tokenRes = await fetch(`${apiUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password })
      });

      if (!tokenRes.ok) {
        let errStr = 'Failed to get token';
        try {
          const text = await tokenRes.text();
          const errData = JSON.parse(text);
          errStr = errData.message || errStr;
        } catch (e) {}
        throw new Error(errStr);
      }
      const tokenData = await tokenRes.json();

      res.json({
        email: address,
        token: `${isTmDomain ? 'mailtm' : 'mailgw'}:${tokenData.token}`,
        domains: allDomains
      });
    } catch (error: any) {
      console.error("Error generating email:", error);
      res.status(500).json({ error: error.message || "Failed to generate email" });
    }
  });

  app.get("/api/mailbox/list", async (req, res) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).json({ error: "Missing token" });

    try {
      if (token.startsWith('mock:')) {
        return res.json([]);
      }

      if (token.startsWith('1secmail:')) {
        const [, user, domain] = token.split(':');
        const response = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${user}&domain=${domain}`);
        if (!response.ok) throw new Error(`1secmail error: ${response.status}`);
        const data = await response.json();
        return res.json((data || []).map((msg: any) => ({
          id: msg.id,
          from: msg.from,
          subject: msg.subject,
          date: new Date(msg.date).getTime()
        })));
      }

      if (token.startsWith('guerrilla:')) {
        const actualToken = token.split(':')[1];
        const response = await fetch(`https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=${actualToken}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const messages = (data.list || []).filter((msg: any) => msg.mail_id !== '1' && msg.mail_from !== 'no-reply@guerrillamail.com');
        
        return res.json(messages.map((msg: any) => ({
          id: msg.mail_id,
          from: msg.mail_from,
          subject: msg.mail_subject,
          date: parseInt(msg.mail_timestamp) * 1000
        })));
      }

      // mail.gw and mail.tm
      const isTmToken = token.startsWith('mailtm:');
      const actualToken = token.startsWith('mailgw:') || isTmToken ? token.split(':')[1] : token;
      const apiUrl = isTmToken ? 'https://api.mail.tm' : 'https://api.mail.gw';
      
      const response = await fetch(`${apiUrl}/messages?page=1`, {
        headers: { 'Authorization': `Bearer ${actualToken}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      const messages = data['hydra:member'] || [];
      
      res.json(messages.map((msg: any) => ({
        id: msg.id,
        from: msg.from.address,
        subject: msg.subject,
        date: new Date(msg.createdAt).getTime()
      })));
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/mailbox/read", async (req, res) => {
    const { token, id } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).json({ error: "Missing token" });

    try {
      if (token.startsWith('1secmail:')) {
        const [, user, domain] = token.split(':');
        const response = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${user}&domain=${domain}&id=${id}`);
        if (!response.ok) throw new Error(`1secmail error: ${response.status}`);
        const data = await response.json();
        return res.json({
          id: data.id,
          from: data.from,
          subject: data.subject,
          date: new Date(data.date).getTime(),
          htmlBody: data.htmlBody || data.body,
          textBody: data.textBody || data.body
        });
      }

      if (token.startsWith('guerrilla:')) {
        const actualToken = token.split(':')[1];
        const response = await fetch(`https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${id}&sid_token=${actualToken}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return res.json({
          id: data.mail_id,
          from: data.mail_from,
          subject: data.mail_subject,
          date: parseInt(data.mail_timestamp) * 1000,
          htmlBody: data.mail_body,
          textBody: data.mail_excerpt
        });
      }

      // mail.gw and mail.tm
      const isTmToken = token.startsWith('mailtm:');
      const actualToken = token.startsWith('mailgw:') || isTmToken ? token.split(':')[1] : token;
      const apiUrl = isTmToken ? 'https://api.mail.tm' : 'https://api.mail.gw';
      
      const response = await fetch(`${apiUrl}/messages/${id}`, {
        headers: { 'Authorization': `Bearer ${actualToken}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      res.json({
        id: data.id,
        from: data.from.address,
        subject: data.subject,
        date: new Date(data.createdAt).getTime(),
        htmlBody: data.html ? data.html[0] : '',
        textBody: data.text || ''
      });
    } catch (error) {
      console.error("Error fetching message details:", error);
      res.status(500).json({ error: "Failed to fetch message details" });
    }
  });

  app.post("/api/create-razorpay-order", async (req, res) => {
    try {
      const { priceId } = req.body;
      const amount = priceId === 'annual' ? 245000 : (priceId === 'quarterly' ? 80000 : (priceId === 'weekly' ? 12000 : 32500)); // amount in paise

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ 
          error: "Razorpay credentials not configured. To make this standard production app collect real money, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env variables." 
        });
      }

      // We dynamically import razorpay to avoid crashing if it's somehow missing, 
      // but we installed it so it should be fine.
      const Razorpay = require('razorpay');
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount,
        currency: "INR",
        receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
      };

      const order = await instance.orders.create(options);
      
      res.json({
        id: order.id,
        currency: order.currency,
        amount: order.amount,
        key: process.env.RAZORPAY_KEY_ID
      });
    } catch (error: any) {
      console.error("Razorpay error:", error);
      res.status(500).json({ error: error.message || "Failed to create Razorpay order" });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripe = getStripe();
      const { priceId, returnUrl } = req.body;
      
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: 'Rimpa Mail Premium',
                description: priceId === 'annual' ? '1 Year Premium Access' : '1 Month Premium Access',
              },
              unit_amount: priceId === 'annual' ? 245000 : 32500, // ₹2450 or ₹325
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${returnUrl}?canceled=true`,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mailbox/remove", async (req, res) => {
    const { token, id } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).json({ error: "Missing token" });

    try {
      if (token.startsWith('1secmail:')) {
        return res.json({ success: true }); // 1secmail doesn't support manual deletion via API
      }

      if (token.startsWith('guerrilla:')) {
        const actualToken = token.split(':')[1];
        const response = await fetch(`https://api.guerrillamail.com/ajax.php?f=del_email&email_ids[]=${id}&sid_token=${actualToken}`, {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return res.json({ success: true });
      }

      // mail.gw and mail.tm
      const isTmToken = token.startsWith('mailtm:');
      const actualToken = token.startsWith('mailgw:') || isTmToken ? token.split(':')[1] : token;
      const apiUrl = isTmToken ? 'https://api.mail.tm' : 'https://api.mail.gw';
      
      const response = await fetch(`${apiUrl}/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${actualToken}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
