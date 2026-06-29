import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check file type (images, videos & audio)
const checkFileTypes = (file, cb) => {
  const filetypes = /jpg|jpeg|png|webp|mp4|mov|avi|mkv|webm|ogg|wav|mp3|m4a/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image|video|audio/.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images, Videos & Audio only (jpg, jpeg, png, webp, mp4, mov, avi, mkv, webm, ogg, wav, mp3, m4a)!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter(req, file, cb) {
    checkFileTypes(file, cb);
  },
});

export default upload;
