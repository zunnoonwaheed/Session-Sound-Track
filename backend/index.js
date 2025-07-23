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
  try {
    const url = "https://mapsofthemind.com/playlists/";
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(data.slice(0, 5000)); // Print first 5000 chars of HTML for debugging
    const $ = cheerio.load(data);

    const playlists = [];
    $("h2").each((i, el) => {
      const title = $(el).text().trim();
      // Get the next <p> for description
      const description = $(el).next("p").text().trim();

      // Try to find the first link after the <h2> (could be in <ul>, <li>, or <p>)
      let link = null;
      let platform = "Spotify";
      let next = $(el).next();
      let tries = 0;
      while (next.length && !link && tries < 5) {
        // Look for <a> in this element
        const a = next.find("a").first();
        if (a.length) {
          link = a.attr("href");
          if (link && link.includes("mixcloud")) platform = "Mixcloud";
          if (link && link.includes("youtube")) platform = "YouTube";
        }
        next = next.next();
        tries++;
      }

      if (title && link) {
        playlists.push({
          title,
          description,
          platform,
          link
        });
      }
    });

    if (req.query.save === "true") {
      // Save to Firestore using Admin SDK
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
      const db = admin.firestore();
      await db.collection("playlistGroups").add({
        creator: "Imported from mapsofthemind.com",
        description: `Imported playlists - ${new Date().toLocaleString()}`,
        tags: [],
        thumbnail: null,
        access: "free",
        playlists,
        createdAt: new Date(),
      });
      return res.json({ success: true, imported: playlists.length });
    }
    res.json({ playlists });
  } catch (error) {
    console.error("Error scraping playlists:", error);
    res.status(500).json({ message: "Failed to scrape playlists" });
  }
});

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
// app.listen(port, () => {
//   console.log(`Backend server running on port ${port}`)
// })

// Export the Express app as a Firebase HTTPS function
import { https } from 'firebase-functions';
export const api = https.onRequest(app);
