import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "OMEGA_CORE_SECRET";
const PORT = 8000;

// Rate limit: 100 req / menit
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// Dummy DB (ganti sesuai kebutuhan)
const USERS = {
  admin: { pass: bcrypt.hashSync("pi-core",10), role:"ADMIN", email:"admin@pi.net" },
  ops:   { pass: bcrypt.hashSync("pi-ops",10),  role:"OPS",   email:"ops@pi.net" },
  view:  { pass: bcrypt.hashSync("pi-view",10), role:"VIEW",  email:"view@pi.net" }
};

let OTP = {};

// ===== LOGIN: kirim OTP =====
app.post("/login", (req,res)=>{
  const {user,pass} = req.body;
  const rec = USERS[user];
  if(!rec || !bcrypt.compareSync(pass, rec.pass)) return res.sendStatus(401);

  const code = Math.floor(100000 + Math.random()*900000).toString();
  OTP[user] = code;
  console.log("🔐 OTP for", user, ":", code); // simulasi kirim email
  res.json({status:"OTP_SENT"});
});

// ===== VERIFY OTP → JWT =====
app.post("/verify", (req,res)=>{
  const {user,otp} = req.body;
  if(OTP[user] !== otp) return res.sendStatus(403);
  delete OTP[user];

  const token = jwt.sign({u:user, role: USERS[user].role}, SECRET, {expiresIn:"2h"});
  res.json({token});
});

// ===== MIDDLEWARE AUTH =====
function auth(role){
  return (req,res,next)=>{
    const h = req.headers.authorization;
    if(!h) return res.sendStatus(401);
    try{
      const d = jwt.verify(h.split(" ")[1], SECRET);
      if(role && d.role !== role) return res.sendStatus(403);
      req.user = d;
      next();
    }catch(e){ res.sendStatus(401); }
  };
}

// ===== PROTECTED API =====
app.get("/api/status", auth(), (req,res)=>{
  res.json({ user:req.user, time:new Date(), msg:"CORE++++ ONLINE" });
});

app.listen(PORT, ()=>console.log("😈 CORE++++ Server on http://localhost:"+PORT));
