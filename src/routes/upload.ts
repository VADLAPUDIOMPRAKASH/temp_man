import { Router } from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';

const router = Router();

// Store files in memory instead of disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt|zip)$/i.test(
      file.originalname
    );
    if (allowed) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

router.post(
  '/',
  auth,
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    // Convert file buffer to Base64
    const base64Data = req.file.buffer.toString('base64');
    
    res.json({ 
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      data: base64Data
    });
  }
);

export default router;
