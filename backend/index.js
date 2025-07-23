import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import axios from "axios"
import * as cheerio from "cheerio"
import admin from "firebase-admin"
   import puppeteer from "puppeteer";

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors())

// Webhook endpoint - must be raw body for Stripe
app.use("/webhook/stripe", express.raw({ type: "application/json" }))

// Regular JSON middleware for other routes
app.use(express.json())

// Import Stripe after environment is loaded
const stripe = await import("stripe").then((module) =>
  module.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  }),
)

// Subscription plans
const SUBSCRIPTION_PLANS = {
  basic: {
    name: "Basic Plan",
    price: 999, // $9.99 in cents
    currency: "usd",
    interval: "month",
    features: ["Access to basic playlists", "Standard quality", "Limited downloads"],
  },
  premium: {
    name: "Premium Plan",
    price: 1999, // $19.99 in cents
    currency: "usd",
    interval: "month",
    features: ["Access to all playlists", "High quality", "Unlimited downloads", "Offline mode"],
  },
}

// API endpoint for creating checkout sessions
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { planType, userId, userEmail } = req.body

    if (!planType || !userId || !userEmail) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const plan = SUBSCRIPTION_PLANS[planType]
    if (!plan) {
      return res.status(400).json({ message: "Invalid plan type" })
    }

    // Create or retrieve customer
    let customer
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: plan.name,
              description: plan.features.join(", "),
            },
            unit_amount: plan.price,
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/subscription`,
      metadata: {
        userId: userId,
        planType: planType,
      },
    })

    res.status(200).json({ sessionId: session.id })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Scrape playlists from mapsofthemind.com/playlists
app.get("/api/import-playlists", async (req, res) => {
  let browser;
  
  try {
    const url = "https://mapsofthemind.com/playlists/";
    const password = "play";

    console.log("🚀 Starting playlist scraping process...");
    console.log("📍 Target URL:", url);
    
    // Launch browser with comprehensive options
    console.log("🌐 Launching browser...");
    browser = await puppeteer.launch({ 
      headless: true, 
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    const page = await browser.newPage();
    console.log("✅ Browser launched successfully");
    
    // Set viewport and user agent
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    console.log("🔧 Browser configured");
    
    console.log("📡 Navigating to URL...");
    await page.goto(url, { 
      waitUntil: "networkidle0",
      timeout: 30000
    });
    console.log("✅ Page loaded");

    // Take screenshot for debugging
    console.log("📸 Taking initial screenshot...");
    // await page.screenshot({ path: 'initial-page.png' }); // Uncomment if you want screenshots
    
    // Check what's on the page initially
    const initialContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyLength: document.body.innerHTML.length,
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        allInputs: Array.from(document.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder
        }))
      };
    });
    
    console.log("🔍 Initial page analysis:");
    console.log("  - Title:", initialContent.title);
    console.log("  - Body HTML length:", initialContent.bodyLength);
    console.log("  - Has password input:", initialContent.hasPasswordInput);
    console.log("  - All inputs found:", initialContent.allInputs);

    // Handle password protection
  // Handle password protection
if (initialContent.hasPasswordInput) {
  console.log("🔐 Password input detected, attempting to authenticate...");
  
  try {
    // Wait a moment for any dynamic loading
    await new Promise(r => setTimeout(r, 2000));
    
    // Try multiple approaches to find password input
    let passwordInput = null;
    
    // Method 1: Try standard password input
    passwordInput = await page.$('input[type="password"]');
    
    // Method 2: If not found, try by common IDs/names
    if (!passwordInput) {
      passwordInput = await page.$('input[name*="password"]');
    }
    
    // Method 3: Try by common class names
    if (!passwordInput) {
      passwordInput = await page.$('input[class*="password"]');
    }
    
    // Method 4: Try any input that might be password-related
    if (!passwordInput) {
      passwordInput = await page.$('input[id*="pass"]');
    }
    
    if (passwordInput) {
      console.log("✅ Password input found");
      
      // Clear any existing content and type password
      await passwordInput.click({ clickCount: 3 }); // Select all
      await passwordInput.type(password);
      console.log("⌨️  Password entered");
      
      // Try different ways to submit
      try {
        await page.keyboard.press('Enter');
        console.log("↩️  Enter key pressed");
      } catch (e) {
        console.log("⚠️  Enter failed, trying form submission...");
        // Try to find and click submit button
        const submitBtn = await page.$('input[type="submit"], button[type="submit"], button');
        if (submitBtn) {
          await submitBtn.click();
          console.log("🔘 Submit button clicked");
        }
      }
      
      // Wait for navigation or content change
      try {
        await page.waitForNavigation({ 
          waitUntil: "networkidle0", 
          timeout: 10000 
        });
        console.log("✅ Navigation completed after password");
      } catch (navError) {
        console.log("⚠️  No navigation detected, checking for content change...");
        
        // Wait and check if content changed
        await new Promise(r => setTimeout(r, 5000));
        const afterPasswordContent = await page.evaluate(() => document.body.innerHTML.length);
        console.log("📏 Content length after password:", afterPasswordContent);
        
        if (afterPasswordContent !== initialContent.bodyLength) {
          console.log("✅ Content changed, proceeding...");
        } else {
          console.log("❌ Content didn't change, password might have failed");
          // Try to take a screenshot to see what's happening
          console.log("📸 Taking screenshot for debugging...");
          // await page.screenshot({ path: 'after-password-attempt.png', fullPage: true });
        }
      }
    } else {
      console.log("❌ No password input found with any method");
      console.log("🔍 Available inputs on page:");
      const allInputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          className: input.className,
          placeholder: input.placeholder
        }))
      );
      console.log(allInputs);
    }
    
  } catch (passwordError) {
    console.log("❌ Password handling failed:", passwordError.message);
    console.log("🔄 Continuing with direct scraping...");
  }
} else {
  console.log("🔓 No password protection detected");
}

    // Wait for content to fully load
    console.log("⏳ Waiting for content to load...");
    await new Promise(r => setTimeout(r, 5000));

    // Scroll to trigger any lazy loading
    console.log("📜 Scrolling to trigger lazy loading...");
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            console.log("Scrolling completed");
            resolve();
          }
        }, 100);
      });
    });
    
    await new Promise(r => setTimeout(r, 3000));
    console.log("✅ Scrolling completed");

    // Extract comprehensive page data
    console.log("🔍 Extracting page content...");
    const pageData = await page.evaluate(() => {
      // Get all links
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.href,
        text: a.textContent.trim(),
        parentText: a.parentElement ? a.parentElement.textContent.trim() : '',
        className: a.className,
        id: a.id
      }));

      // Get all text content
      const bodyText = document.body.innerText;
      
      // Get specific elements that might contain playlists
      const h1Elements = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim());
      const h2Elements = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      const h3Elements = Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim());
      const pElements = Array.from(document.querySelectorAll('p')).map(p => p.textContent.trim());
      
      return {
        links,
        bodyText,
        htmlLength: document.body.innerHTML.length,
        h1Elements,
        h2Elements,
        h3Elements,
        pElements: pElements.slice(0, 50), // Limit to first 50 paragraphs
        title: document.title
      };
    });

    console.log("📊 Extraction results:");
    console.log("  - Page title:", pageData.title);
    console.log("  - HTML length:", pageData.htmlLength);
    console.log("  - Links found:", pageData.links.length);
    console.log("  - H1 elements:", pageData.h1Elements.length);
    console.log("  - H2 elements:", pageData.h2Elements.length);
    console.log("  - H3 elements:", pageData.h3Elements.length);
    console.log("  - P elements:", pageData.pElements.length);

    // Show sample of extracted links
    const musicLinks = pageData.links.filter(link => 
      link.href.includes('spotify') || 
      link.href.includes('mixcloud') || 
      link.href.includes('youtube') ||
      link.href.includes('soundcloud')
    );
    console.log("🎵 Music platform links found:", musicLinks.length);
    console.log("🎵 Sample music links:", musicLinks.slice(0, 5));

    // Process text content
    const lines = pageData.bodyText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log("📝 Text processing:");
    console.log("  - Total lines extracted:", lines.length);
    console.log("  - First 20 lines:", lines.slice(0, 20));
    console.log("  - Sample H2 elements:", pageData.h2Elements.slice(0, 10));

    // Build playlists array
    console.log("🎼 Building playlists...");
    const playlists = [];
    
    // Method 1: Process H2 elements (common for playlist titles)
    console.log("🔍 Method 1: Processing H2 elements...");
    pageData.h2Elements.forEach((h2Text, index) => {
      if (h2Text && h2Text.length > 3 && h2Text.length < 150) {
        // Find corresponding description from P elements
        let description = '';
        if (pageData.pElements[index] && pageData.pElements[index].length > 10) {
          description = pageData.pElements[index];
        }
        
        // Find matching link
        let link = '';
        let platform = 'Unknown';
        
        const matchingLink = pageData.links.find(l => 
          l.text.toLowerCase().includes(h2Text.toLowerCase().substring(0, 15)) ||
          l.parentText.toLowerCase().includes(h2Text.toLowerCase().substring(0, 15))
        );
        
        if (matchingLink) {
          link = matchingLink.href;
          if (link.includes('spotify')) platform = 'Spotify';
          else if (link.includes('mixcloud')) platform = 'Mixcloud';
          else if (link.includes('youtube')) platform = 'YouTube';
          else if (link.includes('soundcloud')) platform = 'SoundCloud';
          else platform = 'External Link';
        }
        
        playlists.push({
          title: h2Text,
          description: description || '',
          platform,
          link: link || '',
          source: 'H2 element'
        });
      }
    });

    // Method 2: Process text lines (original method)
    console.log("🔍 Method 2: Processing text lines...");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line looks like a playlist title
      if (
        (line.includes('–') && line.length < 120) ||
        (line.toLowerCase().includes('playlist') && line.length < 100) ||
        (line.toLowerCase().includes('mix') && line.length < 100) ||
        (line.match(/^[A-Z].*[a-z].*/) && line.length > 10 && line.length < 100)
      ) {
        let description = '';
        
        // Look for description in next few lines
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          if (lines[j] && 
              !lines[j].includes('–') && 
              lines[j].length > 15 && 
              lines[j].length < 300 &&
              !lines[j].toLowerCase().includes('playlist') &&
              !lines[j].toLowerCase().includes('click here')) {
            description = lines[j];
            break;
          }
        }

        // Find matching link
        let link = '';
        let platform = 'Unknown';

        // Try exact match first
        const exactMatch = pageData.links.find(l => l.text.trim() === line.trim());
        if (exactMatch && (exactMatch.href.includes('spotify') || 
                          exactMatch.href.includes('mixcloud') || 
                          exactMatch.href.includes('youtube') ||
                          exactMatch.href.includes('soundcloud'))) {
          link = exactMatch.href;
        } else {
          // Try fuzzy matching
          const fuzzyMatch = pageData.links.find(l => {
            const searchTerm = line.substring(0, Math.min(20, line.length));
            return (l.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   l.parentText.toLowerCase().includes(searchTerm.toLowerCase())) &&
                  (l.href.includes('spotify') || 
                   l.href.includes('mixcloud') || 
                   l.href.includes('youtube') ||
                   l.href.includes('soundcloud'));
          });
          
          if (fuzzyMatch) {
            link = fuzzyMatch.href;
          }
        }

        // Determine platform
        if (link) {
          if (link.includes('spotify')) platform = 'Spotify';
          else if (link.includes('mixcloud')) platform = 'Mixcloud';
          else if (link.includes('youtube')) platform = 'YouTube';
          else if (link.includes('soundcloud')) platform = 'SoundCloud';
          else platform = 'External Link';
        }

        // Only add if we have a reasonable title and it's not a duplicate
        if (line.length > 5 && !playlists.some(p => p.title === line)) {
          playlists.push({
            title: line,
            description: description || '',
            platform,
            link: link || '',
            source: 'Text line'
          });
        }
      }
    }

    // Remove duplicates and clean up
    const uniquePlaylists = playlists.filter((playlist, index, self) => 
      index === self.findIndex(p => p.title.toLowerCase() === playlist.title.toLowerCase())
    );

    console.log("🎼 Playlist extraction complete:");
    console.log("  - Total playlists found:", uniquePlaylists.length);
    console.log("  - With links:", uniquePlaylists.filter(p => p.link).length);
    console.log("  - Spotify links:", uniquePlaylists.filter(p => p.platform === 'Spotify').length);
    console.log("  - Mixcloud links:", uniquePlaylists.filter(p => p.platform === 'Mixcloud').length);
    console.log("  - YouTube links:", uniquePlaylists.filter(p => p.platform === 'YouTube').length);

    // Show sample playlists
    console.log("📋 Sample playlists:");
    uniquePlaylists.slice(0, 5).forEach((playlist, index) => {
      console.log(`  ${index + 1}. "${playlist.title}" (${playlist.platform}) - ${playlist.link ? 'Has link' : 'No link'}`);
    });

    // Save to Firestore if requested
    if (req.query.save === "true" && uniquePlaylists.length > 0) {
      console.log("💾 Saving to Firestore...");
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
      
      const db = admin.firestore();
      const docRef = await db.collection("playlistGroups").add({
        creator: "Imported from mapsofthemind.com",
        description: `Imported playlists - ${new Date().toLocaleString()}`,
        tags: ["imported", "mapsofthemind"],
        thumbnail: null,
        access: "free",
        playlists: uniquePlaylists,
        createdAt: new Date(),
        importStats: {
          totalFound: uniquePlaylists.length,
          withLinks: uniquePlaylists.filter(p => p.link).length,
          platforms: {
            spotify: uniquePlaylists.filter(p => p.platform === 'Spotify').length,
            mixcloud: uniquePlaylists.filter(p => p.platform === 'Mixcloud').length,
            youtube: uniquePlaylists.filter(p => p.platform === 'YouTube').length,
            soundcloud: uniquePlaylists.filter(p => p.platform === 'SoundCloud').length
          }
        }
      });
      
      console.log("✅ Saved to Firestore with ID:", docRef.id);
      return res.json({ 
        success: true, 
        imported: uniquePlaylists.length,
        firestoreId: docRef.id,
        playlists: uniquePlaylists 
      });
    }

    console.log("🎉 Scraping completed successfully!");
    res.json({ 
      playlists: uniquePlaylists,
      stats: {
        total: uniquePlaylists.length,
        withLinks: uniquePlaylists.filter(p => p.link).length,
        platforms: {
          spotify: uniquePlaylists.filter(p => p.platform === 'Spotify').length,
          mixcloud: uniquePlaylists.filter(p => p.platform === 'Mixcloud').length,
          youtube: uniquePlaylists.filter(p => p.platform === 'YouTube').length,
          soundcloud: uniquePlaylists.filter(p => p.platform === 'SoundCloud').length
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Error scraping playlists:", error);
    console.error("📍 Error stack:", error.stack);
    
    res.status(500).json({ 
      message: "Failed to scrape playlists", 
      error: error.message,
      playlists: [],
      timestamp: new Date().toISOString()
    });
  } finally {
    // Always close the browser
    if (browser) {
      try {
        await browser.close();
        console.log("🌐 Browser closed successfully");
      } catch (e) {
        console.error("❌ Error closing browser:", e);
      }
    }
  }
});

   // ...existing imports...

   app.get("/api/import-playlists", async (req, res) => {
     try {
       const url = "https://mapsofthemind.com/playlists/";
       const password = "play"; // Password for the page

       console.log("Launching browser...");
       const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
       const page = await browser.newPage();
       console.log("Navigating to URL...");
       await page.goto(url, { waitUntil: "domcontentloaded" });

       // Wait for the password input to appear
       await page.waitForSelector('input[type="password"]', { timeout: 10000 });
       // Type the password
       await page.type('input[type="password"]', password);
       // Submit the form (press Enter)
       await page.keyboard.press('Enter');
       // Wait for navigation or content to load
       await page.waitForNavigation({ waitUntil: "domcontentloaded" });
       // Optionally, wait a bit more for JS-rendered content
       await new Promise(r => setTimeout(r, 3000));

       // Scroll to bottom to trigger lazy loading
       await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
       await new Promise(r => setTimeout(r, 2000));

       // Extract all links and their surrounding text
       const links = await page.evaluate(() => {
         return Array.from(document.querySelectorAll('a')).map(a => ({
           href: a.href,
           text: a.textContent.trim(),
           parentText: a.parentElement ? a.parentElement.textContent.trim() : ''
         }));
       });

       // Extract all visible text as before
       const bodyText = await page.evaluate(() => document.body.innerText);
       const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
       console.log('Extracted lines sample:', lines.slice(0, 100));
       console.log('Total lines extracted:', lines.length);

       const playlists = [];
       for (let i = 0; i < lines.length; i++) {
         if (
           (lines[i].includes('–') && lines[i].length < 120) ||
           lines[i].toLowerCase().includes('playlist')
         ) {
           let description = '';
           if (lines[i + 1] && !lines[i + 1].includes('–') && lines[i + 1].length < 200) {
             description = lines[i + 1];
           }

           // Try to find a link for this playlist
           let link = '';
           let platform = '';

           // 1. Exact match with <a> text
           const exact = links.find(l => l.text === lines[i]);
           if (exact) {
             link = exact.href;
             if (link.includes('spotify')) platform = 'Spotify';
             else if (link.includes('mixcloud')) platform = 'Mixcloud';
             else if (link.includes('youtube')) platform = 'YouTube';
             else platform = 'External Link';
           } else {
             // 2. Fuzzy match (as before)
             const found = links.find(
               l =>
                 l.text.includes(lines[i]) ||
                 l.parentText.includes(lines[i])
             );
             if (found) {
               link = found.href;
               if (link.includes('spotify')) platform = 'Spotify';
               else if (link.includes('mixcloud')) platform = 'Mixcloud';
               else if (link.includes('youtube')) platform = 'YouTube';
               else platform = 'External Link';
             }
           }

           playlists.push({
             title: lines[i],
             description,
             platform,
             link
           });
         }
       }
       console.log('Total playlists extracted:', playlists.length);
       console.log('Sample playlists:', playlists.slice(0, 5));

       res.json({ playlists });
     } catch (error) {
       console.error("Error scraping playlists:", error);
       res.status(500).json({ message: "Failed to scrape playlists" });
     }
   });
// Stripe webhook handler
app.post("/webhook/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"]
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object)
        break

      case "invoice.payment_succeeded":
        console.log("Payment succeeded for invoice:", event.data.object.id)
        break

      case "invoice.payment_failed":
        console.log("Payment failed for invoice:", event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error("Error handling webhook:", error)
    res.status(500).json({ message: "Webhook handler failed" })
  }
})

async function handleCheckoutSessionCompleted(session) {
  const { userId, planType } = session.metadata
  console.log(`Subscription completed for user ${userId} with plan ${planType}`)

  // Here you would save to Firebase
  // For now, just log the success
  console.log("Subscription data:", {
    userId,
    planType,
    customerId: session.customer,
    subscriptionId: session.subscription,
  })
}

async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id)
}

async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id)
}

// Comment out the local server listen for Firebase Functions deployment
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`)
})

// Export the Express app as a Firebase HTTPS function
import { https } from 'firebase-functions';
export const api = https.onRequest(app);
