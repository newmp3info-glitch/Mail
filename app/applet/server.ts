import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/mailbox/domains", async (req, res) => {
    try {
      let mailgwDomains: string[] = [];
      try {
        const domainRes = await fetch('https://api.mail.gw/domains?page=1');
        if (domainRes.ok) {
          const text = await domainRes.text();
          const domainData = JSON.parse(text);
          if (domainData['hydra:member']) {
            mailgwDomains = domainData['hydra:member'].map((d: any) => d.domain);
          }
        }
      } catch (e) {
        console.error('Failed to fetch mail.gw domains:', e);
      }
      
      const guerrillaDomains = [
        'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 
        'guerrillamail.net', 'guerrillamail.org', 'guerrillamails.com', 'sharklasers.com', 
        'grr.la', 'spam4.me', 'pokemail.net'
      ];

      res.json({ domains: [...mailgwDomains, ...guerrillaDomains] });
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ error: "Failed to fetch domains" });
    }
  });

  app.get("/api/mailbox/create", async (req, res) => {
    try {
      const requestedDomain = req.query.domain as string;
      const requestedName = req.query.name as string;
      
      const guerrillaDomains = [
        'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 
        'guerrillamail.net', 'guerrillamail.org', 'guerrillamails.com', 'sharklasers.com', 
        'grr.la', 'spam4.me', 'pokemail.net'
      ];

      let customUser;
      if (requestedName && typeof requestedName === 'string') {
        customUser = requestedName;
      } else {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        customUser = `rimpa_${randomSuffix}`;
      }

      // Handle Guerrilla Mail domains
      if (requestedDomain && guerrillaDomains.includes(requestedDomain)) {
        let response = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`Guerrilla Mail API error (get): ${response.status} ${text}`);
        }
        let data = await response.json();
        const token = data.sid_token;
        
        response = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=${customUser}&sid_token=${token}&domain=${requestedDomain}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`Guerrilla Mail API error (set): ${response.status} ${text}`);
        }
        data = await response.json();
        
        return res.json({
          email: data.email_addr,
          token: `guerrilla:${token}`,
          domains: []
        });
      }

      // Handle mail.gw domains
      let apiBase = 'https://api.mail.gw';
      let tokenPrefix = 'mailgw';

      // 1. Get domains
      let domains: string[] = [];
      try {
        const domainRes = await fetch(`${apiBase}/domains?page=1`);
        if (domainRes.ok) {
          const text = await domainRes.text();
          const domainData = JSON.parse(text);
          if (domainData['hydra:member']) {
            domains = domainData['hydra:member'].map((d: any) => d.domain);
          }
        }
      } catch (e) {
        console.error('Failed to fetch mail.gw domains in create:', e);
      }
      
      if (domains.length === 0) {
        domains = ['oakon.com', 'teihu.com']; // fallback
      }
      
      let finalDomain = requestedDomain || domains[0];
      if (!domains.includes(finalDomain)) {
        finalDomain = domains[0]; // Fallback to a valid domain if the requested one is no longer valid
      }
      
      let address = `${customUser}@${finalDomain}`;
      let password = Math.random().toString(36).substring(2, 15);

      // 2. Create account (with retry for already used addresses)
      let accountRes;
      let accountRetries = 3;
      while (accountRetries > 0) {
        accountRes = await fetch(`${apiBase}/accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, password })
        });
        
        if (accountRes.ok) break;
        
        let errDesc = `Failed to create account (Status: ${accountRes.status})`;
        try {
          const text = await accountRes.text();
          try {
            const errData = JSON.parse(text);
            errDesc = errData['hydra:description'] || errData.message || errDesc;
          } catch (e) {
            errDesc = `${errDesc}: ${text}`;
          }
        } catch (e) {}
        
        if (errDesc.includes('already used')) {
          if (!req.query.name) {
            // If it's a random name and it's already used, generate a new one and retry
            const randomSuffix = Math.random().toString(36).substring(2, 10);
            customUser = `rimpa_${randomSuffix}`;
            address = `${customUser}@${finalDomain}`;
            accountRetries--;
          } else {
            // If it's a user-requested name, return a friendly error
            throw new Error('This email address is already taken. Please try a different name.');
          }
        } else {
          // Other errors
          throw new Error(errDesc);
        }
      }
      
      if (!accountRes || !accountRes.ok) {
        throw new Error('Failed to create account after retries');
      }

      // 3. Get token (with retry)
      let tokenRes;
      let tokenData;
      let retries = 3;
      
      // Add a small delay before the first token request to allow account creation to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      while (retries > 0) {
        tokenRes = await fetch(`${apiBase}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, password })
        });
        
        if (tokenRes.ok) {
          tokenData = await tokenRes.json();
          break;
        }
        
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!tokenRes || !tokenRes.ok) {
        let errDesc = 'Failed to get token';
        try {
          if (tokenRes) {
            const status = tokenRes.status;
            const text = await tokenRes.text();
            errDesc = `Failed to get token (Status: ${status}): ${text}`;
          }
        } catch (e) {}
        throw new Error(errDesc);
      }

      res.json({
        email: address,
        token: `${tokenPrefix}:${tokenData.token}`,
        domains: domains
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
      if (token.startsWith('guerrilla:')) {
        const actualToken = token.split(':')[1];
        const response = await fetch(`https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=${actualToken}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`Guerrilla Mail API error: ${response.status} ${text}`);
        }
        const data = await response.json();
        
        const messages = (data.list || []).filter((msg: any) => msg.mail_id !== '1' && msg.mail_from !== 'no-reply@guerrillamail.com');
        
        return res.json(messages.map((msg: any) => ({
          id: msg.mail_id,
          from: msg.mail_from,
          subject: msg.mail_subject,
          date: parseInt(msg.mail_timestamp) * 1000
        })));
      }

      // mail.gw
      let apiBase = 'https://api.mail.gw';
      let actualToken = token;
      
      if (token.startsWith('mailgw:')) {
        actualToken = token.split(':')[1];
      }

      const response = await fetch(`${apiBase}/messages?page=1`, {
        headers: { 'Authorization': `Bearer ${actualToken}` }
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`mail.gw API error: ${response.status} ${text}`);
      }
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
      if (token.startsWith('guerrilla:')) {
        const actualToken = token.split(':')[1];
        const response = await fetch(`https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${id}&sid_token=${actualToken}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`Guerrilla Mail API error: ${response.status} ${text}`);
        }
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

      // mail.gw
      let apiBase = 'https://api.mail.gw';
      let actualToken = token;
      
      if (token.startsWith('mailgw:')) {
        actualToken = token.split(':')[1];
      }

      const response = await fetch(`${apiBase}/messages/${id}`, {
        headers: { 'Authorization': `Bearer ${actualToken}` }
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`mail.gw API error: ${response.status} ${text}`);
      }
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

  app.post("/api/mailbox/remove", async (req, res) => {
    const { token, id } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).json({ error: "Missing token" });

    try {
      if (token.startsWith('guerrilla:')) {
        const actualToken = token.split(':')[1];
        const response = await fetch(`https://api.guerrillamail.com/ajax.php?f=del_email&email_ids[]=${id}&sid_token=${actualToken}`, {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`Guerrilla Mail API error: ${response.status} ${text}`);
        }
        return res.json({ success: true });
      }

      // mail.gw
      let apiBase = 'https://api.mail.gw';
      let actualToken = token;
      
      if (token.startsWith('mailgw:')) {
        actualToken = token.split(':')[1];
      }

      const response = await fetch(`${apiBase}/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${actualToken}` }
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`mail.gw API error: ${response.status} ${text}`);
      }
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
