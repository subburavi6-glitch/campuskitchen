import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Units endpoints
router.get('/units', authenticateToken, async (req, res) => {
  try {
    const units = await req.prisma.unit.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(units);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/units', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const unit = await req.prisma.unit.create({
      data: req.body
    });
    res.status(201).json(unit);
  } catch (error) {
    console.error('Create unit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/units/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const unit = await req.prisma.unit.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(unit);
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/units/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    // Check if unit is being used
    const itemCount = await req.prisma.item.count({
      where: { unitId: req.params.id }
    });

    if (itemCount > 0) {
      return res.status(400).json({ error: 'Cannot delete unit with existing items' });
    }

    await req.prisma.unit.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Storage Types endpoints
router.get('/storage-types', authenticateToken, async (req, res) => {
  try {
    const storageTypes = await req.prisma.storageType.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(storageTypes);
  } catch (error) {
    console.error('Get storage types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/storage-types', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const storageType = await req.prisma.storageType.create({
      data: req.body
    });
    res.status(201).json(storageType);
  } catch (error) {
    console.error('Create storage type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/storage-types/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const storageType = await req.prisma.storageType.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(storageType);
  } catch (error) {
    console.error('Update storage type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/storage-types/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    // Check if storage type is being used
    const itemCount = await req.prisma.item.count({
      where: { storageTypeId: req.params.id }
    });

    if (itemCount > 0) {
      return res.status(400).json({ error: 'Cannot delete storage type with existing items' });
    }

    await req.prisma.storageType.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Storage type deleted successfully' });
  } catch (error) {
    console.error('Delete storage type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vendor Categories endpoints
router.get('/vendor-categories', authenticateToken, async (req, res) => {
  try {
    const vendorCategories = await req.prisma.vendorCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(vendorCategories);
  } catch (error) {
    console.error('Get vendor categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vendor-categories', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const vendorCategory = await req.prisma.vendorCategory.create({
      data: req.body
    });
    res.status(201).json(vendorCategory);
  } catch (error) {
    console.error('Create vendor category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vendor-categories/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const vendorCategory = await req.prisma.vendorCategory.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(vendorCategory);
  } catch (error) {
    console.error('Update vendor category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/vendor-categories/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    // Check if vendor category is being used
    const vendorCount = await req.prisma.vendor.count({
      where: { categoryId: req.params.id }
    });

    if (vendorCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing vendors' });
    }

    await req.prisma.vendorCategory.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Vendor category deleted successfully' });
  } catch (error) {
    console.error('Delete vendor category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;