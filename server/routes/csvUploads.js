import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/csv/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

// Upload CSV
router.post('/', authenticateToken, requireRole(['ADMIN', 'FNB_MANAGER']), upload.single('csv'), async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create upload record
    const uploadRecord = await req.prisma.csvUpload.create({
      data: {
        uploadType: type,
        filename: file.originalname,
        uploadedBy: req.user.id,
        status: 'PROCESSING'
      }
    });

    // Process CSV file
    processCSVFile(file.path, type, uploadRecord.id, req.prisma);

    res.json({ 
      message: 'CSV upload started successfully',
      uploadId: uploadRecord.id 
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upload history
router.get('/', authenticateToken, requireRole(['ADMIN', 'FNB_MANAGER']), async (req, res) => {
  try {
    const uploads = await req.prisma.csvUpload.findMany({
      include: {
       uploader: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(uploads);
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process CSV file asynchronously
async function processCSVFile(filePath, type, uploadId, prisma) {
  const results = [];
  const errors = [];
  let totalRows = 0;
  let successfulRows = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        totalRows++;
        results.push(data);
      })
      .on('end', async () => {
        try {
          // Process based on type
          switch (type) {
            case 'items':
              await processItemsCSV(results, errors, prisma);
              break;
            case 'categories':
              await processCategoriesCSV(results, errors, prisma);
              break;
            case 'recipes':
              await processRecipesCSV(results, errors, prisma);
              break;
            case 'students':
              await processStudentsCSV(results, errors, prisma);
              break;
            default:
              throw new Error('Invalid upload type');
          }

          successfulRows = totalRows - errors.length;

          // Update upload record
          await prisma.csvUpload.update({
            where: { id: uploadId },
            data: {
              totalRows,
              successfulRows,
              failedRows: errors.length,
              errorLog: errors,
              status: errors.length === 0 ? 'COMPLETED' : 'COMPLETED'
            }
          });

          // Clean up file
          fs.unlinkSync(filePath);
          
          resolve({ totalRows, successfulRows, errors });
        } catch (error) {
          await prisma.csvUpload.update({
            where: { id: uploadId },
            data: {
              status: 'FAILED',
              errorLog: [{ error: error.message }]
            }
          });
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Process items CSV
async function processItemsCSV(data, errors, prisma) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      // Find or create category
      let category = await prisma.category.findUnique({
        where: { name: row.category_name }
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: row.category_name }
        });
      }

      // Find vendor if specified
      let vendorId = null;
      if (row.preferred_vendor_name) {
        const vendor = await prisma.vendor.findFirst({
          where: { name: row.preferred_vendor_name }
        });
        vendorId = vendor?.id;
      }

      // Create item
      await prisma.item.create({
        data: {
          name: row.name,
          sku: row.sku,
          unit: row.unit,
          categoryId: category.id,
          preferredVendorId: vendorId,
          moq: parseInt(row.moq) || 0,
          reorderPoint: parseInt(row.reorder_point) || 0,
          storageType: row.storage_type,
          perishable: row.perishable === 'true'
        }
      });
    } catch (error) {
      errors.push({ row: i + 1, error: error.message, data: row });
    }
  }
}

// Process categories CSV
async function processCategoriesCSV(data, errors, prisma) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      await prisma.category.upsert({
        where: { name: row.name },
        update: {},
        create: { name: row.name }
      });
    } catch (error) {
      errors.push({ row: i + 1, error: error.message, data: row });
    }
  }
}

// Process recipes CSV
async function processRecipesCSV(data, errors, prisma) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      // Find or create dish
      let dish = await prisma.dish.findFirst({
        where: { name: row.dish_name }
      });

      if (!dish) {
        dish = await prisma.dish.create({
          data: { name: row.dish_name }
        });
      }

      // Find item
      const item = await prisma.item.findFirst({
        where: { name: row.item_name }
      });

      if (!item) {
        throw new Error(`Item '${row.item_name}' not found`);
      }

      // Create recipe
      await prisma.recipe.upsert({
        where: {
          dishId_itemId: {
            dishId: dish.id,
            itemId: item.id
          }
        },
        update: {
          qtyPerStudent: parseFloat(row.qty_per_student)
        },
        create: {
          dishId: dish.id,
          itemId: item.id,
          qtyPerStudent: parseFloat(row.qty_per_student)
        }
      });
    } catch (error) {
      errors.push({ row: i + 1, error: error.message, data: row });
    }
  }
}

// Process students CSV
async function processStudentsCSV(data, errors, prisma) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      const qrCode = `QR_${row.register_number}_${Math.random().toString(36).substr(2, 8)}`;
      
      await prisma.student.upsert({
        where: { registerNumber: row.register_number },
        update: {
          name: row.name,
          mobileNumber: row.mobile_number,
          email: row.email,
          roomNumber: row.room_number,
          userType: row.user_type || 'STUDENT',
          employeeId: row.employee_id,
          department: row.department
        },
        create: {
          registerNumber: row.register_number,
          name: row.name,
          mobileNumber: row.mobile_number,
          email: row.email,
          roomNumber: row.room_number,
          qrCode,
          userType: row.user_type || 'STUDENT',
          employeeId: row.employee_id,
          department: row.department
        }
      });
    } catch (error) {
      errors.push({ row: i + 1, error: error.message, data: row });
    }
  }
}

export default router;