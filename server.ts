import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  serviceType: string;
  projectScope: string;
  budgetTier: string;
  turnaroundUrgency: string;
  description: string;
  referenceLinks?: string;
  status: "new" | "reviewing" | "contacted";
  createdAt: string;
}

const enquiries: Enquiry[] = [
  {
    id: "ENQ-1001",
    name: "Aarav Sharma",
    email: "aarav.studios@gmail.com",
    phone: "+91 98765 43210",
    serviceType: "Video Editing",
    projectScope: "YouTube Shorts & Reels Batch (15 videos)",
    budgetTier: "Economy / Low Budget ($120 - $250)",
    turnaroundUrgency: "Fast (48 Hours)",
    description: "Looking for engaging fast cuts, sound effects, subtitles and DaVinci Resolve color grading for fitness reels.",
    status: "new",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "ENQ-1002",
    name: "Priya & Rohit",
    email: "priyarohit.wedding@outlook.com",
    phone: "+91 91234 56789",
    serviceType: "Marriage Album & Wedding Video",
    projectScope: "Wedding Album (40 Spreads) + 3-Min Cinematic Teaser",
    budgetTier: "Standard Package ($300 - $600)",
    turnaroundUrgency: "Standard (3-5 Days)",
    description: "Need magazine-style marriage photobook design with color corrected portraits and slow-mo teaser edit.",
    status: "reviewing",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", appName: "MAHI CLICZ AND CREATIVES" });
  });

  // API: Get enquiries list
  app.get("/api/enquiries", (req, res) => {
    res.json({ success: true, count: enquiries.length, enquiries });
  });

  // API: Create new enquiry
  app.post("/api/enquiries", (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        serviceType,
        projectScope,
        budgetTier,
        turnaroundUrgency,
        description,
        referenceLinks
      } = req.body;

      if (!name || !email || !description) {
        return res.status(400).json({
          success: false,
          error: "Name, email, and project description are required."
        });
      }

      const newEnquiry: Enquiry = {
        id: `ENQ-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`,
        name,
        email,
        phone: phone || "",
        serviceType: serviceType || "General Photography & Editing",
        projectScope: projectScope || "Custom Creative Project",
        budgetTier: budgetTier || "Affordable Budget",
        turnaroundUrgency: turnaroundUrgency || "Standard (3-5 Days)",
        description,
        referenceLinks: referenceLinks || "",
        status: "new",
        createdAt: new Date().toISOString()
      };

      enquiries.unshift(newEnquiry);

      console.log(`[Enquiry Received] From: ${name} <${email}> | Service: ${serviceType} | ID: ${newEnquiry.id}`);

      return res.status(201).json({
        success: true,
        message: "Enquiry submitted successfully and logged to recipient inbox.",
        enquiry: newEnquiry,
        targetEmail: "kollamahesh1478@gmail.com"
      });
    } catch (err) {
      console.error("Error creating enquiry:", err);
      return res.status(500).json({ success: false, error: "Internal server error." });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MAHI CLICZ AND CREATIVES Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
