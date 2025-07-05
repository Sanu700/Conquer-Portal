import express from 'express';
import db from '../db.mjs';

const router = express.Router();

// Helper function to decode JWT token
function decodeToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

// 🧠 GET enriched slots list (with names)
router.get('/slots', async (req, res) => {
  const user = decodeToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await db.read();
  const role = user.role;

  const rawSlots =
    role === 'mentor'
      ? db.data.slots.filter(s => s.mentorEmail === user.email)
      : db.data.slots.filter(s => !s.isBooked);

  const enrichedSlots = rawSlots.map(slot => {
    const mentor = db.data.users.find(u => u.email === slot.mentorEmail);
    const founder = slot.bookedBy
      ? db.data.users.find(u => u.email === slot.bookedBy)
      : null;

    return {
      ...slot,
      mentorName: mentor?.name || slot.mentorName || slot.mentorEmail,
      bookedByName: founder?.name || slot.bookedByName || slot.bookedBy || null,
    };
  });

  res.json(enrichedSlots);
});

export default router;
